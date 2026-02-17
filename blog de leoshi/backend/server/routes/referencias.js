const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Importamos la instancia de la BD de SQLite

// Ruta para obtener todas las referencias
// GET /api/referencias
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM referencias';

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error al consultar las referencias:', err.message);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        res.json(rows);
    });
});

module.exports = router;