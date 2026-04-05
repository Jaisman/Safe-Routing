const mongoose = require('mongoose');

const crimeSchema = new mongoose.Schema({
  type: String, // e.g., "Theft", "Harassment"
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [lng, lat]
  },
  severity: Number, // 1 to 10
  timestamp: { type: Date, default: Date.now }
});

crimeSchema.index({ location: "2dsphere" });
module.exports = mongoose.model('Crime', crimeSchema);