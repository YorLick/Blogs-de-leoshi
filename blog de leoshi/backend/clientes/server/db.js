const mysql = require('mysql2/promise');

// ¡IMPORTANTE! En un proyecto real, estos datos deberían estar en variables de entorno (.env) y no en el código.
const dbConfig = {
    host: 'localhost',
    user: 'root',
    // 👇 ¡RECUERDA CAMBIAR ESTO por la contraseña que creaste durante la instalación de MySQL!
    password: 'TU_CONTRASENA_DE_MYSQL', 
    database: 'mi_sitio_web_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Crear un "pool" de conexiones. Es más eficiente que crear una conexión por cada petición.
const pool = mysql.createPool(dbConfig);

module.exports = pool;