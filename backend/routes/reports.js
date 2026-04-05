const express = require('express');
const router = express.Router();
const Report = require('../models/report');

// POST: Submit a new safety report
router.post('/add', async (req, res) => {
  try {
    const { type, lat, lng, severity, description } = req.body;

    // 1. Basic Validation
    if (!type || !lat || !lng) {
      return res.status(400).json({ error: "Type and coordinates are required" });
    }

    // 2. Create the GeoJSON formatted report
    const newReport = new Report({
      type,
      severity: severity || 3,
      description: description || "",
      location: {
        type: "Point",
        coordinates: [Number(lng), Number(lat)] // MongoDB GeoJSON is [lng, lat]
      }
    });

    const savedReport = await newReport.save();
    
    res.status(201).json({
      message: "Safety report submitted successfully",
      reportId: savedReport._id
    });

  } catch (err) {
    console.error("Report Submission Error:", err.message);
    res.status(500).json({ error: "Server error while saving report" });
  }
});

// GET: Fetch reports within a radius (for the Map Heatmap)
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query; // default 5km

    const reports = await Report.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(radius) 
        }
      }
    });

    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: "Error fetching nearby reports" });
  }
});

module.exports = router;