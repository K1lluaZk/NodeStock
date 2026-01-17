import express from 'express'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'

import { PORT, SECRET_JWT_KEY } from './config.js'
import { UserRepository } from './user-repository.js'
import { CategoryRepository } from './category-repository.js'

const app = express()

app.set('view engine', 'ejs')

app.use(express.json())
app.use(cookieParser())

app.use((req, res, next) => {
  const token = req.cookies.access_token
  req.session = { user: null }

  try {
    const data = jwt.verify(token, SECRET_JWT_KEY)
    req.session.user = data
  } catch {}

  next() // Seguir al siguiente middleware o ruta
})

app.get('/', (req, res) => {
  const { user } = req.session
  res.render('index', user)
})

app.post('/login', async (req, res) => {
  const { username, password } = req.body

  try {
    const user = await UserRepository.login({ username, password })
    const token = jwt.sign(
      { id: user._id, username: user.username },
      SECRET_JWT_KEY,
      {
        expiresIn: '1h'
      })
    res
      .cookie('access_token', token, {
        httpOnly: true, // la cookie solo se puede acceder en el servidor
        secure: process.env.NODE_ENV === 'production', // solo se envia en https en produccion
        sameSite: 'strict', // la cookie solo se puede acceder en el mismo dominio
        maxAge: 1000 * 60 * 60 // la cookie tiene validez solo de 1 hora
      })
      .send({ user, token })
  } catch (error) {
    res.status(401).send(error.message)
  }
})

app.post('/register', async (req, res) => {
  const { username, password } = req.body // ????
  console.log({ username, password })

  try {
    const id = await UserRepository.create({ username, password })
    res.send({ id })
  } catch (error) {
    res.status(400).send(error.message)
  }
})

app.post('/logout', (req, res) => {
  res
    .clearCookie('access_token')
    .json({ message: 'Logout successfull' })
})

app.get('/protected', (req, res) => {
  const { user } = req.session
  if (!user) return res.status(403).send('Access not authorized')
  res.render('protected', user) // { id, username }
})

app.post('/create', async (req, res) => {
  const { name, description } = req.body
  console.log({ name, description })

  try {
    const id = await CategoryRepository.create({ name, description })
    res.send({ id })
  } catch (error) {
    res.status(400).send(error.message)
  }
})

app.get('/categories', async (req, res) => {
  try {
    const categories = await CategoryRepository.getAll()
    res.send(categories)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

app.put('/update/:id', async (req, res) => {
  try {
    await CategoryRepository.update({
      id: req.params.id,
      ...req.body
    })

    res.send({ message: 'Category updated' })
  } catch (error) {
    res.status(400).send(error.message)
  }
})

app.delete('/delete/:id', async (req, res) => {
  try {
    await CategoryRepository.delete({ id: req.params.id })
    res.send({ message: 'Category deleted' })
  } catch (error) {
    res.status(400).send(error.message)
  }
})

app.get('/crud', (req, res) => {
  const { user } = req.session
  if (!user) return res.status(403).send('Access not authorized')
  res.render('crud', user)
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
