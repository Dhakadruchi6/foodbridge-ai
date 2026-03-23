import mongoose, { Schema, model, models } from 'mongoose';

const HungerReportSchema = new Schema({
    // Reporter details
    name: {
        type: String,
        required: true,
        trim: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    // Location
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
    address: {
        type: String,
        default: '',
    },
    // Request details
    quantity: {
        type: Number,
        required: true,
    },
    peopleCount: {
        type: Number,
        default: 0,
    },
    description: {
        type: String,
        default: '',
    },
    urgency: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
    // Status tracking
    status: {
        type: String,
        enum: ['pending', 'accepted', 'on_the_way', 'arrived', 'completed'],
        default: 'pending',
    },
    acceptedByNgo: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    ngoAcceptedAt: {
        type: Date,
        default: null,
    },
    reportedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
}, {
    timestamps: true,
});

export default models.HungerReport || model('HungerReport', HungerReportSchema);
