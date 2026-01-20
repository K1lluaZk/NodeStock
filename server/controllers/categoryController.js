import { db } from '../config/firebase.js';

export const categoryController = {

    getAll: async (req, res) => {
        try {
            const snapshot = await db.collection('categories').get();
            const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            res.json(categories);
        } catch (error) {
            res.status(500).send(error.message);
        }
    },
    
    // Crear categoría
    create: async (req, res) => {
        try {
            const { name, description } = req.body;
            const newCat = await db.collection('categories').add({
                name,
                description,
                createdAt: new Date().toISOString()
            });
            res.status(201).json({ id: newCat.id });
        } catch (error) {
            res.status(500).send(error.message);
        }
    },

    // Eliminar categoría
    delete: async (req, res) => {
        try {
            await db.collection('categories').doc(req.params.id).delete();
            res.json({ ok: true });
        } catch (error) {
            res.status(500).send(error.message);
        }
    }
};