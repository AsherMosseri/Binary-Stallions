const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')

initializeApp()

const COACH_EMAIL = 'declan-breen@binarystallions.app'
const TEAM_DOMAIN = '@binarystallions.app'

// Lets the coach set a team member's PIN. Only the coach account can call it.
// The password is stored as "<team code>:<PIN>", the same format the app signs in with.
exports.resetPin = onCall({ region: 'us-central1' }, async (request) => {
  if (request.auth?.token?.email !== COACH_EMAIL) {
    throw new HttpsError('permission-denied', 'Only the coach can reset PINs.')
  }

  const { email, teamCode, pin } = request.data || {}
  if (typeof email !== 'string' || !email.endsWith(TEAM_DOMAIN) || email === COACH_EMAIL) {
    throw new HttpsError('invalid-argument', 'Pick a team member.')
  }
  if (typeof teamCode !== 'string' || teamCode.trim().length < 3) {
    throw new HttpsError('invalid-argument', 'Enter the team code.')
  }
  if (typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
    throw new HttpsError('invalid-argument', 'The new PIN is 4 digits.')
  }

  const auth = getAuth()
  let user
  try {
    user = await auth.getUserByEmail(email)
  } catch {
    throw new HttpsError('not-found', 'That person hasn’t signed up yet, so there’s no PIN to reset.')
  }

  await auth.updateUser(user.uid, { password: `${teamCode.trim()}:${pin}` })
  return { ok: true }
})
