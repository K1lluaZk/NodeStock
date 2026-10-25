export const checkRoleAccess = (req, res, allowedRoles, message) => {
  const user = req.session?.user

  if (!user) {
    res.status(401).json({ error: 'No autenticado' })
    return false
  }

  if (!allowedRoles.includes(user.role)) {
    res.status(403).json({ error: message })
    return false
  }

  return true
}
