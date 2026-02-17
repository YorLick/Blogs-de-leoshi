const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // Necesario: npm install bcrypt
const pool = require('../config/db'); // Importamos el pool de conexiones

// Ruta para obtener todos los usuarios
// GET /api/usuarios
router.get('/', async (req, res) => {
    try {
        // Excluimos el password de la consulta por seguridad
        const [rows] = await pool.query('SELECT id, nombre, email, fecha_creacion FROM usuarios');
        res.json(rows);
    } catch (error) {
        console.error('Error al consultar los usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para crear un nuevo usuario
// POST /api/usuarios
router.post('/', async (req, res) => {
    const { nombre, email, password } = req.body;

    // Validación simple
    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos (nombre, email, password) son requeridos.' });
    }

    try {
        // Generar un hash seguro de la contraseña (costo 10)
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
            [nombre, email, hashedPassword]
        );
        
        res.status(201).json({ id: result.insertId, nombre, email });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'El email ya está registrado.' });
        }
        console.error('Error al crear el usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;