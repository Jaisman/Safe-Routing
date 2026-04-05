require('dotenv').config();
const mongoose = require('mongoose');
const Crime = require('./models/crime');

const PRAYAGRAJ_CENTER = { lat: 25.4358, lng: 81.8463 };

async function seedCrimes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    await Crime.deleteMany({});

    const crimes = [];
    const types = ['Theft', 'Harassment', 'Chain Snatching', 'Unsafe Area'];

    for (let i = 0; i < 50; i++) {
      const latOffset = (Math.random() - 0.5) * 0.09;
      const lngOffset = (Math.random() - 0.5) * 0.09;

      crimes.push({
        type: types[Math.floor(Math.random() * types.length)],
        severity: Math.floor(Math.random() * 5) + 5, 
        location: {
          type: 'Point',
          coordinates: [
            PRAYAGRAJ_CENTER.lng + lngOffset, 
            PRAYAGRAJ_CENTER.lat + latOffset
          ]
        },
        timestamp: new Date()
      });
    }

    await Crime.insertMany(crimes);
    console.log("✅ Successfully seeded 50 crime incidents in Prayagraj!");
    process.exit();
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seedCrimes();