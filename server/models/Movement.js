export const createMovementModel = (data) => {
  return {
    productId: data.productId,
    type: data.type,
    quantity: Number(data.quantity),
    reason: data.reason || '',
    date: new Date().toISOString(),
    user: data.user || 'System'
  }
}
