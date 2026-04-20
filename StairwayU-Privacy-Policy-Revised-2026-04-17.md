# StairwayU Privacy Policy — Revised Draft (for Lawyer Review)

**Status:** Draft as of 2026-04-17. NOT LIVE. Revised from the current `/privacy` page (last updated 2026-03-28).

**Prepared for:** External legal counsel review before replacing live copy.

---

## Summary of changes from current live policy

| # | Change | Reason |
|---|---|---|
| 1 | Added **counselor-sharing** disclosure (Section 5) | Counselors product exists; students may opt in to share data with counselors via invite code. Current policy doesn't mention this. |
| 2 | Added **automated decision-making** disclosure (new Section 6) | Admission-chance estimates, Stairway Ranking, and strategy outputs are algorithmic. GDPR Art. 22 and some US state laws (CO, CT, VA) require disclosure. |
| 3 | Expanded **AI processing** section | Named specific provider (Google Gemini 2.5 Flash), clarified what data is sent (essay text and profile stats only, not full account), noted no training. |
| 4 | Added **analytics** placeholder | Need legal to confirm what product analytics we run (Posthog? Vercel Analytics? Plausible? none?). Drafted conservatively. |
| 5 | Added **international data transfers** (new Section 9) | Supabase, Stripe, and Google process data in US and EU. Need SCC/DPF coverage statement. |
| 6 | Added **retention periods** (specific) | Current policy only says "while account is active." Added 18-month dormant-account deletion (optional; confirm with counsel). |
| 7 | Added **breach notification timeline** | 72 hours of discovery (GDPR standard; also aligns with most US state laws). |
| 8 | Added **CCPA "Do Not Sell or Share" explicit language** | California Consumer Privacy Act requires specific wording since Jan 2023. |
| 9 | Added **parental consent workflow description** | Current policy references it but doesn't describe the mechanism. Draft describes signup-flow attestation + optional guardian email. |
| 10 | Added **Stripe PCI scope** clarification | Clearer statement that we never touch card data. |
| 11 | Added **data subject rights workflow** | Described the actual mechanism for deletion, export, access — not just "email us." |
| 12 | Clarified **College Scorecard** is a public dataset we query, not a data-sharing partner | Avoids confusion about whether our users' data is sent to the federal gov. |
| 13 | Removed "Row-level security (RLS)" from public-facing security list | Replaced with plain-English equivalent. Technical term isn't meaningful to a consumer; could read as overclaim. |

---

## Open questions for counsel

1. ~~**Entity name:**~~ **RESOLVED 2026-04-17 (Ian): Dietrich Consulting, LLC.** Operating entity is Dietrich Consulting, LLC. No "Stairway U Inc." exists anywhere in the codebase — earlier note in this doc was incorrect. Privacy + Terms already name "Dietrich Consulting LLC." **Follow-up (optional cosmetic):** landing + /parents footers currently show "© 2026 Stairway U" with no entity form — consider "© 2026 Dietrich Consulting, LLC" or "Stairway U, a product of Dietrich Consulting, LLC" for consistency with Privacy/Terms.

2. **Address:** We don't publish a physical address. Several state privacy laws (CCPA/CPRA, CT, CO) effectively require a contact method that isn't just email. Do we add a PO Box or registered agent address?

3. **Analytics stack:** Confirm which analytics we actually run so we can disclose accurately. Candidates: Vercel Analytics, Posthog, Plausible, Google Analytics. The current policy implies "no third-party tracking cookies" — is that still accurate?

