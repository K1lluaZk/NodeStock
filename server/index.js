import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path' // Importación necesaria
import { fileURLToPath } from 'url' // Necesario para obtener rutas en ES Modules
import jwt from 'jsonwebtoken'
import { PORT, SECRET_JWT_KEY } from './config.js'
import { UserRepository } from './user-repository.js'
import productRoutes from './routes/productRoutes.js'
import movementRoutes from './routes/movementRoutes.js'
import { db } from './config/firebase.js'
import categoryRoutes from './routes/categoryRoutes.js';

// Configuración de rutas absolutas
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Middlewares
app.use(cors())
app.use(express.json())
app.use(cookieParser())

// CONFIGURACIÓN DE VISTAS (Solución al error)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views')) // Indica que las vistas están en server/views

// Rutas de API
app.use('/api/products', productRoutes)
app.use('/api/movements', movementRoutes)
app.use('/api/categories', categoryRoutes);

// Rutas de Auth
app.post('/login', async (req, res) => {
  try {
    const user = await UserRepository.login(req.body);
    
    // Generar el token
    const token = jwt.sign(
      { id: user.id, username: user.username }, 
      SECRET_JWT_KEY, 
      { expiresIn: '1h' }
    );

    res
      .cookie('access_token', token, {
        httpOnly: true,
        secure: false, // OBLIGATORIO false para localhost
        sameSite: 'lax', // Cambia 'strict' por 'lax' para facilitar el redireccionamiento
        maxAge: 1000 * 60 * 60
      })
      .json({ user }); // Cambia .send por .json
  } catch (error) {
    res.status(401).send(error.message);
  }
});

app.post('/register', async (req, res) => {
  try {
    const id = await UserRepository.create(req.body)
    res.send({ id })
  } catch (error) {
    res.status(400).send(error.message)
  }
})

app.post('/logout', (req, res) => {
  // Eliminamos la cookie 'access_token'
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: false, // igual que en el login
    sameSite: 'lax'
  }).json({ message: 'Sesión cerrada correctamente' });
});

// --- VISTAS ---

app.get('/', (req, res) => {
  const token = req.cookies.access_token
  if (token) {
    try {
      const data = jwt.verify(token, SECRET_JWT_KEY)
      return res.render('index', { username: data.username })
    } catch (e) {}
  }
  res.render('index', { username: undefined })
})

app.get('/dash', (req, res) => {
  const token = req.cookies.access_token
  if (!token) return res.redirect('/')

  try {
    const data = jwt.verify(token, SECRET_JWT_KEY)
    res.render('dash', { user: data }) // Renderiza server/views/dash.ejs
  } catch (e) {
    res.redirect('/')
  }
})

app.get('/producto/:id', async (req, res) => {
    const token = req.cookies.access_token;
    if (!token) return res.redirect('/');

    try {
        const data = jwt.verify(token, SECRET_JWT_KEY);
        const productId = req.params.id;

        // 1. Obtener datos del producto
        const productDoc = await db.collection('products').doc(productId).get();
        
        if (!productDoc.exists) {
            return res.status(404).send('Producto no encontrado');
        }

        const productoData = { id: productDoc.id, ...productDoc.data() };

        // 2. Obtener movimientos asociados a este producto
        const movementsSnapshot = await db.collection('movements')
            .where('productId', '==', productId)
            .orderBy('date', 'desc')
            .get();

        const movimientos = movementsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // 3. Renderizar la vista pasando AMBOS objetos
        res.render('historial', { 
            user: data, 
            producto: productoData, 
            movimientos: movimientos 
        });

    } catch (e) {
        console.error(e);
        res.redirect('/dash');
    }
});

app.get('/historial', async (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.redirect('/');

  try {
    const data = jwt.verify(token, SECRET_JWT_KEY);
    
    // Traemos los movimientos ordenados por fecha
    const snapshot = await db.collection('movements').orderBy('date', 'desc').get();
    const movimientos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Renderizamos la vista historial.ejs pasando los datos
    res.render('historial', { user: data, movimientos });
  } catch (e) {
    res.redirect('/');
  }
});

app.get('/categorias', async (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.redirect('/');

  try {
    const data = jwt.verify(token, SECRET_JWT_KEY);
    
    // Consultar la colección de categorías en Firebase
    const snapshot = await db.collection('categories').get();
    const categorias = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));

    // Renderiza crud.ejs pasando las categorías
    res.render('crud', { user: data, categorias }); 
  } catch (e) {
    console.error("Error en categorías:", e);
    res.redirect('/dash');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 NodeStock unificado corriendo en http://localhost:${PORT}`)
})