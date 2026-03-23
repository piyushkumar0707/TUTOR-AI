require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const app = express();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth requests. Please try again later.' },
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/pdf',  require('./routes/pdf'));

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  if (res.headersSent) return next(err);
  return res.status(500).json({ error: 'Server error' });
});

// MongoDB connection + server start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.info('MongoDB connected');
    app.listen(process.env.PORT || 5000, () => {
      console.info(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
