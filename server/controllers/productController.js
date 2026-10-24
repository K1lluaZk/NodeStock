import { db } from '../firebase.js'
import {
  createProductModel,
  normalizeProductName,
  normalizeProductSku,
  productNameIndexId,
  productSkuIndexId,
  updateProductModel
} from '../models/Product.js'
import { checkRoleAccess } from '../utils/checkRoleAccess.js'
import { ValidationError } from '../validators/ValidationError.js'
import { validateProductData } from '../validators/productValidator.js'

const collection = db.collection('products')
const categoriesCollection = db.collection('categories')
const skuIndexCollection = db.collection('productSkus')
const nameIndexCollection = db.collection('productNames')
const readRoles = ['admin', 'manager', 'viewer']
const writeRoles = ['admin', 'manager']

const findDuplicateProductValue = async (field, value, normalize, excludedId) => {
  const snapshot = await collection.get()
  const normalizedValue = normalize(value)

  return snapshot.docs.some(doc =>
    doc.id !== excludedId &&
    typeof doc.data()[field] === 'string' &&
    normalize(doc.data()[field]) === normalizedValue
  )
}

const findDuplicateSku = (sku, excludedId) => {
  return findDuplicateProductValue('sku', sku, normalizeProductSku, excludedId)
}

const findDuplicateName = (name, excludedId) => {
  return findDuplicateProductValue('name', name, normalizeProductName, excludedId)
}

const categoryExists = async (categoryId) => {
  const category = await categoriesCollection.doc(categoryId).get()
  return category.exists
}

const respondToProductError = (res, error) => {
  const status = error instanceof ValidationError ? 400 : 500
  res.status(status).json({ error: error.message })
}

