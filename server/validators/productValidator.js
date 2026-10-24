import { ValidationError } from './ValidationError.js'

const parseNumber = (value) => {
  if (
    (typeof value !== 'number' && typeof value !== 'string') ||
    (typeof value === 'string' && value.trim() === '')
  ) {
    return NaN
  }
  return Number(value)
}

export const validateProductData = (data, includeDescription) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ValidationError('Los datos del producto son inválidos')
  }

  if (typeof data.name !== 'string') {
    throw new ValidationError('El nombre del producto es obligatorio')
  }
  const name = data.name.trim()
  if (name.length < 1 || name.length > 50) {
    throw new ValidationError(
      'El nombre debe tener entre 1 y 50 caracteres'
    )
  }

  if (typeof data.sku !== 'string') {
    throw new ValidationError('El SKU es obligatorio')
  }
  const sku = data.sku.trim()
  if (sku.length < 1 || sku.length > 40) {
    throw new ValidationError('El SKU debe tener entre 1 y 40 caracteres')
  }

  const price = parseNumber(data.price)
  if (!Number.isFinite(price) || price < 0) {
    throw new ValidationError('El precio debe ser un número mayor o igual a 0')
  }

  const stock = parseNumber(data.stock)
  if (!Number.isSafeInteger(stock) || stock < 0) {
    throw new ValidationError('El stock debe ser un entero mayor o igual a 0')
  }

  if (typeof data.categoryId !== 'string' || !data.categoryId.trim()) {
    throw new ValidationError('La categoría es obligatoria')
  }

  const product = {
    name,
    sku,
    price,
    stock,
    categoryId: data.categoryId.trim()
  }

  if (includeDescription) {
    const description = data.description === undefined ? '' : data.description
    if (typeof description !== 'string' || description.length > 500) {
      throw new ValidationError(
        'La descripción debe ser texto de hasta 500 caracteres'
      )
    }
    product.description = description.trim()
  }

  return product
}
