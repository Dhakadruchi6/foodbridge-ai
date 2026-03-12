import mongoose, { Schema, model, models } from 'mongoose';

const DonationSchema = new Schema({
  donorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  foodType: {
    type: String,
    required: true,
  },
  quantity: {
    type: String,
    required: true,
  },
  expiryTime: {
    type: Date,
    required: true,
  },
  pickupAddress: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'picked_up', 'delivered'],
    default: 'pending',
    index: true,
  },
  perishabilityScore: {
    type: Number,
    default: 0,
  },
  prioritizationRank: {
    type: Number,
    default: 0,
    index: true,
  },
}, {
  timestamps: true,
});

export default models.Donation || model('Donation', DonationSchema);
