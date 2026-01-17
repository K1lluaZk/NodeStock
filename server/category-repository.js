import { db } from './firebase.js'
import crypto from 'crypto'

const categoriesCollection = db.collection('categories')

export class CategoryRepository {
  static async create ({ name, description }) {
    Validation.name(name)
    Validation.description(description)

    // Verificar si la categoría ya existe
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
