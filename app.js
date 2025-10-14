// app.js
const express = require('express');
const morgan = require('morgan');
require('dotenv').config();
const mariadb = require('mariadb');

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create MariaDB connection pool
const fs = require('fs');

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectionLimit: 5,
  ssl: {
    ca: fs.readFileSync(__dirname + '/certs/DigiCertGlobalRootG2.crt.pem')
  }
});

// Test connection at startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Connected to MariaDB successfully!');
    conn.release();
  } catch (err) {
    console.error('❌ Failed to connect to MariaDB:', err);
  }
})();

// Home Page with Form
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Hamza's Node.js App</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(to right, #e0f7fa, #ffffff); color: #333; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .container { background: white; padding: 30px 40px; border-radius: 16px; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1); text-align: center; width: 100%; max-width: 400px; }
        h1 { font-size: 1.8rem; color: #0078D7; margin-bottom: 20px; }
        input { width: 100%; padding: 12px; margin: 10px 0; border-radius: 8px; border: 1px solid #ccc; font-size: 1rem; }
        button { background-color: #0078D7; color: white; padding: 12px 20px; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer; }
        button:hover { background-color: #005bb5; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🌐 Hello! App.js is running on Azure App Service with CI/CD</h1>
        <p>Welcome from <strong>Our Team HHA</strong></p>
        <form action="/register" method="POST">
          <input type="text" name="name" placeholder="Enter your username" required />
          <input type="email" name="email" placeholder="Enter your gmail" required />
          <button type="submit">Register</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

// Register route (simulate missing DB)
app.post('/register', async (req, res) => {
  const { name, email } = req.body;

  try {
    const conn = await pool.getConnection();
    await conn.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email]);
    conn.release();

    res.send(`
      <h1>✅ Registration successful!</h1>
      <p>Name: ${name}</p>
      <p>Email: ${email}</p>
      <a href="/">← Back</a>
    `);
  } catch (err) {
    console.error('❌ Database error:', err);
    res.status(500).send(`
      <h1>❌ Database Error</h1>
      <p>We couldn’t save your data. Please check the DB connection.</p>
      <a href="/">← Back</a>
    `);
  }
});

// Health check route
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
