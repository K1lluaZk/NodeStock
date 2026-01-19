import { db } from '../firebase.js'; // IMPORTANTE el .js
import { createProductModel } from '../models/Product.js';

const collection = db.collection('products');

export const productController = {
  // Obtener todos los productos
  getProducts: async (req, res) => {
    try {
      const snapshot = await collection.get();
      const products = [];

      // Obtenemos todas las categorías una sola vez para optimizar
      const catSnapshot = await db.collection('categories').get();
      const categoriesMap = {};
      catSnapshot.forEach(doc => {
        categoriesMap[doc.id] = doc.data().name;
      });

      snapshot.forEach(doc => {
        const data = doc.data();
        products.push({
          id: doc.id,
          ...data,
          // Si el producto tiene categoryId, buscamos su nombre; si no, 'Sin categoría'
          categoryName: categoriesMap[data.categoryId] || 'Sin categoría'
        });
      });

      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  createProduct: async (req, res) => {
    try {
      // Ahora req.body incluye categoryId desde el nuevo modal
      const validatedData = {
        ...req.body,
        stock: Number(req.body.stock),
        price: Number(req.body.price),
        createdAt: new Date().toISOString()
      };
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
            const { price, categoryId } = req.body; // Capturamos el nuevo categoryId
            
            const dataToUpdate = {
                price: Number(price),
                categoryId, // Actualizamos la referencia
                updatedAt: new Date().toISOString()
            };
            
            await db.collection('products').doc(id).update(dataToUpdate);
            res.status(200).json({ message: "Producto actualizado" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

  // Eliminar Producto
  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;
      // Usamos la constante 'collection' para mantener consistencia
      await collection.doc(id).delete();
      res.status(200).json({ message: "Eliminado con éxito" });
    } catch (error) {
      // Si llega aquí, el frontend recibirá un 500 y mostrará el alert de error
      res.status(500).json({ error: error.message });
    }
  }
};