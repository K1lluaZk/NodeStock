import { db } from '../firebase.js'

const collection = db.collection('products')

export const productController = {
  getProducts: async (req, res) => {
    try {
      const snapshot = await collection.get()
      const products = []

      const catSnapshot = await db.collection('categories').get()
      const categoriesMap = {}
      catSnapshot.forEach(doc => {
        categoriesMap[doc.id] = doc.data().name
      })

      snapshot.forEach(doc => {
        const data = doc.data()
        products.push({
          id: doc.id,
          ...data,
          categoryName: categoriesMap[data.categoryId] || 'Sin categoría'
        })
      })

      res.status(200).json(products)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  createProduct: async (req, res) => {
    try {
      const validatedData = {
        ...req.body,
        stock: Number(req.body.stock),
        price: Number(req.body.price),
        createdAt: new Date().toISOString()
      }
      const docRef = await collection.add(validatedData)
      res.status(201).json({ id: docRef.id, ...validatedData })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  updateProduct: async (req, res) => {
    try {
      const { id } = req.params
      const { price, categoryId } = req.body
      const dataToUpdate = {
        price: Number(price),
        categoryId,
        updatedAt: new Date().toISOString()
      }
      await db.collection('products').doc(id).update(dataToUpdate)
      res.status(200).json({ message: 'Producto actualizado' })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params
      await collection.doc(id).delete()
      res.status(200).json({ message: 'Eliminado con éxito' })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
}
