const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db'); // Importamos la instancia de la BD de SQLite

// Ruta para obtener todos los usuarios
// GET /api/usuarios
router.get('/', (req, res) => {
    const sql = 'SELECT id, nombre, email, fecha_creacion FROM usuarios';
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error al consultar los usuarios:', err.message);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        res.json(rows);
    });
});

// Ruta para crear un nuevo usuario
// POST /api/usuarios
router.post('/', async (req, res) => { // Mantenemos async por bcrypt
    const { nombre, email, password } = req.body;

    // Validación simple
    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos (nombre, email, password) son requeridos.' });
    }

    try {
        // Generar un hash seguro de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)';

        // Usamos function() para tener acceso a 'this'
        db.run(sql, [nombre, email, hashedPassword], function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(409).json({ error: 'El email ya está registrado.' });
                }
                console.error('Error al crear el usuario:', err.message);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }
            
            res.status(201).json({ id: this.lastID, nombre, email });
        });
    } catch (error) {
        // Este catch es para el error de bcrypt, si ocurre
        console.error('Error al hashear la contraseña:', error);
        res.status(500).json({ error: 'Error interno del servidor al procesar la solicitud.' });
    }
});

module.exports = router;