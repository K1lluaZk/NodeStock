import dotenv from 'dotenv'
dotenv.config()

export const {
  PORT = 3000,
  SALT_ROUNDS = 10,
  SECRET_JWT_KEY,
  REFRESH_SECRET_KEY,
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY
} = process.env
