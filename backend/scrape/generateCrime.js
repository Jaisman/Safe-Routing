const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("../config/db");
const District = require("../models/district");
const Crime = require("../models/crime");

function randomOffset() {
  return (Math.random() - 0.5) * 0.1;
}

function randomCrimeType() {
  const types = [
    "Theft",
    "Harassment",
    "Assault",
    "Robbery",
    "Vandalism"
  ];

  return types[Math.floor(Math.random() * types.length)];
}

async function main() {

  await connectDB();

  const districts = await District.find();

  console.log("Districts found:", districts.length);

  for (const d of districts) {

    const baseCrimes = Math.floor(d.risk_multiplier * 30);

    const lat = d.location.coordinates[1];
    const lng = d.location.coordinates[0];

    for (let i = 0; i < baseCrimes; i++) {

      const crimeLat = lat + randomOffset();
      const crimeLng = lng + randomOffset();

      await Crime.create({
        type: randomCrimeType(),
        location: {
          type: "Point",
          coordinates: [crimeLng, crimeLat] // [lng, lat]
        },
        severity: Math.floor(Math.random() * 10) + 1
      });

    }

    console.log(`Generated ${baseCrimes} crimes for: ${d.name}`);

  }

  console.log("Crime dataset created successfully");

  mongoose.connection.close();
}

main();