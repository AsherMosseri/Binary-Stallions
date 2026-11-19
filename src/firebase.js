import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'

// Web config is public by design. Access is controlled by Firebase Auth + firestore.rules.
const firebaseConfig = {
  apiKey: 'AIzaSyA4iEmpUgNhr4dFL2ADqtRdrMBCxuTWBYQ',
  authDomain: 'binary-stallions.firebaseapp.com',
  projectId: 'binary-stallions',
  storageBucket: 'binary-stallions.firebasestorage.app',
  messagingSenderId: '454763881405',
  appId: '1:454763881405:web:4b3dc1194e6810f4f168d4',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app, 'us-central1')
