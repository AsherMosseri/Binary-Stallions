const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const crypto = require('crypto')

initializeApp()

const COACH_EMAIL = 'declan-breen@binarystallions.app'
const TEAM_DOMAIN = '@binarystallions.app'
const RESETS = 'pinResets'

function cleanEmail(email) {
  if (typeof email !== 'string' || !email.endsWith(TEAM_DOMAIN) || email === COACH_EMAIL) {
    throw new HttpsError('invalid-argument', 'Pick a team member.')
  }
  return email
}

async function userFor(email) {
  try {
    return await getAuth().getUserByEmail(email)
  } catch {
    throw new HttpsError('not-found', 'That person hasn’t signed up yet.')
  }
}

// Coach clears a PIN. The old PIN stops working right away, and the person picks a new one
// the next time they sign in. The coach never sees or sets the new PIN.
exports.requestPinReset = onCall({ region: 'us-central1' }, async (request) => {
  if (request.auth?.token?.email !== COACH_EMAIL) {
    throw new HttpsError('permission-denied', 'Only the coach can reset PINs.')
  }
  const email = cleanEmail(request.data?.email)
  const user = await userFor(email)

  // Replace the password with a random one nobody knows, so the old PIN can't sign in.
  await getAuth().updateUser(user.uid, { password: crypto.randomBytes(24).toString('base64') })
  await getFirestore().collection(RESETS).doc(email).set({
    requestedAt: FieldValue.serverTimestamp(),
    requestedBy: COACH_EMAIL,
  })
  return { ok: true }
})

// Sign-in screen asks: is a PIN reset waiting for this name?
exports.pinResetPending = onCall({ region: 'us-central1' }, async (request) => {
  const email = cleanEmail(request.data?.email)
  const snap = await getFirestore().collection(RESETS).doc(email).get()
  return { pending: snap.exists }
})

// The person sets their own new PIN, but only while a coach reset is waiting for them.
exports.setNewPin = onCall({ region: 'us-central1' }, async (request) => {
  const email = cleanEmail(request.data?.email)
  const teamCode = request.data?.teamCode
  const pin = request.data?.pin
  if (typeof teamCode !== 'string' || teamCode.trim().length < 3) {
    throw new HttpsError('invalid-argument', 'Enter the team code.')
  }
  if (typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
    throw new HttpsError('invalid-argument', 'Your PIN is 4 digits.')
  }

  const ref = getFirestore().collection(RESETS).doc(email)
  if (!(await ref.get()).exists) {
    throw new HttpsError('failed-precondition', 'No PIN reset is waiting for this name.')
  }

  const user = await userFor(email)
  await getAuth().updateUser(user.uid, { password: `${teamCode.trim()}:${pin}` })
  await ref.delete()
  return { ok: true }
})
