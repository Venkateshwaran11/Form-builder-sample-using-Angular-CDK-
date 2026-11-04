const mongoose = require('mongoose');

const CustomFieldSchema = new mongoose.Schema({
    id: { type: String },
    key: { type: String, required: true },
    label: { type: String, required: true },
    value: { type: String, default: '' },
    type: { type: String, default: 'text' }
}, { _id: false });

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    profileImage: { type: String, default: '' },
    bio: { type: String, default: '' },
    phone: { type: String, default: '' },
    designation: { type: String, default: '' },
    department: { type: String, default: '' },
    organization: { type: String, default: '' },
    location: { type: String, default: '' },
    customFields: { type: [CustomFieldSchema], default: [] },
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
}, { timestamps: true, strict: false });

module.exports = mongoose.model('User', UserSchema);
