const express = require("express");
const router = express.Router();
const axios = require("axios");
const https = require("https");
const Report = require('../models/report');
const Crime = require('../models/crime');
const District = require('../models/district');
const { getCrimeDensity } = require("../services/crimeService");
const {
  buildDistrictGraph,
  findNearestDistrict,
  aStar
} = require("../services/districtGraph");

async function getDistrictRiskMultiplier(lat, lng) {
  try {
    // 1. Log the attempt
    console.log(`🔎 ATTEMPTING DB FETCH: Lng ${lng}, Lat ${lat}`);

    // 2. Try to find ANY Delhi record by name (ignoring coordinates for a second)
      // 3. Now try the actual Geospatial Search
      const district = await District.findOne({
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: [lng, lat] },
            $maxDistance: 500000 
          }
        }
      });
      
      if (district) {
        console.log(`📍 Geospatial Match: ${district.name}`);
        return district.risk_multiplier;
      }  else {
        return 1;   // default risk
      // console.log("⚠️ No district found nearby. Using default multiplier.");
      // return 1.0; // Default safety multiplier
  }

  } catch (err) {
    console.error("🚨 ATLAS ERROR:", err.message);
    return 1.0;
  }
}

async function getCrimeData(lat, lng) {
  try {
    // Search local MongoDB for crimes within 5km of the route start
    const localCrimes = await Crime.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: 5000 // 5 kilometers
        }
      }
    });

    // Transform MongoDB results to match the format our ML loop expects
    return localCrimes.map(c => ({
      lat: c.location.coordinates[1],
      lon: c.location.coordinates[0],
      severity: c.severity
    }));
  } catch (err) {
    console.error("Local Crime DB Error:", err);
    return [];
  }
}
async function getUserReportPenalty(lat, lng) {
  // Find reports within 300 meters of this specific point on the route
  const nearbyReports = await Report.find({
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: 300 
      }
    }
  });

  if (nearbyReports.length === 0) return 0;

  // Calculate weighted penalty: higher severity + more recent = bigger penalty
  let penaltyTotal = 0;
  nearbyReports.forEach(r => {
    const hoursOld = (new Date() - r.createdAt) / (1000 * 60 * 60);
    const timeDecay = Math.exp(-0.02 * hoursOld); // Penalty drops slowly over 48 hours
    penaltyTotal += (r.severity * 0.1 * timeDecay);
  });

  return Math.min(penaltyTotal, 0.5); // Cap the user penalty at 0.5
}
async function getLightingScore(lat, lng) {
  const osmQuery = `
    [out:json][timeout:10];
    (
      way(around:30, ${lat}, ${lng})["lit"];
      node(around:20, ${lat}, ${lng})["amenity"~"atm|hospital|pharmacy|police"];
    );
    out tags;`;

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(osmQuery)}`;

  try {
    const response = await axios.get(url, { timeout: 5000 });
    const elements = response.data.elements;
    if (elements.length === 0)
       return 0.4; 

    const isBright = elements.some(el => 
        el.tags.lit === 'yes' || el.tags.amenity
    );
    return isBright ? 1.0 : 0.2;
  } catch (error) {
    console.log('1');
    return 0.5;
  }
}
async function getSafetyFeatures(lat, lng) {

  const query = `
  [out:json][timeout:10];
  (
    way(around:40,${lat},${lng})["lit"];
    node(around:40,${lat},${lng})["amenity"~"atm|hospital|pharmacy|police"];

    node(around:300,${lat},${lng})["amenity"~"bar|nightclub|pub"];

    node(around:200,${lat},${lng})["surveillance"="camera"];

    way(around:200,${lat},${lng})["building"];

    node(around:2000,${lat},${lng})["amenity"="police"];
  );
  out tags;
  `;

  const url =
    `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  try {

    const res = await axios.get(url, { timeout: 8000 });

    const elements = res.data.elements || [];

    let lighting = 0.4;
    let nightlife = 0;
    let cctv = 0;
    let buildings = 0;
    let police = 0;

    elements.forEach(el => {

      if (el.tags?.lit === "yes") lighting = 1;

      if (
        el.tags?.amenity === "bar" ||
        el.tags?.amenity === "nightclub" ||
        el.tags?.amenity === "pub"
      ) nightlife++;

      if (el.tags?.surveillance === "camera") cctv++;

      if (el.tags?.building) buildings++;

      if (el.tags?.amenity === "police") police++;

    });

    // -------- Time Risk Calculation --------
    const hour = Math.floor(Math.random() * 24);

    let timeRisk = 1;

    if (hour >= 0 && hour <= 5) timeRisk = 1.6;      // late night
    else if (hour >= 6 && hour <= 10) timeRisk = 1.0; // morning
    else if (hour >= 11 && hour <= 17) timeRisk = 0.9; // afternoon
    else if (hour >= 18 && hour <= 21) timeRisk = 1.2; // evening
    else if (hour >= 22 && hour <= 23) timeRisk = 1.4; // night

    const districtRisk =
      await getDistrictRiskMultiplier(lat, lng).catch(() => 1);

    const userPenalty =
      await getUserReportPenalty(lat, lng).catch(() => 0);

    return {
      lighting,
      nightlife,
      buildingDensity: buildings,
      cctv,
      policeDistance: police > 0 ? 500 : 5000,
      districtRisk,
      userPenalty : userPenalty || 0,
      timeRisk
    };

  } catch (err) {

    return {
      lighting: 0.5,
      nightlife: 0,
      buildingDensity: 0,
      cctv: 0,
      policeDistance: 5000,
      timeRisk: 1
    };

  }
}
function getTimeRiskMultiplier() {

  const hour = new Date().getHours();

  if (hour >= 0 && hour <= 4) return 1.5;
  if (hour >= 20) return 1.2;

  return 1.0;
}

