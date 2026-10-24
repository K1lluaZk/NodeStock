import { ValidationError } from './ValidationError.js'

export const validateCategoryData = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ValidationError('Los datos de la categoría son inválidos')
  }

  if (typeof data.name !== 'string') {
    throw new ValidationError('El nombre de la categoría es obligatorio')
  }

  const name = data.name.trim()
  if (name.length < 3 || name.length > 80) {
    throw new ValidationError(
      'El nombre debe tener entre 3 y 80 caracteres'
    )
  }

  const description = data.description === undefined ? '' : data.description
  if (typeof description !== 'string') {
    throw new ValidationError('La descripción debe ser texto')
  }

  if (description.trim().length > 200) {
    throw new ValidationError(
      'La descripción no puede superar los 200 caracteres'
    )
  }

  return {
    name,
    description: description.trim()
  }
}
