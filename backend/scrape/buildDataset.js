const fs = require("fs");
const axios = require("axios");
require("dotenv").config();

const connectDB = require("../config/db");

const {
  getSafetyFeatures,
  getCrimeData
} = require("../routes/route");

const ORS_KEY = process.env.ORS_KEY;

const OUTPUT = "dataset.csv";

async function getRoute(start, end) {

  const res = await axios.post(
    "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
    {
      coordinates: [
        [start.lng, start.lat],
        [end.lng, end.lat]
      ]
    },
    {
      headers: {
        Authorization: ORS_KEY,
        "Content-Type": "application/json"
      }
    }
  );

  return res.data.features[0].geometry.coordinates;

}

function randomCity() {

  const cities = [
    { lat: 28.6139, lng: 77.2090 },
    { lat: 26.8467, lng: 80.9462 },
    { lat: 25.4358, lng: 81.8463 },
    { lat: 23.2599, lng: 77.4126 },
    { lat: 22.5726, lng: 88.3639 },
    { lat: 19.0760, lng: 72.8777 }
  ];

  return cities[Math.floor(Math.random() * cities.length)];

}

async function main() {

  await connectDB();

  if (!fs.existsSync(OUTPUT)) {

    fs.writeFileSync(
      OUTPUT,
      "lighting,buildingDensity,cctv,nightlife,districtRisk,userPenalty,timeRisk,crimeNearby\n"
    );

  }

  for (let i = 0; i < 300; i++) {

    console.log("Generating route:", i);

    const start = randomCity();
    const end = randomCity();

    try {

      const route = await getRoute(start, end);

      const samples = route.filter((_, i) => i % 10 === 0);

      for (const c of samples) {

        const point = { lat: c[1], lng: c[0] };

        console.log("Processing point:", point);

        const features = await getSafetyFeatures(point.lat, point.lng);

        const crimes = await getCrimeData(point.lat, point.lng);

        const crimeNearby = crimes.length > 0 ? 1 : 0;

        const row = [
          features.lighting,
          features.buildingDensity,
          features.cctv,
          features.nightlife,
          features.districtRisk,
          features.userPenalty,
          features.timeRisk,
          crimeNearby
        ].join(",");

        fs.appendFileSync(OUTPUT, row + "\n");

        await new Promise(r => setTimeout(r, 200));

      }

    } catch (err) {

      console.log("Route failed",err.response?.data || err.message);

    }

  }

  console.log("Dataset generation complete");

}

main();