// Newest first. Add a new entry every time the version in package.json goes up.
export const RELEASES = [
  {
    version: '1.0.6',
    date: '2026-11-18',
    title: 'Judging centering',
    items: [
      'Text in the Core Values pills on the Judging tab sits in the middle of each pill',
    ],
  },
  {
    version: '1.0.5',
    date: '2026-11-18',
    title: 'Polish and fixes',
    items: [
      'Tabs switch smoothly now, without the flicker or jump',
      'Date pickers, dropdowns, and confirm prompts match the app instead of the iPad’s own popups',
      'Mission total shows the full robot max of 530',
      'Layouts centered and spaced properly on iPad and phone',
      'Chat scrolls within the message list instead of the whole page',
    ],
  },
  {
    version: '1.0.4',
    date: '2026-11-18',
    title: 'Team plan',
    items: [
      'Coach can post what the team is doing today or this week in the Admin tab',
      'The plan shows at the top of HQ',
    ],
  },
  {
    version: '1.0.3',
    date: '2026-11-18',
    title: 'Requests',
    items: [
      'New Requests tab: send a feature, a bug, or an idea',
      'Vote on requests. The most-wanted ones rise to the top',
      'Coach can set each request’s status (planned, working on it, done, won’t do)',
    ],
  },
  {
    version: '1.0.2',
    date: '2026-11-18',
    title: 'Update log',
    items: [
      'Update log: tap the version at the bottom to see every release',
      'Update card on HQ shows what changed the first time you open a new version',
    ],
  },
  {
    version: '1.0.1',
    date: '2026-11-18',
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
