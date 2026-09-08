require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDatabase } = require('./config/db');
const booksRoutes = require('./routes/books');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'Inventory API is running.' });
});

app.use('/api/books', booksRoutes);

const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = app;
