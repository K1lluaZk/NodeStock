import express from 'express'
import cors from 'cors';
import { PORT } from './config.js'
import { UserRepository } from './user-repository.js'
import productRoutes from './routes/productRoutes.js';
import movementRoutes from './routes/movementRoutes.js';
import { db } from './config/firebase.js';
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


const app = express()

app.use(cors());
app.use(express.json());
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(express.json())

app.use('/api/products', productRoutes);
app.use('/api/movements', movementRoutes);

app.get('/', (req, res) => {
  res.render('index')
})

app.get('/producto/:id', async (req, res) => {
  try {
    const { id } = req.params
    const productDoc = await db.collection('products').doc(id).get()
    
    if (!productDoc.exists) return res.status(404).send('Producto no encontrado')
    
    const movementsSnapshot = await db.collection('movements')
      .where('productId', '==', id)
      .get()
      
    const movimientos = movementsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.date) - new Date(a.date))

    res.render('historial', { 
      producto: { id: productDoc.id, ...productDoc.data() },
      movimientos 
    })
  } catch (error) {
    res.status(500).send(error.message)
  }
})

app.post('/login', async (req, res) => {
  const { username, password } = req.body

  try {
    const user = await UserRepository.login({ username, password })
    res.send({ user })
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

app.post('/logout', (req, res) => {})

app.get('/protected', (req, res) => {})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})