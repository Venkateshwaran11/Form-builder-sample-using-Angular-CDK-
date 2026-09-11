const mongoose = require('mongoose');

const FormSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  config: { type: Array, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy:{type:String,required:true}
});

module.exports = mongoose.model('Form', FormSchema);
