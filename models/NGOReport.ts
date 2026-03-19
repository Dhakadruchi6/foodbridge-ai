import mongoose, { Schema, model, models } from 'mongoose';

const NGOReportSchema = new Schema({
    targetNgoId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    reportedByUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    reason: {
        type: String,
        required: true,
        enum: ['fraud', 'no_show', 'inappropriate_behavior', 'fake_documents', 'other'],
    },
    description: {
        type: String,
        default: '',
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

export default models.NGOReport || model('NGOReport', NGOReportSchema);
