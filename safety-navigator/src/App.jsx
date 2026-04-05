import { useState } from "react";
import MapView from "./Components/MapView";
import SearchBox from "./Components/SearchBox";
function App() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 bg-black text-white text-xl font-bold">
        Fear-Free Navigator
      </div>

        <div className>
          <MapView start={start} end={end} />
        </div>
    </div>
  );
}

export default App;