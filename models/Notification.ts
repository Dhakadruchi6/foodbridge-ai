import mongoose, { Schema, model, models } from 'mongoose';

const NotificationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    donationId: {
        type: Schema.Types.ObjectId,
        ref: 'Donation',
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['donation_accepted', 'pickup_started', 'collected', 'delivered', 'new_donation', 'system'],
        default: 'system',
    },
    read: {
        type: Boolean,
        default: false,
        index: true,
    },
}, {
    timestamps: true,
});

export default models.Notification || model('Notification', NotificationSchema);
