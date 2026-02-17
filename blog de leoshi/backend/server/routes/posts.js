const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Importamos la instancia de la BD de SQLite

// Aquí irán las futuras rutas para los posts (crear, leer, actualizar, borrar)

// Ejemplo de ruta para obtener todos los posts
// GET /api/posts
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM posts';

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error al consultar los posts:', err.message);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        res.json(rows);
    });
});

module.exports = router;
