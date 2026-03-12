import mongoose, { Schema, model, models } from 'mongoose';

const FeedbackSchema = new Schema({
  donationId: {
    type: Schema.Types.ObjectId,
    ref: 'Donation',
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  comment: {
    type: String,
  },
}, {
  timestamps: true,
});

export default models.Feedback || model('Feedback', FeedbackSchema);
