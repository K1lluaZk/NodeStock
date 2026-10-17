import admin from 'firebase-admin'
import {
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY_FORMATTED,
  FIREBASE_PROJECT_ID
} from './config.js'

const serviceAccount = {
  projectId: FIREBASE_PROJECT_ID,
  clientEmail: FIREBASE_CLIENT_EMAIL,
  privateKey: FIREBASE_PRIVATE_KEY_FORMATTED
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

export const db = admin.firestore()
