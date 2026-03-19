import mongoose, { Schema, model, models } from 'mongoose';

const NGOProfileSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ngoName: {
    type: String,
    required: true,
  },
  registrationNumber: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
  },
  pincode: {
    type: String,
  },
  contactPhone: {
    type: String,
    required: true,
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  capacity: {
    type: Number,
    default: 100, // Default capacity in units/kg
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  description: String,
  isVerified: {
    type: Boolean,
    default: false,
  },
  certificateUrl: {
    type: String,
  },
  idProofUrl: {
    type: String,
  },
  trustScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100,
  },
  reportsCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

export default models.NGOProfile || model('NGOProfile', NGOProfileSchema);
