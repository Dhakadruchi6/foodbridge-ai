import mongoose, { Schema, model, models } from 'mongoose';

const ReportSchema = new Schema({
    donationId: {
        type: Schema.Types.ObjectId,
        ref: 'Donation',
        required: true,
    },
    reportedByNgoId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    reason: {
        type: String,
        required: true,
        enum: ['not_food', 'inappropriate_image', 'fake_address', 'other'],
        default: 'not_food'
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
        default: 'pending',
        index: true,
    },
    adminNotes: {
        type: String,
        default: '',
    },
    adminAction: {
        type: String,
        enum: ['none', 'warning', 'suspension', 'deletion'],
        default: 'none',
    },
}, {
    timestamps: true,
});

export default models.Report || model('Report', ReportSchema);
