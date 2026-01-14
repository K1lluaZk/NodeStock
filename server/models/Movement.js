export const createMovementModel = (data) => {
   return {
      productId: data.productId, // Id del producto que se mueve
      type: data.type,          // 'IN' (entrada) o 'OUT' (salida)
      quantity: Number(data.quantity),
      reason: data.reason || '',  // Ej: "venta", "reposicion", "Ajuste"
      date: new Date().toISOString(),
      user: data.user || 'System'
   };
}