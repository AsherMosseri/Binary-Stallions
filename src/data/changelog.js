// Newest first. Add a new entry every time the version in package.json goes up.
export const RELEASES = [
  {
    version: '1.0.2',
    date: '2026-11-19',
    title: 'Update log',
    items: [
      'Update log: tap the version at the bottom to see every release',
      'Update card on HQ shows what changed the first time you open a new version',
    ],
  },
  {
    version: '1.0.1',
    date: '2026-11-19',
    title: 'Credit and version',
    items: [
      'Version number and creator credit at the bottom of the app',
      'Tap the version to see this update log',
      'New update card on HQ when a new version goes out',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-11-18',
    title: 'First release',
    items: [
      'Team sign-in with name, team code, and PIN',
      'Loading screen built around the stallion logo',
      'HQ countdown to qualifiers and team stats',
      'All 15 BIOGLOW missions with videos and a solid/not-yet checklist',
      'Full robot-game scoresheet that matches the 2026 rulebook, with score history and trend',
      'Match timer (2:30) with split marks, and a run planner',
      'Daily log, team chat, and private messages to Declan',
      'Judging prep: session flow, rubric goals, judge questions',
      'Gear: equipment limits, pre-match checklist, attachments, code log',
      'Coach admin: qualifier date and name',
    ],
  },
]

export const CURRENT_VERSION = RELEASES[0].version
