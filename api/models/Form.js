const mongoose = require('mongoose');

const FormSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  config: { type: Array, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Form', FormSchema);
