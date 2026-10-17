export class CategoryValidationError extends Error {}

const validateCategoryData = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new CategoryValidationError('Los datos de la categoría son inválidos')
  }

  if (typeof data.name !== 'string') {
    throw new CategoryValidationError('El nombre de la categoría es obligatorio')
  }

  const name = data.name.trim()
  if (name.length < 3 || name.length > 80) {
    throw new CategoryValidationError(
      'El nombre debe tener entre 3 y 80 caracteres'
    )
  }

  const description = data.description === undefined ? '' : data.description
  if (typeof description !== 'string') {
    throw new CategoryValidationError('La descripción debe ser texto')
  }

  if (description.trim().length > 200) {
    throw new CategoryValidationError(
      'La descripción no puede superar los 200 caracteres'
    )
  }

  return {
    name,
    description: description.trim()
  }
}

export const normalizeCategoryName = (name) => name.trim().toLowerCase()

export const createCategoryModel = (data) => {
  const validatedData = validateCategoryData(data)

  return {
    ...validatedData,
    createdAt: new Date().toISOString()
  }
}

export const updateCategoryModel = (data) => {
  return validateCategoryData(data)
}
