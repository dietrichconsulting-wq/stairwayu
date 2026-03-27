export const MILESTONES = [
  { key: 'psat_taken',         label: 'PSAT Taken',             icon: '\u{1F4DD}', desc: 'You took the PSAT \u2014 your College Board journey begins.',                    phase: 'Prep'     },
  { key: 'schools_researched', label: 'Schools Researched',     icon: '\u{1F52D}', desc: 'Built your initial list of colleges.',                                        phase: 'Prep'     },
  { key: 'first_sat',          label: 'First SAT Complete',     icon: '\u270F\uFE0F', desc: 'First official SAT score in the books.',                                     phase: 'Prep'     },
  { key: 'campus_visits_done', label: 'Campus Visits Done',     icon: '\u{1F3EB}', desc: 'Visited campuses and got a feel for your schools.',                           phase: 'Research' },
  { key: 'recommenders_asked', label: 'Recommenders Asked',     icon: '\u{1F91D}', desc: 'Secured your letter writers.',                                                phase: 'Research' },
  { key: 'essay_drafted',      label: 'Essay Drafted',          icon: '\u270D\uFE0F', desc: 'Your Common App personal statement is drafted.',                             phase: 'Apply'    },
  { key: 'commonapp_started',  label: 'Common App Started',     icon: '\u{1F5A5}\uFE0F', desc: 'Your Common App account is live.',                                           phase: 'Apply'    },
  { key: 'fafsa_submitted',    label: 'FAFSA Submitted',        icon: '\u{1F4B0}', desc: 'Financial aid form submitted on time.',                                       phase: 'Apply'    },
  { key: 'apps_submitted',     label: 'Applications Submitted', icon: '\u{1F680}', desc: 'All applications are in \u2014 now you wait!',                                    phase: 'Final'    },
  { key: 'decision_made',      label: 'Decision Made',          icon: '\u{1F393}', desc: 'You committed to your school \u2014 the journey ends here and a new one begins!', phase: 'Final'    },
] as const

export type MilestoneKey = typeof MILESTONES[number]['key']
export type Phase = typeof MILESTONES[number]['phase']
