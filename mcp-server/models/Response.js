const mongoose = require('mongoose');

const ResponseSchema = new mongoose.Schema({
  formId: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  submittedAt: { type: Date, default: Date.now }
}, { strict: false });

module.exports = mongoose.model('Response', ResponseSchema);
