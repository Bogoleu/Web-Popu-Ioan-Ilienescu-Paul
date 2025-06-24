const { Schema, model } = require('mongoose');

const dumpsterSchema = new Schema({
    neighborhood: {
        type: String,
        required: true,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    street: {
        type: String,
        required: true,
        trim: true
    },
    dumpsterType: {
        type: String,
        enum: ['household', 'paper', 'plastic', 'glass', 'metal', 'electronics', 'batteries', 'organic', 'textiles', 'construction'],
        required: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'maintenance', 'out_of_service'],
        default: 'active'
    }
}, { collection: 'dumpsters'});

module.exports = model('dumpsters', dumpsterSchema);