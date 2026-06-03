import { db } from '../firebase.js'
import { createMovementModel } from '../models/Movement.js'

const productsCollection = db.collection('products')
const movementsCollection = db.collection('movements')

export const movementController = {
  registerMovement: async (req, res) => {
    try {
      const { productId, quantity, type } = req.body
      const movementData = createMovementModel(req.body)

      const productRef = productsCollection.doc(productId)
      const productDoc = await productRef.get()

      if (!productDoc.exists) {
        return res.status(404).json({ message: 'Producto no encontrado' })
      }

      const currentStock = productDoc.data().stock
      let newStock = 0

      if (type === 'IN') {
        newStock = currentStock + Number(quantity)
      } else if (type === 'OUT') {
        if (currentStock < quantity) {
          return res.status(400).json({ message: 'Stock insuficiente para esta salida' })
        }
        newStock = currentStock - Number(quantity)
      }

      const batch = db.batch()
      const newMoveRef = movementsCollection.doc()
      batch.set(newMoveRef, movementData)
      batch.update(productRef, { stock: newStock, updatedAt: new Date().toISOString() })

      await batch.commit()

      res.status(201).json({ message: `Movimiento registrado. Nuevo stock: ${newStock}` })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  getHistoryByProduct: async (req, res) => {
    try {
      const { productId } = req.params
      const snapshot = await movementsCollection
        .where('productId', '==', productId)
        .orderBy('date', 'desc')
        .get()

      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      res.status(200).json(history)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  updateMovement: async (req, res) => {
    try {
      const { id } = req.params
      const { quantity, type, reason, user } = req.body

      const movementRef = movementsCollection.doc(id)
      const movementDoc = await movementRef.get()

      if (!movementDoc.exists) {
        return res.status(404).json({ message: 'Movimiento no encontrado' })
      }

      const oldMovement = movementDoc.data()
      const productRef = productsCollection.doc(oldMovement.productId)
      const productDoc = await productRef.get()

      if (!productDoc.exists) {
        return res.status(404).json({ message: 'Producto no encontrado' })
      }

      let stock = productDoc.data().stock

      if (oldMovement.type === 'IN') {
        stock -= Number(oldMovement.quantity)
      } else {
        stock += Number(oldMovement.quantity)
      }

      if (type === 'IN') {
        stock += Number(quantity)
      } else {
        if (stock < Number(quantity)) {
          return res.status(400).json({ message: 'Stock insuficiente' })
        }
        stock -= Number(quantity)
      }

      const batch = db.batch()
      batch.update(movementRef, {
        quantity: Number(quantity),
        type,
        reason,
        user,
        updatedAt: new Date().toISOString()
      })
      batch.update(productRef, {
        stock,
        updatedAt: new Date().toISOString()
      })

      await batch.commit()

      res.json({ message: 'Movimiento actualizado', stock })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  deleteMovement: async (req, res) => {
    try {
      const { id } = req.params

      const movementRef = movementsCollection.doc(id)
      const movementDoc = await movementRef.get()

      if (!movementDoc.exists) {
        return res.status(404).json({ message: 'Movimiento no encontrado' })
      }

      const movement = movementDoc.data()
      const productRef = productsCollection.doc(movement.productId)
      const productDoc = await productRef.get()

      let stock = productDoc.data().stock

      if (movement.type === 'IN') {
        stock -= Number(movement.quantity)
      } else {
        stock += Number(movement.quantity)
      }

      const batch = db.batch()
      batch.delete(movementRef)
      batch.update(productRef, {
        stock,
        updatedAt: new Date().toISOString()
      })

      await batch.commit()

      res.json({ message: 'Movimiento eliminado', stock })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
}
