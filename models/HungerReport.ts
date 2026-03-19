import mongoose, { Schema, model, models } from 'mongoose';

const HungerReportSchema = new Schema({
    locationName: {
        type: String,
        required: true,
    },
    lat: {
        type: Number,
        required: true,
    },
    lng: {
        type: Number,
        required: true,
    },
    peopleCount: {
        type: Number,
        required: true,
    },
    urgency: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
    reportedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Can be null for anonymous
        default: null,
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'resolved', 'fake'],
        default: 'pending',
    },
}, {
    timestamps: true,
});

export default models.HungerReport || model('HungerReport', HungerReportSchema);
