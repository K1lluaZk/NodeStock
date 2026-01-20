export const createProductModel = (data) => {
  return {
    name: data.name || '',
    description: data.description || '',
    price: Number(data.price) || 0,
    stock: Number(data.stock) || 0,
    category: data.category || 'General',
    sku: data.sku || '',
    createdAt: new Date().toISOString()
  }
}