4. **Counselor sharing mechanism:** When a student enters a counselor's 8-character invite code, they consent to share profile + college list + progress with that counselor. Need to confirm:
   - Is that in-app consent sufficient under FERPA/SOPIPA (even though we're not a school-contracted vendor)?
   - Is parental consent required if the student is under 18?
   - Can the student revoke and does revocation scrub the counselor's cached view?

5. **AI training:** The draft says "AI providers are contractually prohibited from using your data for model training." Verify this is true of our current Gemini contract (Gemini API standard terms do state no training on API inputs by default, but confirm).

6. **Dormant account auto-deletion:** Current draft proposes 18 months. This is a policy choice — some comparable services use 24 or 36 months. May affect user experience if students come back after a gap year.

7. **Breach notification timeline:** Drafted 72 hours. Some US state laws specify shorter (e.g., MA requires "as soon as practicable"). Verify the binding shorter timeline.

8. **International users:** Do we actually want to serve EU/UK users? If yes, we need a GDPR-compliant legal basis and potentially a DPO. If no, we should include a geographic-scope clause explicitly excluding them.

9. **Automated decision-making opt-out:** Under GDPR Art. 22 and CO/CT/VA state laws, users have the right to opt out of profiling. In our case the admission-chance calculation *is* the product — there's no meaningful "opt out." Counsel should advise how to frame this (e.g., "processing is necessary to provide the service the user requested").

10. **Business transfer notification:** Current language says "we will notify you." Do we also commit to giving users an opportunity to delete their account before transfer completes? Common practice is to do so; may or may not be legally required.

11. **California minors:** CA has specific "eraser button" rights for users under 18 (Cal. Bus. & Prof. Code § 22581). We should confirm we meet this.

12. **Texas SCOPE Act:** Took effect 2024-09-01. Applies to minors under 18 in Texas. We should verify compliance (parental consent, targeted advertising ban, mental-health feature restrictions).

13. **Biometric / facial data:** We don't collect any. Should we explicitly disclaim this to get ahead of IL BIPA-style concerns?

14. **SMS / phone:** We don't send SMS. Should we explicitly state that?

---

## Revised Privacy Policy (for lawyer review)

**Effective Date:** [TBD]
**Last Updated:** [TBD]

### 1. Introduction

StairwayU is a college-planning platform operated by Dietrich Consulting, LLC ("StairwayU," "we," "us," or "our"). This Privacy Policy explains what information we collect, how we use it, when (if ever) we share it, and the choices you have about your data when you use stairwayu.com and our related services (collectively, the "Service").

Many of our users are high school students aged 13 to 17. We designed the Service with student-privacy protections in mind and comply with applicable federal and state student-data laws. We do not use student data for advertising, do not sell student data, and do not share information with colleges without the user's direction.

### 2. Information We Collect

**Information you provide directly:**

- **Account information:** name, email address, and either a password or Google OAuth credential.
- **Academic profile:** unweighted GPA, weighted GPA, SAT score, ACT score, intended major, home state, graduation year, and optionally — extracurricular activities, career interests, and school preferences.
- **College list:** the schools you save, compare, or apply to.
- **Essays and other content:** essay drafts and feedback, scholarship entries, tasks, notes, and any text you type into the Service.
- **Payment information:** handled entirely by Stripe. We receive a subscription status and a redacted last-4-digits of the card, but we do not see or store card numbers, CVCs, or full billing details.
- **Counselor linking (optional):** if you enter a counselor's invite code, we link your account to theirs and grant them read-only access to your academic profile, college list, and progress milestones. You can revoke this link at any time from your profile.

**Information collected automatically:**

- **Usage data:** pages visited, features used, XP earned, tasks completed, and session timestamps.
- **Device information:** browser type and version, operating system, and approximate screen size.
- **Cookies:** we use essential first-party cookies for authentication and session management. [If analytics are in use, disclose them here. As of this draft: NO third-party advertising cookies, NO cross-site tracking.]

### 3. How We Use Your Information

We use your information to:

- Provide and operate the Service, including storing your profile, college list, essays, and progress.
- Calculate admission-chance estimates, program rankings, and other algorithmic outputs tailored to your profile.
- Process subscription payments through Stripe and manage trial eligibility.
- Send account-related emails such as sign-up confirmations, password resets, and billing notices. These are transactional and cannot be opted out of while your account is active.
- Send optional progress emails (weekly nudges, streak reminders) which you can disable at any time from your profile.
- Generate AI-powered essay feedback, strategy suggestions, and scholarship matches.
- Prevent abuse and enforce our Terms of Service.

**We do not sell your personal information.** We do not share your information with advertisers, and we do not build advertising profiles from student data.

### 4. AI Processing

StairwayU uses Google's Gemini API (specifically the Gemini 2.5 Flash model, as of this policy) to generate essay feedback, college strategy, and scholarship recommendations. When you use these features, the relevant content you have provided — for example, the text of an essay you submit for critique, or your profile stats — is sent to Google for processing.

Google processes this data under the Google Cloud Customer Agreement and the Gemini API Additional Terms. Per Google's standard API terms, inputs submitted to the Gemini API are not used to train Google's foundation models.

We do not use your content to train any machine-learning model of our own.

### 5. When We Share Your Information

We share your information only in the following circumstances:

- **Service providers (sub-processors) who help us operate the Service:**
  - **Supabase** — database hosting, authentication, and row-level security (US)
  - **Stripe** — payment processing (US)
  - **Google (Gemini API)** — AI features (US)
  - **Upstash** — rate limiting (US)
  - **Vercel** — web hosting and edge delivery (US)
  - **Resend** — transactional email (US)
  
  Each provider processes data under a written agreement and only as needed to provide its service.

- **Counselors you link to.** If you enter a counselor's invite code, we share your academic profile, college list, and progress milestones with that counselor. We do not share your essays, payment information, or AI conversations with counselors unless you expressly submit them.

- **Legal compliance.** We may disclose information if required by law, court order, or valid legal process, or to protect the rights, safety, or property of StairwayU, our users, or the public.

- **Business transfers.** If StairwayU is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify users by email and give you an opportunity to delete your account before the transfer takes effect.

**We never share your information with colleges, admissions offices, or third-party recruiters without your explicit direction.** Colleges cannot buy access to our users or their lists.

Data from the U.S. Department of Education College Scorecard flows *into* our Service (we query a public federal dataset). Your personal information is never sent to the Department of Education.

### 6. Automated Decision-Making and Algorithmic Outputs

Several features of the Service rely on automated algorithms:

- **Admission-chance estimates** are computed from your GPA, test scores, and each school's published acceptance data using a statistical logistic model. The output is an estimate, not a prediction.
- **Stairway Ranking** is a percentile-ranked composite score mapped to a letter grade (A+ through C), computed from federal data about each program.
- **Strategy recommendations** are generated with Google's Gemini API using your profile stats as input.

These algorithms do not make legally or educationally binding decisions about you. Colleges, scholarships, and counselors make their own decisions independently. For the full methodology, see [stairwayu.com/methodology](/methodology).

You may choose not to use any of these features. Because the features are the Service, disabling all of them would make the Service unusable; however, you can delete your account at any time.

### 7. Data Retention and Deletion

We retain your data for as long as your account is active. You may delete your account at any time from your profile page, which permanently removes:

- Your profile and academic information
- All essays, tasks, scholarships, notes, and college lists
- XP records, streaks, milestones, and referral history
- Email preferences and notification settings
- Counselor links (you are unlinked from any counselors you were connected to)

After account deletion, your data is irretrievably removed from our production database within 30 days. Backups containing deleted data are overwritten within 90 days.

If an account is inactive (no sign-in, no activity) for more than 18 consecutive months, we will send a warning email to the account's email address. If the account remains inactive for 30 days after that warning, we will delete it automatically.

Stripe retains payment records independently under its own retention policies as required for financial and tax compliance. Deleting your StairwayU account cancels any active subscription but does not erase Stripe's payment history.

### 8. Data Security

We implement industry-standard safeguards to protect your data, including:

- Encryption in transit (HTTPS/TLS) and at rest for all stored information.
- Access controls ensuring users can only read and write their own data.
- Secure authentication through Supabase Auth, with support for email/password and Google OAuth.
- No storage of raw payment credentials — all card processing is handled by Stripe, which is PCI-DSS Level 1 certified.
- Regular security reviews of our codebase and sub-processor contracts.

No system is 100% secure. If we become aware of a data breach materially affecting your information, we will notify affected users without undue delay and within 72 hours of discovery where feasible, as required by applicable law.

### 9. International Data Transfers

StairwayU is a U.S.-based service. Our sub-processors (Supabase, Stripe, Google, Upstash, Vercel, Resend) operate data centers in the United States and may use secondary data centers in other regions. If you access the Service from outside the United States, your data will be transferred to and processed in the U.S.

Where required, our sub-processors maintain Standard Contractual Clauses (SCCs) or are certified under the EU–U.S. Data Privacy Framework for transfers from the European Economic Area, the United Kingdom, and Switzerland.

StairwayU is designed for users in the United States. [If we do not intend to serve EU users, counsel should advise whether to include an explicit geographic-restriction clause.]

### 10. Children's Privacy (COPPA)

StairwayU is not directed at children under 13 years of age. We do not knowingly collect personal information from children under 13.

If you are a parent or guardian and you believe your child under 13 has provided us with personal information, please contact us at StairwayUHelp@gmail.com. We will delete the account and all associated data within 10 business days of verification.

For users aged 13–17, we collect only the information described in Section 2 above, limited to what is necessary to provide the Service. We do not use student data for targeted advertising and do not sell student data.

We encourage parents of minor students to review this policy together and to contact us with any questions.

### 11. Student Privacy (FERPA, SOPIPA, SCOPE Act)

StairwayU is a direct-to-consumer product. We do not contract with schools or school districts, and we do not receive data from school information systems. We are not a "school official" under the Family Educational Rights and Privacy Act (FERPA).

Our practices nonetheless align with the principles of student-data privacy laws, including California's Student Online Personal Information Protection Act (SOPIPA) and the Texas Securing Children Online through Parental Empowerment (SCOPE) Act:

- We do not sell student information.
- We do not use student data for targeted advertising or third-party marketing.
- We do not build advertising or behavioral profiles of students.
- We do not knowingly collect precise geolocation from minors.
- Students and their parents or guardians may access, correct, and delete stored data at any time.

### 12. Your Rights and How to Exercise Them

Depending on where you live, you may have the following rights. We honor these rights for all our users regardless of jurisdiction, unless doing so would conflict with a legal obligation.

- **Access** — see what personal information we hold about you. Most of your data is visible inside the Service (your profile page, your college list, your essays). For a full export, email StairwayUHelp@gmail.com.
- **Correct** — update inaccurate information from your profile page.
- **Delete** — delete your account and all associated data from your profile page, or by emailing StairwayUHelp@gmail.com.
- **Export (data portability)** — receive a copy of your data in a machine-readable format (JSON). Email StairwayUHelp@gmail.com.
- **Opt out of non-essential communications** — disable weekly progress emails from your profile.
- **Opt out of sale or sharing of personal information.** StairwayU does not sell or share personal information as those terms are defined under the California Consumer Privacy Act (CCPA) or equivalent laws. There is nothing to opt out of because we do not do it.

California residents have additional rights under the CCPA/CPRA, including the right to know categories of information collected and to request deletion. Colorado, Connecticut, Virginia, Utah, and Texas residents have similar rights under their respective state laws. To exercise any of these rights, email StairwayUHelp@gmail.com. We will verify your identity through the email address associated with your account and respond within 45 days.

You also have the right to lodge a complaint with a supervisory authority (for EEA/UK users) or your state attorney general.

### 13. Changes to This Policy

We may update this Privacy Policy as our practices evolve. If we make material changes, we will notify registered users by email and display a notice within the Service at least 14 days before the change takes effect. The "Last Updated" date at the top of this policy reflects the most recent revision.

### 14. Contact Us

If you have questions about this policy or about how we handle your information, please contact:

**StairwayU**
Email: StairwayUHelp@gmail.com

Mail: [physical address — CONFIRM with counsel]

---

## Implementation notes (for StairwayU team, not the public policy)

- Do not ship to the live `/privacy` page until counsel has reviewed and signed off on the open questions above.
- Once approved, update `src/app/(auth)/privacy/page.tsx` and bump the `Last Updated` date.
- Consider adding a `version` field so returning users see a banner when the policy materially changes.
- The counselor-linking consent flow (Section 5) may need an in-app copy update to match this policy — check the invite-code entry screen in the onboarding flow and ProfilePageClient.
- Add a Data Subject Access Request (DSAR) intake route at `/api/privacy/request` — currently requests are manual via email.
