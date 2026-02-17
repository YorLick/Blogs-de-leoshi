const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

// Define la ruta al archivo de la base de datos.
// Usará el valor de .env o un valor por defecto 'blog.db'
const dbPath = process.env.DB_FILE || 'blog.db';

// Crea o abre la base de datos en el archivo especificado
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al abrir la base de datos SQLite:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
        // Opcional: Crear tablas si no existen al iniciar.
        db.exec(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                titulo TEXT NOT NULL,
                contenido TEXT NOT NULL,
                autor_id INTEGER,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (autor_id) REFERENCES usuarios(id)
            );
            CREATE TABLE IF NOT EXISTS referencias (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                url TEXT NOT NULL
            );
        `, (err) => {
            if (err) {
                console.error("Error al crear las tablas:", err.message);
            }
        });
    }
});

module.exports = db;
