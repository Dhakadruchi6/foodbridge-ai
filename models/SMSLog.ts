import mongoose, { Schema, model, models } from 'mongoose';

const SMSLogSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },
    phone: {
        type: String,
        required: true,
        index: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['new_donation', 'urgent_expiry', 'mission_accepted', 'status_update', 'otp'],
        required: true,
    },
    status: {
        type: String,
        enum: ['sent', 'failed', 'rate_limited'],
        default: 'sent',
    },
    sentAt: {
        type: Date,
        default: Date.now,
        index: true,
    }
}, {
    timestamps: true,
});

// Index for rate limiting (last hour)
SMSLogSchema.index({ userId: 1, sentAt: -1 });

export default models.SMSLog || model('SMSLog', SMSLogSchema);
