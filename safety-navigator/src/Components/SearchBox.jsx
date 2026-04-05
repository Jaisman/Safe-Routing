import { useState } from "react";
import { OpenStreetMapProvider } from "leaflet-geosearch";

const provider = new OpenStreetMapProvider();

export default function SearchBox({ setStart, setEnd }) {
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");

  const handleSearch = async () => {
    try {
      const startRes = await provider.search({ query: startInput });
      const endRes = await provider.search({ query: endInput });

      if (!startRes.length || !endRes.length) {
        alert("Start or end location not found. Please refine your search.");
        return;
      }

      setStart({
        lat: parseFloat(startRes[0].y),
        lng: parseFloat(startRes[0].x),
      });

      setEnd({
        lat: parseFloat(endRes[0].y),
        lng: parseFloat(endRes[0].x),
      });
    } catch (err) {
      console.error("Geosearch error:", err);
      alert("Error searching locations. Try again.");
    }
  };

  return (
    <div className="bg-white p-4 rounded">
      <input
        placeholder="Start location"
        value={startInput}
        onChange={(e) => setStartInput(e.target.value)}
        className="border p-2 mb-2 w-full"
      />
      <input
        placeholder="End location"
        value={endInput}
        onChange={(e) => setEndInput(e.target.value)}
        className="border p-2 mb-2 w-full"
      />
      <button
        onClick={handleSearch}
        className="bg-blue-500 text-white p-2 w-full"
      >
        Find Route
      </button>
    </div>
  );
}