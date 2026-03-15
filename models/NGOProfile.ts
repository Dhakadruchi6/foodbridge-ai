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
}, {
  timestamps: true,
});

export default models.NGOProfile || model('NGOProfile', NGOProfileSchema);
