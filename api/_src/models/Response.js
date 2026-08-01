const mongoose = require('mongoose');

// Dynamic schema for form submissions (responses)
const ResponseSchema = new mongoose.Schema({
  formId: { type: String, required: true }, // References Form.name
  data: { type: mongoose.Schema.Types.Mixed, required: true }, // Dynamic payload
  submittedAt: { type: Date, default: Date.now }
}, { strict: false }); // Disable strict mode to allow dynamic fields

module.exports = mongoose.model('Response', ResponseSchema);
