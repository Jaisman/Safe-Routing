const Crime = require("../models/crime");

async function getCrimeDensity(lat, lng, radius = 500) {

  try {

    const crimes = await Crime.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat]
          },
          $maxDistance: radius
        }
      }
    }).limit(20);

    return crimes.length;

  } catch (err) {

    console.log("Crime density error:", err.message);
    return 0;

  }

}

module.exports = { getCrimeDensity };