export const productController = {
  getProducts: async (req, res) => {
    try {
      if (!checkRoleAccess(
        req,
        res,
        readRoles,
        'No tienes permisos para consultar productos'
      )) {
        return
      }

      const snapshot = await collection.get()
      const categoriesSnapshot = await categoriesCollection.get()
      const categoriesMap = {}
      categoriesSnapshot.forEach(doc => {
        categoriesMap[doc.id] = doc.data().name
      })

      const products = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          categoryName: categoriesMap[data.categoryId] || 'Sin categoría'
        }
      })

      res.status(200).json(products)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  createProduct: async (req, res) => {
    try {
      if (!checkRoleAccess(
        req,
        res,
        writeRoles,
        'No tienes permisos para crear productos'
      )) {
        return
      }

      const product = createProductModel(validateProductData(req.body, true))

      if (!await categoryExists(product.categoryId)) {
        return res.status(400).json({ error: 'La categoría seleccionada no existe' })
      }

      if (await findDuplicateName(product.name)) {
        return res.status(409).json({ error: 'Ya existe un producto con ese nombre' })
      }

      if (await findDuplicateSku(product.sku)) {
        return res.status(409).json({ error: 'Ya existe un producto con ese SKU' })
      }

      const productRef = collection.doc()
      const skuIndexRef = skuIndexCollection.doc(productSkuIndexId(product.sku))
      const nameIndexRef = nameIndexCollection.doc(productNameIndexId(product.name))
      const created = await db.runTransaction(async (transaction) => {
        const skuIndex = await transaction.get(skuIndexRef)
        const nameIndex = await transaction.get(nameIndexRef)

        if (skuIndex.exists || nameIndex.exists) {
          return skuIndex.exists ? 'duplicate-sku' : 'duplicate-name'
        }

        transaction.create(productRef, product)
        transaction.create(skuIndexRef, {
          productId: productRef.id,
          sku: normalizeProductSku(product.sku)
        })
        transaction.create(nameIndexRef, {
          productId: productRef.id,
          name: normalizeProductName(product.name)
        })
        return 'created'
      })

      if (created === 'duplicate-name') {
        return res.status(409).json({ error: 'Ya existe un producto con ese nombre' })
      }
      if (created === 'duplicate-sku') {
        return res.status(409).json({ error: 'Ya existe un producto con ese SKU' })
      }

      res.status(201).json({ id: productRef.id, ...product })
    } catch (error) {
      respondToProductError(res, error)
    }
  },

  updateProduct: async (req, res) => {
    try {
      if (!checkRoleAccess(
        req,
        res,
        writeRoles,
        'No tienes permisos para actualizar productos'
      )) {
        return
      }

      const { id } = req.params
      const productRef = collection.doc(id)
      const existingProduct = await productRef.get()

      if (!existingProduct.exists) {
        return res.status(404).json({ error: 'Producto no encontrado' })
      }

      const product = updateProductModel(validateProductData(req.body, false))

      if (!await categoryExists(product.categoryId)) {
        return res.status(400).json({ error: 'La categoría seleccionada no existe' })
      }

      if (await findDuplicateName(product.name, id)) {
        return res.status(409).json({ error: 'Ya existe un producto con ese nombre' })
      }

      if (await findDuplicateSku(product.sku, id)) {
        return res.status(409).json({ error: 'Ya existe un producto con ese SKU' })
      }

      const newSkuIndexRef = skuIndexCollection.doc(productSkuIndexId(product.sku))
      const newNameIndexRef = nameIndexCollection.doc(productNameIndexId(product.name))
      const updateResult = await db.runTransaction(async (transaction) => {
        const currentProduct = await transaction.get(productRef)
        if (!currentProduct.exists) return 'missing'

        const currentData = currentProduct.data()
        const currentSkuIndexRef = typeof currentData.sku === 'string'
          ? skuIndexCollection.doc(productSkuIndexId(currentData.sku))
          : null
        const currentNameIndexRef = typeof currentData.name === 'string'
          ? nameIndexCollection.doc(productNameIndexId(currentData.name))
          : null
        const newSkuIndex = await transaction.get(newSkuIndexRef)
        const newNameIndex = await transaction.get(newNameIndexRef)
        const oldSkuIndex = currentSkuIndexRef
          ? await transaction.get(currentSkuIndexRef)
          : null
        const oldNameIndex = currentNameIndexRef
          ? await transaction.get(currentNameIndexRef)
          : null

        if (newSkuIndex.exists && newSkuIndex.data().productId !== id) {
          return 'duplicate-sku'
        }
        if (newNameIndex.exists && newNameIndex.data().productId !== id) {
          return 'duplicate-name'
        }

        transaction.update(productRef, {
          ...product,
          updatedAt: new Date().toISOString()
        })

        if (
          currentSkuIndexRef &&
          currentSkuIndexRef.path !== newSkuIndexRef.path &&
          oldSkuIndex?.data()?.productId === id
        ) {
          transaction.delete(currentSkuIndexRef)
        }
        if (
          currentNameIndexRef &&
          currentNameIndexRef.path !== newNameIndexRef.path &&
          oldNameIndex?.data()?.productId === id
        ) {
          transaction.delete(currentNameIndexRef)
        }

        transaction.set(newSkuIndexRef, {
          productId: id,
          sku: normalizeProductSku(product.sku)
        })
        transaction.set(newNameIndexRef, {
          productId: id,
          name: normalizeProductName(product.name)
        })
        return 'updated'
      })

      if (updateResult === 'missing') {
        return res.status(404).json({ error: 'Producto no encontrado' })
      }
      if (updateResult === 'duplicate-name') {
        return res.status(409).json({ error: 'Ya existe un producto con ese nombre' })
      }
      if (updateResult === 'duplicate-sku') {
        return res.status(409).json({ error: 'Ya existe un producto con ese SKU' })
      }

      res.status(200).json({ message: 'Producto actualizado' })
    } catch (error) {
      respondToProductError(res, error)
    }
  },

  deleteProduct: async (req, res) => {
    try {
      if (!checkRoleAccess(
        req,
        res,
        writeRoles,
        'No tienes permisos para eliminar productos'
      )) {
        return
      }

      const { id } = req.params
      const productRef = collection.doc(id)
      const deleted = await db.runTransaction(async (transaction) => {
        const productSnapshot = await transaction.get(productRef)
        if (!productSnapshot.exists) return false

        const product = productSnapshot.data()
        const skuIndexRef = typeof product.sku === 'string'
          ? skuIndexCollection.doc(productSkuIndexId(product.sku))
          : null
        const nameIndexRef = typeof product.name === 'string'
          ? nameIndexCollection.doc(productNameIndexId(product.name))
          : null
        const skuIndex = skuIndexRef
          ? await transaction.get(skuIndexRef)
          : null
        const nameIndex = nameIndexRef
          ? await transaction.get(nameIndexRef)
          : null

        transaction.delete(productRef)
        if (skuIndex?.data()?.productId === id) {
          transaction.delete(skuIndexRef)
        }
        if (nameIndex?.data()?.productId === id) {
          transaction.delete(nameIndexRef)
        }
        return true
      })

      if (!deleted) {
        return res.status(404).json({ error: 'Producto no encontrado' })
      }

      res.status(200).json({ message: 'Eliminado con éxito' })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
}
