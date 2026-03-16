import mongoose, { Schema, model, models } from 'mongoose';

const VerificationSchema = new Schema({
    phone: {
        type: String,
        required: true,
        index: true,
    },
    otp: {
        type: String,
        required: true,
    },
    attemptCount: {
        type: Number,
        default: 0,
    },
    requestHistory: [Date], // Track timestamps of OTP requests per hour
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: '5m' }, // Auto-delete after 5 minutes
    },
}, {
    timestamps: true,
});

export default models.Verification || model('Verification', VerificationSchema);
