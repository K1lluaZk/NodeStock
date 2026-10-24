import { db } from '../firebase.js'
import {
  createCategoryModel,
  normalizeCategoryName,
  updateCategoryModel
} from '../models/Category.js'
import { checkRoleAccess } from '../utils/checkRoleAccess.js'
import { validateCategoryData } from '../validators/categoryValidator.js'
import { ValidationError } from '../validators/ValidationError.js'

const readRoles = ['admin', 'manager', 'viewer']
const writeRoles = ['admin', 'manager']
const categoriesCollection = db.collection('categories')

const findDuplicateCategory = async (name, excludedId) => {
  const snapshot = await categoriesCollection.get()
  const normalizedName = normalizeCategoryName(name)

  return snapshot.docs.some(doc =>
    doc.id !== excludedId &&
    typeof doc.data().name === 'string' &&
    normalizeCategoryName(doc.data().name) === normalizedName
  )
}

export const categoryController = {

  getAllCategories: async (req, res) => {
    try {
      if (!checkRoleAccess(
        req,
        res,
        readRoles,
        'No tienes permisos para consultar categorías'
      )) {
        return
      }

      const snapshot = await categoriesCollection.get()
      const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      res.json(categories)
    } catch (error) {
      res.status(500).send(error.message)
    }
  },
  createCategory: async (req, res) => {
    try {
      if (!checkRoleAccess(
        req,
        res,
        writeRoles,
        'No tienes permisos para crear categorías'
      )) {
        return
      }

      const category = createCategoryModel(validateCategoryData(req.body))

      if (await findDuplicateCategory(category.name)) {
        return res.status(409).json({
          error: 'Ya existe una categoría con ese nombre'
        })
      }

      const newCat = await categoriesCollection.add(category)
      res.status(201).json({ id: newCat.id })
    } catch (error) {
      const status = error instanceof ValidationError ? 400 : 500
      res.status(status).json({ error: error.message })
    }
  },

  updateCategory: async (req, res) => {
    try {
      if (!checkRoleAccess(
        req,
        res,
        writeRoles,
        'No tienes permisos para actualizar categorías'
      )) {
        return
      }

      const { id } = req.params
      const categoryRef = categoriesCollection.doc(id)
      const existingCategory = await categoryRef.get()

      if (!existingCategory.exists) {
        return res.status(404).json({ error: 'Categoría no encontrada' })
      }

      const category = updateCategoryModel(validateCategoryData(req.body))

      if (await findDuplicateCategory(category.name, id)) {
        return res.status(409).json({
          error: 'Ya existe una categoría con ese nombre'
        })
      }

      await categoryRef.update({
        ...category,
        updatedAt: new Date().toISOString()
      })
      res.json({ ok: true })
    } catch (error) {
      const status = error instanceof ValidationError ? 400 : 500
      res.status(status).json({ error: error.message })
    }
  },

  deleteCategory: async (req, res) => {
    try {
      if (!checkRoleAccess(
        req,
        res,
        writeRoles,
        'No tienes permisos para eliminar categorías'
      )) {
        return
      }

      const categoryRef = categoriesCollection.doc(req.params.id)
      const category = await categoryRef.get()

      if (!category.exists) {
        return res.status(404).json({ error: 'Categoría no encontrada' })
      }

      await categoryRef.delete()
      res.json({ ok: true })
    } catch (error) {
      res.status(500).send(error.message)
    }
  }
}
