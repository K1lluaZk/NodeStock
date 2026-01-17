import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { PORT } from './config.js'
import { UserRepository } from './user-repository.js'
import productRoutes from './routes/productRoutes.js'
import movementRoutes from './routes/movementRoutes.js'

const app = express()

// Middlewares
app.use(cors())
app.use(express.json())
app.use(cookieParser())
app.set('view engine', 'ejs')

// Rutas de API (feat/products)
app.use('/api/products', productRoutes)
app.use('/api/movements', movementRoutes)

// Rutas de Auth (feat-auth)
app.post('/login', async (req, res) => {
  try {
    const user = await UserRepository.login(req.body)
    res.send({ user })
  } catch (error) {
    res.status(401).send(error.message)
  }
})

app.post('/register', async (req, res) => {
  try {
    const id = await UserRepository.create(req.body)
    res.send({ id })
  } catch (error) {
    res.status(400).send(error.message)
  }
})

// Vistas
app.get('/', (req, res) => res.render('index'))

app.listen(PORT, () => {
  console.log(`🚀 NodeStock unificado corriendo en http://localhost:${PORT}`)
})