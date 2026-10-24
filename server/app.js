import express from 'express'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import { SECRET_JWT_KEY, REFRESH_SECRET_KEY } from './config.js'
import { UserRepository } from './user-repository.js'
import productRoutes from './routes/productRoutes.js'
import movementRoutes from './routes/movementRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import { db } from './firebase.js'
import { sessionMiddleware } from './middleware/sessionMiddleware.js'
import { authorizeRole } from './middleware/authorizeRole.js'

export const app = express()

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
