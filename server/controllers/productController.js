import { db } from '../config/firebase.js'; // IMPORTANTE el .js
import { createProductModel } from '../models/Product.js';

const collection = db.collection('products');

export const productController = {
  // Obtener todos los productos
  getProducts: async (req, res) => {
    try {
      const snapshot = await collection.get();
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Crear un producto
  createProduct: async (req, res) => {
    try {
      const validatedData = createProductModel(req.body);
      const docRef = await collection.add(validatedData);
      res.status(201).json({ id: docRef.id, ...validatedData });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },


  // Actualizar Producto
  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const dataToUpdate = {
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      
      // En Firebase usamos .doc(id).update()
      await productsCollection.doc(id).update(dataToUpdate);
      res.status(200).json({ message: "Producto actualizado con éxito" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Eliminar Producto
  deleteProduct: async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('products').doc(id).delete();
    res.status(200).json({ message: "Eliminado con éxito" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
};