require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Form = require('./models/Form');
const Response = require('./models/Response');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/formbuilder';

// Middlewares
app.use(cors());
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist/learnangular/browser');
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
    const { name, displayName, config,_id } = req.body;
    const filter = _id ? { _id } : { name };
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
    const forms = await Form.find().sort({ updatedAt: -1 });
    res.json(forms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a Form Definition
app.delete('/api/forms/:name', async (req, res) => {
  try {
    const result = await Form.findOneAndDelete({ name: req.params.name });
    if (!result) return res.status(404).json({ error: 'Form not found' });
    res.json({ message: 'Form deleted successfully' });
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

// Single Page Application (SPA) Support for Angular
// This catch-all route should be AFTER all API routes
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/learnangular/browser', 'index.html'));
  });
}

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
