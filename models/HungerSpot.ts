import mongoose, { Schema, model, models } from 'mongoose';

const HungerSpotSchema = new Schema({
    name: {
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
    category: {
        type: String,
        enum: ['slum', 'shelter', 'orphanage', 'community_center', 'other'],
        default: 'other',
    },
    urgency: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
    addedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

export default models.HungerSpot || model('HungerSpot', HungerSpotSchema);