// async function getCrimeData(lat, lng) {
//   const options = {
//     method: 'GET',
//     url: 'https://crimeometer.p.rapidapi.com/raw-data/',
//     params: { lat: lat.toString(), lon: lng.toString(), distance: '10' },
//     headers: {
//       'x-rapidapi-key': '22d569cb18msh0878c2df62f5e95p1676fdjsn618d4907e846',
//       'x-rapidapi-host': 'crimeometer.p.rapidapi.com'
//     },
//     proxy: false
//   };
//   try {
//     const res = await axios.request(options);
//     return res.data.incidents || [];
//   } catch (err) {
//     console.error("Crime API Error:", err.message);
//     return [];
//   }
// }

async function calculateMLSafety(path) {

  const maxSamples = path.length > 1000 ? 5 : 8;

  const step = Math.max(1, Math.floor(path.length / maxSamples));

  const samples = path.filter((_, i) => i % step === 0).slice(0, maxSamples);

  if (samples.length === 0) {
    return { safetyScore: 50, hotspots: [] };
  }

  const [areaCrimes, districtMultiplierRaw] = await Promise.all([
    getCrimeData(path[0].lat, path[0].lng),
    getDistrictRiskMultiplier(path[0].lat, path[0].lng)
  ]);

  const districtMultiplier = parseFloat(districtMultiplierRaw) || 1.0;

  const sampleScores = [];

  for (const point of samples) {

    const [features, userPenalty] = await Promise.all([
      getSafetyFeatures(point.lat, point.lng),
      getUserReportPenalty(point.lat, point.lng)
    ]);

    const {
      lighting,
      nightlife,
      buildingDensity,
      cctv,
      policeDistance
    } = features;
    const isDarkSpot = lighting <= 0.5 && districtMultiplier >= 1.1;
    const crimeDensity = await getCrimeDensity(point.lat, point.lng, 600);

    sampleScores.push({
      lighting,
      nightlife,
      buildingDensity,
      cctv,
      userPenalty,
      policeDistance,
      point,
      crimeDensity,
      isDarkSpot
    });

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  let totalRawScore = 0;
  const hotspots = [];

  sampleScores.forEach(({ lighting, nightlife, buildingDensity, cctv, userPenalty, point, crimeDensity, isDarkSpot }) => {

    const timeRisk = getTimeRiskMultiplier();

    const buildingScore = Math.min(buildingDensity / 20, 1);
    const nightlifeScore = Math.min(nightlife / 10, 1);
    const cctvScore = Math.min(cctv / 5, 1);
    const crimeScore = Math.min(crimeDensity / 5, 1);

    const baseScore =
        0.40 * lighting +
        0.20 * buildingScore +
        0.15 * cctvScore;

    const penalties =
        0.20 * crimeScore +
        0.10 * nightlifeScore +
        0.10 * userPenalty +
        0.05 * timeRisk;

    const sampleScore = baseScore - penalties;

    totalRawScore += sampleScore;

    if (isDarkSpot || crimeDensity >= 4) {
      hotspots.push({
        lat: point.lat,
        lng: point.lng,
        severity: crimeDensity,
        type: "Crime Hotspot"
      });
    }

  });

  const averageRawScore = totalRawScore / sampleScores.length;

  let percentage = (50 + (averageRawScore * 80));

  let finalScore = Math.round(percentage);
  console.log(averageRawScore);

  finalScore = Math.max(10, Math.min(95, finalScore));

  // if (finalScore > 100) finalScore = 100;
  // if (finalScore < 5) finalScore = 5;

  console.log(`📊 Route Safety: ${finalScore}% [Multiplier: ${districtMultiplier}]`);

  return {
    safetyScore: finalScore,
    hotspots
  };
}
// --- 4. ROUTING LOGIC (ORS) ---
async function getORSRoutes(start, end) {

  const ORS_KEY = process.env.ORS_KEY;

  const startLng = parseFloat(start.lng);
  const startLat = parseFloat(start.lat);
  const endLng = parseFloat(end.lng);
  const endLat = parseFloat(end.lat);

  console.log(`📡 ORS Request: From [${startLng}, ${startLat}] to [${endLng}, ${endLat}]`);

  const coords = [
    [startLng, startLat],
    [endLng, endLat]
  ];

  const headers = {
    Authorization: ORS_KEY,
    "Content-Type": "application/json"
  };

  try {

    const requests = [

      // 1️⃣ Fastest route
      axios.post(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        {
          coordinates: coords,
          preference: "fastest"
        },
        { headers }
      ),

      // 2️⃣ Shortest route
      axios.post(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        {
          coordinates: coords,
          preference: "shortest"
        },
        { headers }
      ),

      // 3️⃣ Avoid highways route
      axios.post(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        {
          coordinates: coords,
          options: {
            avoid_features: ["highways"]
          }
        },
        { headers }
      )

    ];

    const responses = await Promise.all(requests);

    const routes = responses
      .map(r => r.data?.features?.[0])
      .filter(Boolean);

    console.log(`📍 ORS returned routes: ${routes.length}`);

    return routes;

  } catch (err) {

    console.error("🚨 ORS Error:", err.response?.data || err.message);

    return [];

  }
}

router.post("/", async (req, res) => {

  try {

    const { start, end } = req.body;

    console.log("🚀 Calculating routes...");

    const routes = await getORSRoutes(start, end);

    console.log("📍 ORS returned routes:", routes.length);

    const results = await Promise.all(

      routes.map(async (route, index) => {

        console.log(`🔎 Scoring route ${index + 1}`);

        const path = route.geometry.coordinates.map(c => ({
          lat: c[1],
          lng: c[0]
        }));

        const safety = await calculateMLSafety(path);

        return {
          route,
          safetyScore: safety.safetyScore,
          hotspots: safety.hotspots,
          distance: route.properties.summary.distance
        };

      })

    );

    results.sort((a, b) => b.safetyScore - a.safetyScore);

    const safestRoute = results[0];

    const fastestRoute = results.reduce((prev, curr) =>
      curr.distance < prev.distance ? curr : prev
    );

    res.json({
      safestRoute,
      fastestRoute,
      allRoutes: results
    });

  } catch (err) {

    console.error("🚨 Router Error:", err.response?.data || err.message);

    res.status(500).json({
      error: "Route calculation failed"
    });

  }

});
module.exports = {
  router,
  calculateMLSafety,
  getCrimeData,
  getSafetyFeatures
};