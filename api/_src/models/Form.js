const mongoose = require('mongoose');

const FormSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  currentPublishedVersion: { type: Number, default: null },
  latestVersion: { type: Number, default: 0 }, // Highest published version number
  hasDraftChanges: { type: Boolean, default: true },

  // Working draft configuration edited in Form Builder
  draftConfig: { type: Array, default: [] },

  // Active published configuration served to public respondents
  publishedConfig: { type: Array, default: [] },

  // Legacy field preserved for backward compatibility
  config: { type: Array, default: [] },

  publishedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true }
});

// Synchronize draftConfig and config so legacy code reading/writing either works smoothly
FormSchema.pre('save', function(next) {
  if ((!this.draftConfig || this.draftConfig.length === 0) && (this.config && this.config.length > 0)) {
    this.draftConfig = this.config;
  }
  if ((!this.config || this.config.length === 0) && (this.draftConfig && this.draftConfig.length > 0)) {
    this.config = this.draftConfig;
  }
  next();
});

module.exports = mongoose.model('Form', FormSchema);
