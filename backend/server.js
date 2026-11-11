const express = require('express');
const cors = require('cors');
require('dotenv').config();
const migrate = require('./migrate');

const app = express();

app.set('trust proxy', 1);

// CORS_ORIGIN: lista separada por comas; sin definir permite cualquier origen
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : null;
app.use(cors({ origin: allowedOrigins || true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tecnicos', require('./routes/tecnicos'));
app.use('/api/suministros', require('./routes/suministros'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/statistics', require('./routes/statistics'));
app.use('/api/export', require('./routes/export'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;

migrate()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((err) => {
    console.error('✗ Error al iniciar:', err.message);
    process.exit(1);
  });

module.exports = app;
