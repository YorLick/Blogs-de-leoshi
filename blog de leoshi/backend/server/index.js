const express = require('express');
const cors = require('cors'); // Para permitir que tu frontend pida datos

const app = express();
const port = 3000; // El puerto donde se ejecutará tu backend

// --- Middlewares ---
// Habilitar CORS para permitir peticiones desde cualquier origen (tu main.html)
app.use(cors());
// Habilitar el parseo de JSON en el body de las peticiones (para POST, PUT, etc.)
app.use(express.json());

// --- Rutas ---
// Importamos los enrutadores
const referenciasRouter = require('./routes/referencias');
const usuariosRouter = require('./routes/usuarios');
const postsRouter = require('./routes/posts');

// Usamos los enrutadores con sus prefijos de API
app.use('/api/referencias', referenciasRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/posts', postsRouter);

// --- Iniciar Servidor ---
// Iniciar el servidor y ponerlo a escuchar peticiones
app.listen(port, () => {
    console.log(`Servidor backend escuchando en http://localhost:${port}`);
});