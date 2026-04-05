const mongoose = require('mongoose');
const axios = require('axios');
const District = require('./../models/district');
const NodeGeocoder = require('node-geocoder');

const geocoder = NodeGeocoder({ provider: 'openstreetmap' });

const csvUrl = "https://raw.githubusercontent.com/imdevskp/covid-19-india-data/master/district_level_latest.csv"; // Or your specific source

mongoose.connect("mongodb+srv://safeRouting:safeRouting@cluster0.mwcninw.mongodb.net/safety_navigator");

async function seedDistricts() {
    try {
        // 1. Clear existing bad records
        await District.deleteMany({});
        console.log("🗑️ Database cleared.");

        const response = await axios.get(csvUrl);
        const rows = response.data.split('\n').slice(1); // Skip header

        for (let row of rows) {
            const cols = row.split(',');
            if (cols.length < 5) continue;

            const stateName = cols[2];   // e.g., Andhra Pradesh
            const districtName = cols[4]; // e.g., Anantapur
            
            // Skip "Other State" or "Foreign Evacuees" entries
            if (districtName.includes("Other") || districtName.includes("Foreign")) continue;

            console.log(`🌍 Geocoding: ${districtName}, ${stateName}...`);

            try {
                // Find coordinates for the specific district
                const geo = await geocoder.geocode(`${districtName}, ${stateName}, India`);
                
                if (geo.length > 0) {
                    const lat = geo[0].latitude;
                    const lon = geo[0].longitude;

                    // Calculate a fake risk multiplier based on the 'Confirmed' column (index 5)
                    // Or keep it static if you prefer
                    const confirmedCases = parseInt(cols[5]) || 0;
                    const riskMultiplier = 1.0 + (confirmedCases / 100000); 

                    await District.create({
                        name: districtName,
                        state: cols[1], // Short code like AP
                        crime_rate: confirmedCases, // Using data as proxy
                        risk_multiplier: Math.min(riskMultiplier, 2.0).toFixed(2),
                        location: {
                            type: "Point",
                            coordinates: [lon, lat] // [lng, lat] for MongoDB
                        }
                    });
                    console.log(`✅ Saved ${districtName}`);
                }
                
                // Throttle to respect OpenStreetMap's usage policy
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (geoError) {
                console.error(`❌ Could not geocode ${districtName}:`, geoError.message);
            }
        }
        console.log("✨ All-India District Seeding Complete!");
        process.exit();

    } catch (error) {
        console.error("🚨 Seeding failed:", error);
        process.exit(1);
    }
}

seedDistricts();