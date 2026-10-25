import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'

dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)) })

const getInteger = (name, defaultValue, min, max) => {
  const rawValue = process.env[name]

  if (rawValue === undefined) return defaultValue

  const value = rawValue.trim()
  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} debe ser un número entero`)
  }

  const number = Number(value)
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    throw new Error(`${name} debe estar entre ${min} y ${max}`)
  }

  return number
}

const getRequiredValue = (name) => {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Falta configurar la variable de entorno ${name}`)
  }
  return value
}

export const PORT = getInteger('PORT', 3000, 1, 65535)
export const SALT_ROUNDS = getInteger('SALT_ROUNDS', 10, 10, 14)

export const SECRET_JWT_KEY = getRequiredValue('SECRET_JWT_KEY')
export const REFRESH_SECRET_KEY = getRequiredValue('REFRESH_SECRET_KEY')

for (const [name, secret] of [
  ['SECRET_JWT_KEY', SECRET_JWT_KEY],
  ['REFRESH_SECRET_KEY', REFRESH_SECRET_KEY]
]) {
  if (Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error(`${name} debe tener al menos 32 bytes`)
  }
}

if (SECRET_JWT_KEY === REFRESH_SECRET_KEY) {
  throw new Error('SECRET_JWT_KEY y REFRESH_SECRET_KEY deben ser distintos')
}

export const FIREBASE_PROJECT_ID = getRequiredValue('FIREBASE_PROJECT_ID')
export const FIREBASE_CLIENT_EMAIL = getRequiredValue('FIREBASE_CLIENT_EMAIL')
export const FIREBASE_PRIVATE_KEY = getRequiredValue('FIREBASE_PRIVATE_KEY')
export const FIREBASE_PRIVATE_KEY_FORMATTED =
  FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')

if (
  !FIREBASE_PRIVATE_KEY_FORMATTED.startsWith('-----BEGIN PRIVATE KEY-----') ||
  !FIREBASE_PRIVATE_KEY_FORMATTED.trimEnd().endsWith('-----END PRIVATE KEY-----')
) {
  throw new Error('FIREBASE_PRIVATE_KEY no tiene un formato PEM válido')
}
