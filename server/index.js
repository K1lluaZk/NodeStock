import express from 'express'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

import { PORT, SECRET_JWT_KEY } from './config.js'
import { UserRepository } from './user-repository.js'
import { CategoryRepository } from './category-repository.js'
import productRoutes from './routes/productRoutes.js'
import movementRoutes from './routes/movementRoutes.js'
import { db } from './firebase.js'

// Configuración de rutas absolutas
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// --- CONFIGURACIÓN ---
app.use(cors())
app.use(express.json())
app.use(cookieParser())

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '../views'))

// --- MIDDLEWARE DE SESIÓN ---
app.use((req, res, next) => {
  const token = req.cookies.access_token
  req.session = { user: null }
  try {
    const data = jwt.verify(token, SECRET_JWT_KEY)
    req.session.user = data
  } catch {}
  next()
})

// --- RUTAS DE VISTAS (EJS) ---

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

// --- RUTAS DE API (JSON) ---

app.use('/api/products', productRoutes)
app.use('/api/movements', movementRoutes)

// API de Categorías (CRUD organizado)
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

// --- AUTENTICACIÓN ---

app.post('/login', async (req, res) => {
  const { username, password } = req.body
  try {
    const user = await UserRepository.login({ username, password })
    const token = jwt.sign({ id: user._id, username: user.username }, SECRET_JWT_KEY, { expiresIn: '1h' })
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60
    }).send({ user, token })
  } catch (error) {
    res.status(401).send(error.message)
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
  res.clearCookie('access_token').redirect('/')
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})