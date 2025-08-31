const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('./config/passport');
const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const googleAuthRoutes = require('./routes/googleAuth');
const notesRoutes = require('./routes/notes');
const adminRoutes = require('./routes/admin');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://note-hive-fawn.vercel.app", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true
});

const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: ["https://note-hive-fawn.vercel.app", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Session middleware for Passport
app.use(session({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuthRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'NoteHive API is running!' });
});

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint working', timestamp: new Date().toISOString() });
});


// Initialize Socket.io for real-time collaboration
const collaborationHandler = require('./sockets/collaboration');
const ioInstance = collaborationHandler(io);

// Make io instance available to routes
app.set('io', ioInstance);

server.listen(PORT, 'localhost', () => {
  const address = server.address();
  const url = `http://${address.address}:${address.port}`;
  console.log(`Server running on ${url}`);
  console.log(`Socket.io server ready for real-time collaboration`);

  // If running as a child process (e.g., from Electron), send ready message
  if (process.send) {
    process.send({ type: 'SERVER_READY', url: url });
  }
});

//code by abhigyann:)
