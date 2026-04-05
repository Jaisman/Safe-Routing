const axios = require("axios");
const fs = require("fs");

async function geocode(city) {

  const url =
  `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)},India&format=json&limit=1`;

  const res = await axios.get(url, {
    headers: { "User-Agent": "safe-routing-project" }
  });

  if (!res.data.length) return null;

  return {
    lat: parseFloat(res.data[0].lat),
    lng: parseFloat(res.data[0].lon)
  };
}

async function main() {

  const csv = fs.readFileSync("scrape/ride_safety_dataset.csv", "utf8").split("\n");

  const cities = new Set();

  for (let i = 1; i < csv.length; i++) {

    const row = csv[i].split(",");
    const city = row[4];

    if (city) cities.add(city.trim());

  }

  const result = {};

  for (const city of cities) {

    console.log("Geocoding:", city);

    const coord = await geocode(city);

    result[city] = coord;

    await new Promise(r => setTimeout(r, 1000));

  }

  fs.writeFileSync("city_coordinates.json", JSON.stringify(result, null, 2));

  console.log("Saved coordinates");

}

main();