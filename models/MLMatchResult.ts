import mongoose, { Schema, model, models } from 'mongoose';

const MLMatchResultSchema = new Schema({
  donationId: {
    type: Schema.Types.ObjectId,
    ref: 'Donation',
    required: true,
    index: true,
  },
  ngoId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  matchScore: {
    type: Number,
    required: true,
  },
  distance: {
    type: Number,
  },
  predictedPriority: {
    type: String,
  },
}, {
  timestamps: true,
});

export default models.MLMatchResult || model('MLMatchResult', MLMatchResultSchema);
