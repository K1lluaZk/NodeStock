import express from 'express'
import rateLimit from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import { SECRET_JWT_KEY, REFRESH_SECRET_KEY } from './config.js'
import { UserRepository } from './user-repository.js'
import {
  sendPasswordResetEmail,
  validatePasswordResetMailConfiguration
} from './mailer.js'
import productRoutes from './routes/productRoutes.js'
import movementRoutes from './routes/movementRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import { db } from './firebase.js'
import { sessionMiddleware } from './middleware/sessionMiddleware.js'
import { authorizeRole } from './middleware/authorizeRole.js'

export const app = express()

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false
})

// --- Configuración y Middlewares Globales

app.use(express.json())
app.use(cookieParser())
app.set('view engine', 'ejs')

app.use(sessionMiddleware)

// --- Vistas

app.get('/', (req, res) => {
  const { user } = req.session
  if (user) return res.redirect('/dashboard')
  res.render('index', { user: null })
})

app.get('/forgot-password', (req, res) => {
  res.render('forgot-password')
})

app.get('/reset-password', (req, res) => {
  res.set('Cache-Control', 'no-store')
  res.render('reset-password', {
    token: typeof req.query.token === 'string' ? req.query.token : ''
  })
})

app.get('/dashboard', (req, res) => {
  const { user } = req.session
  if (!user) return res.redirect('/')
  res.render('dashboard', { user })
})

app.get('/categories', (req, res) => {
  const { user } = req.session
  if (!user) return res.redirect('/')
  res.render('categories', { user })
})

app.get('/users', authorizeRole(['admin']), (req, res) => {
  res.render('users', { user: req.session.user })
})

app.get('/producto/:id', async (req, res) => {
  const { user } = req.session
  if (!user) return res.redirect('/')

  try {
    const { id } = req.params

    const productDoc = await db.collection('products').doc(id).get()
    if (!productDoc.exists) {
      return res.status(404).send('Producto no encontrado')
    }

    const movementsSnapshot = await db
      .collection('movements')
      .where('productId', '==', id)
      .get()

    const movimientos = movementsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.date) - new Date(a.date))

    res.render('historial', {
      producto: { id: productDoc.id, ...productDoc.data() },
      movimientos,
      user
    })
  } catch (error) {
    res.status(500).send(error.message)
  }
})

// --- Rutas API

app.use('/api/products', productRoutes)
app.use('/api/movements', movementRoutes)
app.use('/api/categories', categoryRoutes)

app.get('/api/users', authorizeRole(['admin']), async (req, res) => {
  try {
    const users = await UserRepository.getAll()
    res.send(users)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

app.put('/api/users/:id/role', authorizeRole(['admin']), async (req, res) => {
  try {
    const { role } = req.body
    await UserRepository.updateRole({ id: req.params.id, role })
    res.send({ success: true })
  } catch (error) {
    res.status(400).send(error.message)
  }
})

app.delete('/api/users/:id', authorizeRole(['admin']), async (req, res) => {
  try {
    if (req.params.id === req.session.user.id) {
      return res.status(400).send('No puedes eliminar tu propia cuenta')
    }
    await UserRepository.delete({ id: req.params.id })
    res.send({ success: true })
  } catch (error) {
    res.status(400).send(error.message)
  }
})

// --- Autenticación

app.post('/login', async (req, res) => {
  const { username, password } = req.body

  try {
    const user = await UserRepository.login({ username, password })

    const tokenPayload = {
      id: user._id,
      username: user.username,
      role: user.role || 'viewer'
    }

    const accessToken = jwt.sign(tokenPayload, SECRET_JWT_KEY, { expiresIn: '15m' })
    const refreshToken = jwt.sign(tokenPayload, REFRESH_SECRET_KEY, { expiresIn: '7d' })

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    })

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.send({ user, accessToken })
  } catch (error) {
    res.status(401).send(error.message)
  }
})

app.post('/forgot-password', passwordResetLimiter, async (req, res) => {
  const { username } = req.body

  try {
    validatePasswordResetMailConfiguration()
  } catch (error) {
    console.error('La recuperación de contraseña no está configurada:', error)
    return res.status(503).send('La recuperación no está disponible. Contacta al administrador.')
  }

  try {
    const token = await UserRepository.createPasswordResetToken({ username })

    if (token) {
      try {
        await sendPasswordResetEmail({ to: username, token })
      } catch (error) {
        await UserRepository.invalidatePasswordResetToken({ username, token })
        console.error('No se pudo enviar el correo de recuperación:', error)
      }
    }

    res.send({
      message: 'Si el correo corresponde a una cuenta, recibirás instrucciones para restablecer tu contraseña.'
    })
  } catch (error) {
    if (error.message === 'Username must be a string' ||
      error.message === 'Username must be a valid email') {
      return res.status(400).send(error.message)
    }

    console.error('No se pudo iniciar la recuperación de contraseña:', error)
    res.status(500).send('No se pudo procesar la solicitud. Inténtalo de nuevo.')
  }
})

app.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body

  try {
    await UserRepository.resetPassword({ token, newPassword })
    res.send({ success: true })
  } catch (error) {
    if (error.message === 'Password must be a string' ||
      error.message === 'Password must be at least 8 characters long' ||
      error.message === 'Password must include at least one number' ||
      error.message === 'Password must include at least one uppercase letter') {
      return res.status(400).send(error.message)
    }

    if (error.message === 'Invalid or expired password reset link') {
      return res.status(400).send(error.message)
    }

    console.error('No se pudo restablecer la contraseña:', error)
    res.status(500).send('No se pudo restablecer la contraseña. Inténtalo de nuevo.')
  }
})

app.post('/register', authorizeRole(['admin']), async (req, res) => {
  const { username, password, role } = req.body

  try {
    const id = await UserRepository.create({ username, password, role })
    res.send({ id })
  } catch (error) {
    res.status(400).send(error.message)
  }
})

app.get('/logout', (req, res) => {
  res
    .clearCookie('access_token')
    .clearCookie('refresh_token')
    .redirect('/')
})
