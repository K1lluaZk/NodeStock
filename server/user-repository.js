import { db } from './firebase.js'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { SALT_ROUNDS } from './config.js'

const usersCollection = db.collection('users')

export class UserRepository {
  // Ahora aceptamos 'role' en los argumentos
  static async create ({ username, password, role = 'user' }) {
    Validation.username(username)
    Validation.password(password)

    const snapshot = await usersCollection
      .where('username', '==', username)
      .limit(1)
      .get()

    if (!snapshot.empty) {
      throw new Error('Username (email) already exists')
    }

    const id = crypto.randomUUID()
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    // Guardamos el rol en la base de datos
    await usersCollection.doc(id).set({
      username,
      password: hashedPassword,
      role, // 'admin' o 'user'
      createdAt: new Date()
    })

    return id
  }

  static async login ({ username, password }) {
    Validation.username(username)
    Validation.password(password)

    const snapshot = await usersCollection
      .where('username', '==', username)
      .limit(1)
      .get()

    if (snapshot.empty) {
      throw new Error('User not found')
    }

    const userDoc = snapshot.docs[0]
    const user = userDoc.data()

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) throw new Error('password is invalid')

    // Extraemos la contraseña y devolvemos el resto (incluyendo el ID y el ROL)
    const { password: _, ...publicUser } = user

    return {
      _id: userDoc.id,
      ...publicUser
    }
  }
}

class Validation {
  static username (username) {
    if (typeof username !== 'string') throw new Error('Username must be a string')
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(username)) {
      throw new Error('Username must be a valid email (e.g., user@domain.com)')
    }
  }

  static password (password) {
    if (typeof password !== 'string') throw new Error('Password must be a string')
    if (password.length < 8) throw new Error('Password must be at least 8 characters long')
    if (!/\d/.test(password)) throw new Error('Password must include at least one number')
    if (!/[A-Z]/.test(password)) throw new Error('Password must include at least one uppercase letter')
  }
}
