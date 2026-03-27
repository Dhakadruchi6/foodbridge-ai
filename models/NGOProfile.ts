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
  /**
   * NGO Verification System - SINGLE SOURCE OF TRUTH
   * ---------------------------------------------
   * Use ONLY 'ngo_verified' for backend logic and authorization.
   * 'verificationStatus', 'status', and 'isVerified' are kept for
   * legacy UI compatibility but MUST always be synced with 'ngo_verified'.
   */
  ngo_verified: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
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
