export const authorizeRole = (rolesPermitidos) => {
  return (req, res, next) => {
    const { user } = req.session

    if (!user) {
      return res.status(401).json({
        message: 'No autenticado'
      })
    }

    if (!rolesPermitidos.includes(user.role)) {
      return res.status(403).json({
        message: 'No tienes permisos para realizar esta acción'
      })
    }

    next()
  }
}
