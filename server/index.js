import express from 'express'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import { PORT, SECRET_JWT_KEY, REFRESH_SECRET_KEY } from './config.js'
import { UserRepository } from './user-repository.js'
import { CategoryRepository } from './category-repository.js'
import productRoutes from './routes/productRoutes.js'
import movementRoutes from './routes/movementRoutes.js'
import { db } from './firebase.js'

const app = express()

// CONFIGURACIÓN
app.use(cors())
app.use(express.json())
app.use(cookieParser())

app.set('view engine', 'ejs')

// MIDDLEWARE DE SESIÓN
app.use(async (req, res, next) => {
  const token = req.cookies.access_token
  const refreshToken = req.cookies.refresh_token

  req.session = { user: null }

  if (token) {
    try {
      const data = jwt.verify(token, SECRET_JWT_KEY)
      req.session.user = data
      return next()
    } catch (err) {
      // Token expirado o inválido, pasamos al intento de refresh
    }
  }

  // Si falló el Access, intentar con el Refresh Token
  if (refreshToken) {
    try {
      const data = jwt.verify(refreshToken, REFRESH_SECRET_KEY)

      // Si el refresh es válido, generamos un nuevo Access Token inmediatamente
      const newAccessToken = jwt.sign(
        { id: data.id, username: data.username },
        SECRET_JWT_KEY,
        { expiresIn: '15m' } // 15 minutos para uso normal
      )

      // Actualizamos la cookie del Access Token
      res.cookie('access_token', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000
      })

      req.session.user = data
      console.log('✅ Sesión restaurada automáticamente por el servidor')
      return next()
    } catch (refreshErr) {
      console.log('Refresh token inválido o expirado')
    }
  }

  next()
})

// Rutas De Vistas
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

app.get('/producto/:id', async (req, res) => {
  const { user } = req.session
  if (!user) return res.redirect('/')
  try {
    const { id } = req.params
    const productDoc = await db.collection('products').doc(id).get()
    if (!productDoc.exists) return res.status(404).send('Producto no encontrado')

    const movementsSnapshot = await db.collection('movements').where('productId', '==', id).get()
    const movimientos = movementsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.date) - new Date(a.date))

    res.render('historial', { producto: { id: productDoc.id, ...productDoc.data() }, movimientos, user })
  } catch (error) {
    res.status(500).send(error.message)
  }
})

// --- Rutas De API

app.use('/api/products', productRoutes)
app.use('/api/movements', movementRoutes)

// API de Categorías
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await CategoryRepository.getAll()
    res.send(categories)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

app.post('/api/create', async (req, res) => {
  const { name, description } = req.body
  try {
    const id = await CategoryRepository.create({ name, description })
    res.send({ id })
  } catch (error) {
    res.status(400).send(error.message)
  }
})

app.put('/api/update/:id', async (req, res) => {
  try {
    await CategoryRepository.update({ id: req.params.id, ...req.body })
    res.send({ message: 'Category updated' })
  } catch (error) {
    res.status(400).send(error.message)
  }
})

app.delete('/api/delete/:id', async (req, res) => {
  try {
    await CategoryRepository.delete({ id: req.params.id })
    res.send({ message: 'Category deleted' })
  } catch (error) {
    res.status(400).send(error.message)
  }
})

// AUTENTICACIÓN

app.post('/login', async (req, res) => {
  const { username, password } = req.body
  try {
    const user = await UserRepository.login({ username, password })

    const tokenPayload = { id: user._id, username: user.username }

    // 1. Access Token (15 min)
    const accessToken = jwt.sign(tokenPayload, SECRET_JWT_KEY, { expiresIn: '15m' })

    // 2. Refresh Token (7 días)
    const refreshToken = jwt.sign(tokenPayload, REFRESH_SECRET_KEY, { expiresIn: '7d' })

    // GUARDAR ACCESS TOKEN EN COOKIE
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutos
    })

    // GUARDAR REFRESH TOKEN EN COOKIE
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    })

    res.send({ user, accessToken })
  } catch (error) {
    res.status(401).send(error.message)
  }
})

app.post('/auth/refresh', (req, res) => {
  const refreshToken = req.cookies.refresh_token
  if (!refreshToken) return res.status(401).json({ message: 'No hay token de refresco' })

  try {
    const data = jwt.verify(refreshToken, REFRESH_SECRET_KEY)
    const newAccessToken = jwt.sign(
      { id: data.id, username: data.username },
      SECRET_JWT_KEY,
      { expiresIn: '15m' }
    )

    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    })

    res.json({ accessToken: newAccessToken })
  } catch (e) {
    res.status(403).json({ message: 'Refresh token inválido o expirado' })
  }
})

app.post('/register', async (req, res) => {
  const { username, password } = req.body
  try {
    const id = await UserRepository.create({ username, password })
    res.send({ id })
  } catch (error) {
    res.status(400).send(error.message)
  }
})

app.get('/logout', (req, res) => {
  res.clearCookie('access_token')
  res.clearCookie('refresh_token').redirect('/')
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
