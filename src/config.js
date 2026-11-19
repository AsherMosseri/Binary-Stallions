export const TEAM_NAME = 'Binary Stallions'
export const SEASON = 'BIOGLOW · FOUNDERS EDITION'

// Accounts are created from this roster. Each person signs in with their name,
// the team code, and a 4-digit PIN. Internally that becomes an email + password.
export const EMAIL_DOMAIN = 'binarystallions.app'

export const ROSTER = [
  { name: 'Declan Breen', admin: true },
  { name: 'Abdullah Sultan Omer Kirimli' },
  { name: 'Cameron Morrissey' },
  { name: 'Joseph Foldessy' },
  { name: 'Jason Liang' },
  { name: 'Daniel Ortiz-Quinones' },
  { name: 'Hridaan Patel' },
  { name: 'Arda Erbay' },
  { name: 'Sebastian Cordova Chain' },
]

export const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const emailFor = (name) => `${slugify(name)}@${EMAIL_DOMAIN}`

export const ADMIN_EMAIL = emailFor('Declan Breen')

export const firstName = (name) => name.split(' ')[0]
