const { Schema, model } = require('mongoose');

const reportsSchema = new Schema({
    reporterId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    dumpsterId: {
        type: Schema.Types.ObjectId,
        ref: 'dumpsters',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'resolved', 'rejected'],
        default: 'pending'
    },
    issue: {
        type: String,
        enum: ["overflowing", "illegal_materials", "bad_odors", "safety_harzards", "vandalized", "other"],
        required: true,
    },
    description: {
        type: String,
        required: false
    },
    category: {
        type: String,
        enum: [ "household", "paper",  "plastic",  "glass",  "metal",  "electronics",  "batteries", "organic", "textiles", "construction"],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    resolvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: false
    },
    resolutionDetails: {
        type: String,
        required: false,
        trim: true
    }
}, { collection: 'reports'});

module.exports = model('reports', reportsSchema);