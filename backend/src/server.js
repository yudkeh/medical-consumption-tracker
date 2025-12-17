const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const drugRoutes = require('./routes/drugs');
const procedureRoutes = require('./routes/procedures');
const procedureTypeRoutes = require('./routes/procedureTypes');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/drugs', drugRoutes);
app.use('/api/procedures', procedureRoutes);
app.use('/api/procedure-types', procedureTypeRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running' });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Serve static files from React app (only in production/Docker)
const fs = require('fs');

// Try multiple possible paths for frontend dist
const possiblePaths = [
  path.join(__dirname, '../../frontend/dist'),  // Relative from src/
  path.join(__dirname, '../frontend/dist'),     // Alternative relative
  '/app/frontend/dist',                         // Absolute Docker path
  path.resolve(__dirname, '../../frontend/dist'), // Resolved absolute
];

let frontendDistPath = null;
for (const testPath of possiblePaths) {
  if (fs.existsSync(testPath)) {
    frontendDistPath = testPath;
    console.log(`📦 Found frontend dist at: ${frontendDistPath}`);
    break;
  }
}

if (frontendDistPath) {
  // Log directory contents for debugging
  try {
    const files = fs.readdirSync(frontendDistPath);
    console.log(`📁 Frontend dist contents: ${files.join(', ')}`);
  } catch (err) {
    console.log(`⚠️  Could not read frontend dist directory: ${err.message}`);
  }
  
  // Serve static files (JS, CSS, images, etc.)
  app.use(express.static(frontendDistPath, {
    index: false, // Don't serve index.html automatically, we'll handle it
  }));
  
  // Explicit root route
  app.get('/', (req, res) => {
    const indexPath = path.join(frontendDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.log(`⚠️  index.html not found at: ${indexPath}`);
      res.status(404).send('Frontend index.html not found');
    }
  });
  
  // Handle React routing - return all non-API requests to React app
  app.get('*', (req, res) => {
    // Skip API routes (shouldn't reach here for /api/* but just in case)
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    // Serve React app for all other routes
    const indexPath = path.join(frontendDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Frontend not found');
    }
  });
} else {
  console.log(`⚠️  Frontend dist not found. Tried paths: ${possiblePaths.join(', ')}`);
  console.log(`📂 Current __dirname: ${__dirname}`);
  console.log(`📂 Current working directory: ${process.cwd()}`);
  
  // If no frontend, at least provide a simple root response
  app.get('/', (req, res) => {
    res.json({ 
      message: 'API is running', 
      frontend: 'Not available',
      health: '/api/health',
      debug: {
        __dirname: __dirname,
        cwd: process.cwd(),
        triedPaths: possiblePaths
      }
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

