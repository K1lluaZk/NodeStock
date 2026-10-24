import { db } from './firebase.js'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { FieldValue } from 'firebase-admin/firestore'
import { SALT_ROUNDS } from './config.js'

const usersCollection = db.collection('users')

export class UserRepository {
  static async create ({ username, password, role = 'viewer' }) {
    Validation.username(username)
    Validation.password(password)

    const snapshot = await usersCollection
      .where('username', '==', username)
      .limit(1)
      .get()

    if (!snapshot.empty) {
      throw new Error('Username already exists')
    }

    const id = crypto.randomUUID()

    const hashedPassword = await bcrypt.hash(
      password,
      SALT_ROUNDS
    )

    await usersCollection.doc(id).set({
      username,
      password: hashedPassword,
      role,
      createdAt: new Date()
    })

    return id
  }

  static async login ({ username, password }) {
    Validation.username(username)

    if (typeof password !== 'string') {
      throw new Error('Password must be a string')
    }

    const snapshot = await usersCollection
      .where('username', '==', username)
      .limit(1)
      .get()

    if (snapshot.empty) {
      throw new Error('User not found')
    }

    const userDoc = snapshot.docs[0]
    const user = userDoc.data()

    const isValid = await bcrypt.compare(
      password,
      user.password
    )

    if (!isValid) {
      throw new Error('Password is invalid')
    }

    const { password: _, ...publicUser } = user

    return {
      _id: userDoc.id,
      ...publicUser
    }
  }

  static async createPasswordResetToken ({ username }) {
    Validation.username(username)

    const snapshot = await usersCollection
      .where('username', '==', username)
      .limit(1)
      .get()

    if (snapshot.empty) {
      return null
    }

    const userDoc = snapshot.docs[0]
    const user = userDoc.data()
    const lastRequest = user.passwordResetRequestedAt?.toDate?.()

    if (lastRequest && Date.now() - lastRequest.getTime() < 60 * 1000) {
      return null
    }

    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    await userDoc.ref.update({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      passwordResetRequestedAt: new Date()
    })

    return token
  }

  static async invalidatePasswordResetToken ({ username, token }) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const snapshot = await usersCollection
      .where('username', '==', username)
      .limit(1)
      .get()

    if (snapshot.empty) return

    const userDoc = snapshot.docs[0]

    await db.runTransaction(async transaction => {
      const currentUser = await transaction.get(userDoc.ref)
      if (currentUser.data()?.passwordResetTokenHash !== tokenHash) return

      transaction.update(userDoc.ref, {
        passwordResetTokenHash: FieldValue.delete(),
        passwordResetExpiresAt: FieldValue.delete()
      })
    })
  }

  static async resetPassword ({ token, newPassword }) {
    if (typeof token !== 'string' || !/^[a-f\d]{64}$/i.test(token)) {
      throw new Error('Invalid or expired password reset link')
    }

    Validation.password(newPassword)

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const snapshot = await usersCollection
      .where('passwordResetTokenHash', '==', tokenHash)
      .limit(1)
      .get()

    if (snapshot.empty) {
      throw new Error('Invalid or expired password reset link')
    }

    const userRef = snapshot.docs[0].ref
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)

    await db.runTransaction(async transaction => {
      const userDoc = await transaction.get(userRef)
      const user = userDoc.data()
      const expiresAt = user?.passwordResetExpiresAt?.toDate?.()

      if (
        user?.passwordResetTokenHash !== tokenHash ||
        !expiresAt ||
        expiresAt.getTime() <= Date.now()
      ) {
        throw new Error('Invalid or expired password reset link')
      }

      transaction.update(userRef, {
        password: hashedPassword,
        passwordResetTokenHash: FieldValue.delete(),
        passwordResetExpiresAt: FieldValue.delete(),
        passwordResetRequestedAt: FieldValue.delete()
      })
    })
  }

  static async getAll () {
    const snapshot = await usersCollection.get()

    return snapshot.docs.map(doc => {
      const user = doc.data()

      return {
        id: doc.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
      }
    })
  }

  static async updateRole ({ id, role }) {
    const allowedRoles = [
      'admin',
      'manager',
      'viewer'
    ]

    if (!allowedRoles.includes(role)) {
      throw new Error('Rol inválido')
    }

    await usersCollection.doc(id).update({
      role
    })

    return true
  }

  static async delete ({ id }) {
    const userDoc = await usersCollection.doc(id).get()

    if (!userDoc.exists) {
      throw new Error('Usuario no encontrado')
    }

    await usersCollection.doc(id).delete()

    return true
  }
}

class Validation {
  static username (username) {
    if (typeof username !== 'string') {
      throw new Error('Username must be a string')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(username)) {
      throw new Error(
        'Username must be a valid email'
      )
    }
  }

  static password (password) {
    if (typeof password !== 'string') {
      throw new Error('Password must be a string')
    }

    if (password.length < 8) {
      throw new Error(
        'Password must be at least 8 characters long'
      )
    }

    if (!/\d/.test(password)) {
      throw new Error(
        'Password must include at least one number'
      )
    }

    if (!/[A-Z]/.test(password)) {
      throw new Error(
        'Password must include at least one uppercase letter'
      )
    }
  }
}
