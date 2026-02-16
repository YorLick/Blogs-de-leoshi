const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/posts - Obtener todos los posts (para la página principal)
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, title, excerpt, author, DATE_FORMAT(created_at, "%d de %M, %Y") as created_date FROM posts ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error al consultar los posts:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET /api/posts/:id - Obtener un post específico
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT id, title, content, author, DATE_FORMAT(created_at, "%d de %M, %Y") as created_date FROM posts WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Post no encontrado' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error al consultar el post:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT /api/posts/:id - Actualizar un post
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'El título y el contenido son requeridos.' });
        }

        const [result] = await pool.query('UPDATE posts SET title = ?, content = ? WHERE id = ?', [title, content, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Post no encontrado para actualizar.' });
        }
        res.json({ message: 'Post actualizado correctamente.' });
    } catch (error) {
        console.error('Error al actualizar el post:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;