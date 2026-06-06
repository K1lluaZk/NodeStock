# <p align="center">📦 NodeStock — Sistema de Gestión de Inventario</p>

<p align="center">
Una solución moderna para la administración de inventarios, control de movimientos, gestión de categorías y usuarios con autenticación segura basada en JWT.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat&logo=firebase&logoColor=black" alt="Firebase">
  <img src="https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white" alt="JWT">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/EJS-B4CA65?style=flat" alt="EJS">
</p>

---

## 🎯 Sobre el Proyecto

**NodeStock** es una plataforma de gestión de inventario diseñada para pequeñas y medianas empresas que necesitan un control preciso de sus productos, movimientos y usuarios.

La aplicación implementa una arquitectura organizada basada en repositorios y controladores, permitiendo administrar productos, categorías y movimientos de inventario mediante una interfaz intuitiva y segura.

El sistema incorpora autenticación mediante JWT, control de permisos por roles y almacenamiento persistente utilizando Firebase Firestore.

---

## ✨ Características Principales

### 📦 Gestión de Productos

* Registro de nuevos productos.
* Edición de información y precios.
* Control automático de stock.
* Asociación de productos a categorías.

### 📊 Control de Inventario

* Registro de entradas y salidas.
* Historial completo de movimientos.
* Actualización automática del stock.
* Trazabilidad por producto.

### 🗂️ Administración de Categorías

* Creación de categorías personalizadas.
* Edición y eliminación de categorías.
* Organización eficiente del inventario.

### 👥 Gestión de Usuarios

* Registro de usuarios.
* Asignación de roles.
* Administración centralizada.

### 🔐 Sistema de Roles y Permisos

* **Admin:** acceso total al sistema.
* **Manager:** gestión de inventario y categorías.
* **Viewer:** acceso de solo consulta.

### 🔑 Autenticación Segura

* Login mediante JWT.
* Refresh Tokens.
* Cookies HttpOnly.
* Protección de rutas privadas.

### 📈 Historial de Movimientos

* Registro detallado de cada operación.
* Fecha y hora de movimientos.
* Visualización por producto.
* Seguimiento completo del inventario.

---

## 🛠️ Tecnologías Utilizadas

### Backend

* Node.js
* Express.js
* Firebase Firestore
* Firebase Admin SDK
* JSON Web Token (JWT)
* bcrypt

### Frontend

* EJS
* HTML5
* Tailwind CSS
* JavaScript (ES6+)

### Seguridad

* JWT Authentication
* Refresh Tokens
* Cookies HttpOnly
* Middleware de autorización por roles

---

## 🚀 Cómo Ejecutar Localmente

### 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/K1lluaZk/NodeStock.git
cd NodeStock
```

### 2️⃣ Instalar dependencias

```bash
npm install
```

### 3️⃣ Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
PORT=3000

SECRET_JWT_KEY=tu_clave_jwt
REFRESH_SECRET_KEY=tu_clave_refresh

FIREBASE_PROJECT_ID=tu_project_id
FIREBASE_CLIENT_EMAIL=tu_client_email
FIREBASE_PRIVATE_KEY=tu_private_key
```

### 4️⃣ Ejecutar la aplicación

Modo desarrollo:

```bash
npm run dev
```

Modo producción:

```bash
npm start
```

### 5️⃣ Acceder al sistema

```text
http://localhost:3000
```

---

## 📁 Estructura del Proyecto

```text
NodeStock
│
├── server/
│   │
│   ├── controllers/
│   │   └── categoryController.js
│   │   └── movementController.js
│   │   └── productController.js
│   │
│   ├── middleware/
│   │   ├── authorizeRole.js
│   │   └── sessionMiddleware.js
│   │
│   ├── routes/
│   │   ├── movementRoutes.js
│   │   └── productRoutes.js
│   │   └── categoryRoutes.js
│   │
│   │
│   ├── category-repository.js
│   ├── config.js
│   ├── firebase.js
│   ├── index.js
│   └── user-repository.js
│
├── views/
│   │   │── partials/
│   │   │   │── modal-movimiento.ejs
│   │   │   │── modal-producto.ejs
│   ├── categories.ejs
│   ├── dashboard.ejs
│   ├── historial.ejs
│   └── index.ejs
│   └── users.ejs
│
├── .env
├── .gitignore
├── package-lock.json
├── package.json
└── README.md
```

---

## 🔒 Roles del Sistema

| Rol     | Permisos                                                          |
| ------- | ----------------------------------------------------------------- |
| Admin   | Gestión completa de usuarios, productos, categorías y movimientos |
| Manager | Gestión de inventario y categorías                                |
| Viewer  | Consulta de información sin modificaciones                        |

---

## 📌 Funcionalidades Futuras

* Dashboard analítico con gráficos.
* Exportación a Excel y PDF.
* Alertas de stock mínimo.
* Auditoría avanzada de movimientos.
* Soporte multiempresa.
* API pública documentada.

---

## 👨‍💻 Autor

**Mario (K1lluaZk)**

GitHub:
https://github.com/K1lluaZk

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT.

## Imagenes

<img width="654" height="583" alt="image" src="https://github.com/user-attachments/assets/d4b20c52-387b-4210-be05-1bec451e0da8" />
<img width="1227" height="429" alt="image" src="https://github.com/user-attachments/assets/b3e043af-a72f-443b-82ed-dbd9b29cbe37" />
<img width="1312" height="618" alt="image" src="https://github.com/user-attachments/assets/910bc50b-2a9c-4375-88b5-fb13c6bfd8e0" />
<img width="1006" height="544" alt="image" src="https://github.com/user-attachments/assets/95bab539-3e3b-407e-ab61-760d2af46230" />
