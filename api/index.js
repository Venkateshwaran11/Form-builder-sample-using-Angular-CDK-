require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// const dns = require('node:dns');
// dns.setServers(['1.1.1.1', '8.8.8.8']);
const fs = require('fs');

const formRoutes = require('./_src/routes/formRoutes');
const responseRoutes = require('./_src/routes/responseRoutes');
const uploadRoutes = require('./_src/routes/uploadRoutes');
const authRoutes = require('./_src/routes/registerandLoginRoutes')

console.log("Server started at:", new Date().toISOString());
console.log("PID:", process.pid);

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/formbuilder';

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Create local uploads directory if it does not exist
const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Serve static files in production (only if NOT on Vercel)
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  const distPath = path.join(__dirname, '../dist/browser');
  app.use(express.static(distPath));
}

// Database Connection
async function connectDB(){
await mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));
}
connectDB()
// --- API ROUTES ---
app.use('/api/forms', formRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/auth',authRoutes)
// Single Page Application (SPA) Support for Angular
// This catch-all route should be AFTER all API routes
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/browser', 'index.html'));
  });
}

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
