const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    crime_rate: {
        type: Number,
        required: true
    },
    risk_multiplier: {
        type: Number,
        required: true,
        default: 1.0
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    lastUpdated: {
        type: String,
        default: () => new Date().toISOString().split('T')[0]
    }
});

// CRITICAL: This index allows the $near queries in your route.js to work
districtSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('District', districtSchema, 'districts');