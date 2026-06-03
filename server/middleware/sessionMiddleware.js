import jwt from 'jsonwebtoken'
import { SECRET_JWT_KEY, REFRESH_SECRET_KEY } from '../config.js'

export const sessionMiddleware = async (req, res, next) => {
  const token = req.cookies.access_token
  const refreshToken = req.cookies.refresh_token

  req.session = {
    user: null
  }

  if (token) {
    try {
      const data = jwt.verify(token, SECRET_JWT_KEY)
      req.session.user = data
      return next()
    } catch (err) {
      console.log('Token de acceso expirado o inválido')
    }
  }

  if (refreshToken) {
    try {
      const data = jwt.verify(
        refreshToken,
        REFRESH_SECRET_KEY
      )

      const newAccessToken = jwt.sign(
        {
          id: data.id,
          username: data.username,
          role: data.role
        },
        SECRET_JWT_KEY,
        {
          expiresIn: '15m'
        }
      )

      res.cookie(
        'access_token',
        newAccessToken,
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000
        }
      )

      req.session.user = data

      return next()
    } catch (refreshErr) {
      console.log('Sesión expirada por completo')
    }
  }

  next()
}
