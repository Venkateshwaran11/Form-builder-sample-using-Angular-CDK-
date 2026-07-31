require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Form = require('./models/Form');
const Response = require('./models/Response');
// const dns = require('node:dns');
// dns.setServers(['1.1.1.1', '8.8.8.8']);

console.log("Server started at:", new Date().toISOString());
console.log("PID:", process.pid);

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/formbuilder';

const fs = require('fs');

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
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- API TO MANAGE FORM DEFINITIONS ---

// Save or Update a Form Config
app.post('/api/forms', async (req, res) => {
  try {
    const { name, displayName, config, _id } = req.body;
    const filter = _id ? { _id } : { name };
    const isExistingForm = await Form.find({ name: name });
    if (isExistingForm.length > 0 && !_id) {
      return res.status(400).json({ error: 'Form already exists' });
    }
    let form = await Form.findOneAndUpdate(
      filter,
      {
        $set: {
          name,
          displayName,
          config,
          updatedAt: Date.now()
        }
      },
      { new: true, upsert: true }
    );
    res.status(201).json(form);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get All Form Definitions
app.get('/api/forms', async (req, res) => {
  try {
    const forms = await Form.find().sort({ updatedAt: -1 }).lean();

    const counts = await Response.aggregate([
      {
        $group: {
          _id: "$formId",
          responseCount: { $sum: 1 }
        }
      }
    ]);

    const countMap = new Map(
      counts.map(c => [c._id.toString(), c.responseCount])
    );

    const formsWithCounts = forms.map(form => ({
      ...form,
      responseCount: countMap.get(form._id.toString()) || 0
    }));
    res.json(formsWithCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// get form by id
app.get('/api/forms/:id', async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    res.json(form);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Delete a Form Definition
app.delete('/api/forms/:name', async (req, res) => {
  try {
    const result = await Form.findOneAndDelete({ name: req.params.name });
    if (!result) return res.status(404).json({ error: 'Form not found' });
    await Response.deleteMany({ formId: req.params.name });
    res.json({ message: 'Form and associated responses deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API TO MANAGE FORM RESPONSES (Submitted Data) ---

// Save a Dynamic Form Submission
app.post('/api/responses', async (req, res) => {
  try {
    const { formId, data } = req.body;
    const submission = new Response({ formId, data });
    await submission.save();
    res.status(201).json(submission);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get All Responses for a specific form
app.get('/api/responses/:formId', async (req, res) => {
  try {
    const responses = await Response.find({ formId: req.params.formId }).sort({ submittedAt: -1 });
    res.json(responses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a specific response by ID
app.delete('/api/responses/:id', async (req, res) => {
  try {
    const result = await Response.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Response not found' });
    res.json({ message: 'Response deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete all responses for a form
app.delete('/api/responses/form/:formId', async (req, res) => {
  try {
    const result = await Response.deleteMany({ formId: req.params.formId });
    res.json({ message: `Deleted ${result.deletedCount} response(s)` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API FOR FILE UPLOADS ---
app.post('/api/upload', async (req, res) => {
  try {
    const { filename, base64 } = req.body;
    if (!filename || !base64) {
      return res.status(400).json({ error: 'Filename and base64 string are required.' });
    }

    // Remove base64 data URL prefix if present
    const base64Data = base64.replace(/^data:.*;base64,/, "");
    const fileBuffer = Buffer.from(base64Data, 'base64');

    // Create unique filename
    const uniqueFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadsDir, uniqueFilename);

    fs.writeFileSync(filePath, fileBuffer);

    // Return the relative file path URL
    const fileUrl = `/uploads/${uniqueFilename}`;
    res.json({ fileUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
