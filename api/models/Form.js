const mongoose = require('mongoose');

const FormSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  config: { type: Array, required: true },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Form', FormSchema);
