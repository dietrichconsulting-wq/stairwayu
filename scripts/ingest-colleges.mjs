#!/usr/bin/env node
/**
 * Ingest College Scorecard data into the `colleges` table for programmatic SEO pages.
 *
 * Usage:
 *   node scripts/ingest-colleges.mjs              # full ingest, no AI summaries
 *   node scripts/ingest-colleges.mjs --summaries  # also generate Gemini Flash summaries
 *   node scripts/ingest-colleges.mjs --limit=200  # cap pages for a smoke test
 *
 * Required env (read from .env.local or process env):
 *   COLLEGE_SCORECARD_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GEMINI_API_KEY  (only when --summaries)
 *
 * Filters to 4-year, degree-granting, currently-operating schools.
 * Slug = kebab-case(name); collisions get "-<ipeds>" suffixed.
 * Idempotent: upserts on ipeds_id.
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

config({ path: '.env.local' });
config({ path: '.env' });

const argv = process.argv.slice(2);
const FLAG = (k) => argv.find((a) => a === `--${k}` || a.startsWith(`--${k}=`));
const VAL  = (k) => { const f = FLAG(k); if (!f) return null; const i = f.indexOf('='); return i < 0 ? true : f.slice(i + 1); };

const WITH_SUMMARIES = !!VAL('summaries');
const LIMIT_PAGES    = VAL('limit') ? parseInt(VAL('limit'), 10) : Infinity;
const PER_PAGE       = 100;

const SCORECARD_KEY = process.env.COLLEGE_SCORECARD_API_KEY;
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_KEY    = process.env.GEMINI_API_KEY;

if (!SCORECARD_KEY) { console.error('Missing COLLEGE_SCORECARD_API_KEY'); process.exit(1); }
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env'); process.exit(1); }
if (WITH_SUMMARIES && !GEMINI_KEY) { console.error('Missing GEMINI_API_KEY (required for --summaries)'); process.exit(1); }

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const FIELDS = [
  'id',
  'school.name', 'school.city', 'school.state', 'school.school_url', 'school.type',
  'latest.admissions.admission_rate.overall',
  'latest.admissions.sat_scores.average.overall',
  'latest.admissions.sat_scores.25th_percentile.critical_reading',
  'latest.admissions.sat_scores.75th_percentile.critical_reading',
  'latest.admissions.sat_scores.25th_percentile.math',
  'latest.admissions.sat_scores.75th_percentile.math',
  'latest.admissions.act_scores.midpoint.cumulative',
  'latest.cost.tuition.in_state', 'latest.cost.tuition.out_of_state',
  'latest.cost.avg_net_price.public', 'latest.cost.avg_net_price.private',
  'latest.student.size',
  'latest.student.retention_rate.four_year.full_time',
  'latest.completion.rate_suppressed.4yr',
  'latest.earnings.10_yrs_after_entry.median',
].join(',');

function slugify(name, ipedsId) {
  const base = String(name)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return base || `school-${ipedsId}`;
}

function pct(x) { return x == null ? null : Math.round(x * 100); }
function int(x) { return x == null ? null : Math.round(x); }

function mapRow(r) {
  const isPublic = r['school.type'] === 1;
  const cr25 = r['latest.admissions.sat_scores.25th_percentile.critical_reading'];
  const cr75 = r['latest.admissions.sat_scores.75th_percentile.critical_reading'];
  const m25  = r['latest.admissions.sat_scores.25th_percentile.math'];
  const m75  = r['latest.admissions.sat_scores.75th_percentile.math'];
  const enrollment = r['latest.student.size'] || null;

  return {
    ipeds_id: String(r.id),
    name: r['school.name'],
    city: r['school.city'] || null,
    state: r['school.state'] || null,
    url: r['school.school_url'] || null,
    control: isPublic ? 'Public' : (r['school.type'] === 2 ? 'Private Nonprofit' : 'Private For-Profit'),
    is_public: isPublic,
    admission_rate: pct(r['latest.admissions.admission_rate.overall']),
    avg_sat:        int(r['latest.admissions.sat_scores.average.overall']),
    sat_25: (cr25 && m25) ? cr25 + m25 : null,
    sat_75: (cr75 && m75) ? cr75 + m75 : null,
    act_midpoint: r['latest.admissions.act_scores.midpoint.cumulative'] || null,
    tuition_in_state:     r['latest.cost.tuition.in_state'] || null,
    tuition_out_of_state: r['latest.cost.tuition.out_of_state'] || null,
    avg_net_price: isPublic
      ? (r['latest.cost.avg_net_price.public']  || null)
      : (r['latest.cost.avg_net_price.private'] || null),
    enrollment,
    retention_rate: pct(r['latest.student.retention_rate.four_year.full_time']),
    grad_rate_4yr:  pct(r['latest.completion.rate_suppressed.4yr']),
    median_earnings_10yr: r['latest.earnings.10_yrs_after_entry.median'] || null,
    // Use enrollment as a popularity proxy until we have real search data.
    popularity: enrollment || 0,
  };
}

async function fetchPage(page) {
  const params = new URLSearchParams({
    api_key: SCORECARD_KEY,
    fields: FIELDS,
    per_page: String(PER_PAGE),
    page: String(page),
    'school.degrees_awarded.predominant__range': '3..4', // bachelor's+
    'school.operating': '1',
    'latest.student.size__range': '500..',                // skip tiny / non-traditional
  });
  const url = `https://api.data.gov/ed/collegescorecard/v1/schools.json?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Scorecard ${res.status} on page ${page}`);
  return res.json();
}

async function generateSummary(row) {
  const prompt = `Write a strictly factual ~180 word overview of ${row.name} in ${row.city || ''}, ${row.state || ''}. Use ONLY these facts: control=${row.control}; enrollment=${row.enrollment}; admission rate=${row.admission_rate ?? 'unknown'}%; avg SAT=${row.avg_sat ?? 'unknown'}; ACT midpoint=${row.act_midpoint ?? 'unknown'}; in-state tuition=$${row.tuition_in_state ?? 'unknown'}; out-of-state tuition=$${row.tuition_out_of_state ?? 'unknown'}; average net price=$${row.avg_net_price ?? 'unknown'}; 4-year graduation rate=${row.grad_rate_4yr ?? 'unknown'}%. No superlatives, no rankings, no invented programs or claims. Plain prose, two short paragraphs.`;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) return null;
  const j = await res.json();
  return j?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
}

// Global slug state, populated lazily from existing DB rows on first use.
const slugByIpeds = new Map();
const usedSlugs = new Set();
let slugStateLoaded = false;

async function loadSlugState() {
  if (slugStateLoaded) return;
  const { data, error } = await sb.from('colleges').select('ipeds_id, slug');
  if (error) throw error;
  for (const row of data || []) {
    slugByIpeds.set(row.ipeds_id, row.slug);
    usedSlugs.add(row.slug);
  }
  slugStateLoaded = true;
}

async function upsertBatch(rows) {
  await loadSlugState();
  for (const r of rows) {
    const known = slugByIpeds.get(r.ipeds_id);
    if (known) {
      r.slug = known;
    } else {
      let slug = slugify(r.name, r.ipeds_id);
      if (usedSlugs.has(slug)) slug = `${slug}-${r.ipeds_id}`;
      usedSlugs.add(slug);
      slugByIpeds.set(r.ipeds_id, slug);
      r.slug = slug;
    }
    r.data_year = new Date().getFullYear();
  }
  const { error } = await sb.from('colleges').upsert(rows, { onConflict: 'ipeds_id' });
  if (error) throw error;
}

async function main() {
  console.log(`Ingesting colleges (summaries=${WITH_SUMMARIES}, limit=${LIMIT_PAGES === Infinity ? 'all' : LIMIT_PAGES})`);
  let page = 0, total = 0, totalPages = Infinity;
  while (page < Math.min(totalPages, LIMIT_PAGES)) {
    const data = await fetchPage(page);
    totalPages = Math.ceil(data.metadata.total / PER_PAGE);
    const mapped = (data.results || []).map(mapRow).filter((r) => r.name);

    if (WITH_SUMMARIES) {
      // Throttle Gemini to ~5 req/sec; batches of 5 in parallel.
      for (let i = 0; i < mapped.length; i += 5) {
        const slice = mapped.slice(i, i + 5);
        await Promise.all(slice.map(async (row) => { row.summary = await generateSummary(row); }));
        await new Promise((r) => setTimeout(r, 250));
      }
    }

    await upsertBatch(mapped);
    total += mapped.length;
    console.log(`  page ${page + 1}/${totalPages} → upserted ${mapped.length} (running total ${total})`);
    page += 1;
  }
  console.log(`Done. ${total} colleges in DB.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
