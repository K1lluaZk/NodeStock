import { db } from './firebase.js'
import crypto from 'crypto'

const categoriesCollection = db.collection('categories')

export class CategoryRepository {
  static async create ({ name, description }) {
    Validation.name(name)
    Validation.description(description)

    const snapshot = await categoriesCollection
      .where('name', '==', name)
      .limit(1)
      .get()

    if (!snapshot.empty) {
      throw new Error('Category already exists')
    }

    const id = crypto.randomUUID()

    await categoriesCollection.doc(id).set({
      name,
      description: description ?? '',
      createdAt: new Date()
    })

    return id
  }

  static async getAll () {
    const snapshot = await categoriesCollection
      .orderBy('createdAt', 'desc')
      .get()

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  }

  static async update ({ id, name, description }) {
    if (!id || typeof id !== 'string') {
      throw new Error('Category id is required')
    }

    if (name !== undefined) Validation.name(name)
    if (description !== undefined) Validation.description(description)

    const docRef = categoriesCollection.doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      throw new Error('Category not found')
    }

    await docRef.update({
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      updatedAt: new Date()
    })
  }

  static async delete ({ id }) {
    if (!id || typeof id !== 'string') {
      throw new Error('Category id is required')
    }

    const docRef = categoriesCollection.doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      throw new Error('Category not found')
    }

    await docRef.delete()
  }
}

class Validation {
  static name (name) {
    if (typeof name !== 'string') {
      throw new Error('Category name must be a string')
    }
    if (name.trim().length < 3) {
      throw new Error('Category name must be at least 3 characters long')
    }
  }

  static description (description) {
    if (description === undefined) return

    if (typeof description !== 'string') {
      throw new Error('Description must be a string')
    }
    if (description.length > 200) {
      throw new Error('Description must be less than 200 characters')
    }
  }
}
