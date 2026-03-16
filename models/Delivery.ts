import mongoose, { Schema, model, models } from 'mongoose';

const DeliverySchema = new Schema({
  donationId: {
    type: Schema.Types.ObjectId,
    ref: 'Donation',
    required: true,
  },
  ngoId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  pickupTime: {
    type: Date,
  },
  deliveryTime: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['assigned', 'picked_up', 'completed'],
    default: 'assigned',
  },
  liveLatitude: {
    type: Number,
    default: null,
  },
  liveLongitude: {
    type: Number,
    default: null,
  },
  liveLocationUpdatedAt: {
    type: Date,
    default: null,
  },
  isLive: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export default models.Delivery || model('Delivery', DeliverySchema);
