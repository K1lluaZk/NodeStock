import { db } from '../firebase.js';
import { createMovementModel } from '../models/Movement.js';

const productsCollection = db.collection('products');
const movementsCollection = db.collection('movements');

export const movementController = {
  // Registrar un movimiento (Sumar o Restar Stock)
  registerMovement: async (req, res) => {
    try {
      const { productId, quantity, type } = req.body;
      const movementData = createMovementModel(req.body);

      // 1. Obtener el producto actual
      const productRef = productsCollection.doc(productId);
      const productDoc = await productRef.get();

      if (!productDoc.exists) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }

      const currentStock = productDoc.data().stock;
      let newStock = 0;

      // 2. Lógica de Suma o Resta
      if (type === 'IN') {
        newStock = currentStock + Number(quantity);
      } else if (type === 'OUT') {
        if (currentStock < quantity) {
          return res.status(400).json({ message: "Stock insuficiente para esta salida" });
        }
        newStock = currentStock - Number(quantity);
      }

      // 3. Guardar en Firebase (Usamos una transacción para que sea seguro)
      const batch = db.batch();
      
      // Guardar el registro del movimiento
      const newMoveRef = movementsCollection.doc();
      batch.set(newMoveRef, movementData);
      
      // Actualizar el stock del producto
      batch.update(productRef, { stock: newStock, updatedAt: new Date().toISOString() });

      await batch.commit();

      res.status(201).json({ message: `Movimiento registrado. Nuevo stock: ${newStock}` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener el historial de un producto
  getHistoryByProduct: async (req, res) => {
    try {
      const { productId } = req.params;
      const snapshot = await movementsCollection.where('productId', '==', productId).orderBy('date', 'desc').get();
      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(history);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};