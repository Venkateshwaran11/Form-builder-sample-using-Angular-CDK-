const mongoose = require('mongoose');

const FormVersionSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true },
  formName: { type: String, required: true }, // slug identifier for easy reference
  version: { type: Number, required: true },  // 1, 2, 3...
  displayName: { type: String, required: true },
  config: { type: Array, required: true },     // Immutable snapshot of FieldConfig[]
  changelog: { type: String, default: '' },   // User or auto-generated change notes
  summary: {
    totalFields: { type: Number, default: 0 },
    fieldIds: [{ type: String }],
    fieldNames: [{ type: String }]
  },
  publishedBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Ensure (formId, version) is unique across the collection
FormVersionSchema.index({ formId: 1, version: 1 }, { unique: true });
FormVersionSchema.index({ formName: 1, version: -1 });

module.exports = mongoose.model('FormVersion', FormVersionSchema);
