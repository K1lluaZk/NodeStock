export const normalizeCategoryName = (name) => name.trim().toLowerCase()

export const createCategoryModel = (data) => ({
  ...data,
  createdAt: new Date().toISOString()
})

export const updateCategoryModel = (data) => ({ ...data })
