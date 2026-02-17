const mysql = require('mysql2/promise');
require('dotenv').config(); // Cargar variables de entorno

// ¡IMPORTANTE! En un proyecto real, estos datos deberían estar en variables de entorno (.env) y no en el código.
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'TU_CONTRASENA_DE_MYSQL', 
    database: process.env.DB_NAME || 'mi_sitio_web_db',
    waitForConnections: true,
    connectionLimit: 50,
    queueLimit: 0
};

// Crear un "pool" de conexiones. Es más eficiente que crear una conexión por cada petición.
const pool = mysql.createPool(dbConfig);

module.exports = pool;