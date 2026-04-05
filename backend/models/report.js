const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: { type: String, default: "anonymous" },
  type: { 
    type: String, 
    required: true, 
    enum: ['Dark Street', 'Crowded', 'Suspicious Activity', 'Construction', 'Other'] 
  },
  description: { type: String },
  severity: { type: Number, min: 1, max: 5, default: 3 },
  // GeoJSON format is required for $near queries
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude] - Note the order!
      required: true
    }
  },
  createdAt: { type: Date, default: Date.now, expires: '7d' } // Auto-delete after 7 days
});

// CRITICAL: Create a 2dsphere index for geospatial searching
reportSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('Report', reportSchema);