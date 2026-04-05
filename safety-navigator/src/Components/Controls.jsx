import { useState } from "react";

export default function Controls({ setStart, setEnd }) {
  const [s, setS] = useState("A");
  const [e, setE] = useState("C");

  const handleSearch = () => {
    if (s === e) {
      alert("Start and destination cannot be same");
      return;
    }
    setStart(s);
    setEnd(e);
  };

  return (
    <div className="space-y-5">
      
      <h2 className="text-xl font-semibold">Plan Route</h2>

      {/* Start */}
      <div>
        <label className="block mb-1 font-medium">Start</label>
        <select
          className="w-full p-2 border rounded"
          value={s}
          onChange={(e) => setS(e.target.value)}
        >
          <option value="A">Location A</option>
          <option value="B">Location B</option>
          <option value="C">Location C</option>
          <option value="D">Location D</option>
        </select>
      </div>

      {/* End */}
      <div>
        <label className="block mb-1 font-medium">Destination</label>
        <select
          className="w-full p-2 border rounded"
          value={e}
          onChange={(e) => setE(e.target.value)}
        >
          <option value="A">Location A</option>
          <option value="B">Location B</option>
          <option value="C">Location C</option>
          <option value="D">Location D</option>
        </select>
      </div>

      {/* Button */}
      <button
        onClick={handleSearch}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
      >
        Find Safe Route
      </button>
    </div>
  );
}