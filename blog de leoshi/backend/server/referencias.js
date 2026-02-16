const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Importamos el pool de conexiones

// Ruta para obtener todas las referencias
// GET /api/referencias
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM referencias');
        res.json(rows);
    } catch (error) {
        console.error('Error al consultar las referencias:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;