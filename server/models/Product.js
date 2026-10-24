export const normalizeProductSku = (sku) => sku.trim().toLowerCase()

export const normalizeProductName = (name) => name.trim().toLowerCase()

export const productSkuIndexId = (sku) => {
  return Buffer.from(normalizeProductSku(sku)).toString('base64url')
}

export const productNameIndexId = (name) => {
  return Buffer.from(normalizeProductName(name)).toString('base64url')
}

export const createProductModel = (data) => ({
  ...data,
  createdAt: new Date().toISOString()
})

export const updateProductModel = (data) => ({ ...data })




