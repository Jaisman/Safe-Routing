import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
  Circle,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { HeatmapLayer } from "react-leaflet-heatmap-layer-v3";

// --- 1. Marker Fix ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// --- 2. Helper Components ---
function FitBounds({ routes }) {
  const map = useMap();
  useEffect(() => {
    const validRoutes = routes.filter((r) => r && r.length > 1);
    const allPoints = validRoutes.flat();
    if (allPoints.length > 1) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routes, map]);
  return null;
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e) });
  return null;
}

// --- 3. Geocode helper (Nominatim) ---
async function geocodeQuery(query) {
  const res = await axios.get("https://nominatim.openstreetmap.org/search", {
    params: { q: query, format: "json", limit: 5 },
  });
  return res.data;
}

// --- 4. Styles ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap');

  .sr-sidebar {
    position: absolute; top: 0; left: 0;
    height: 100vh; width: 300px;
    z-index: 1000;
    display: flex; flex-direction: column;
    background: rgba(13,17,30,0.93);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border-right: 1px solid rgba(255,255,255,0.08);
    font-family: 'DM Sans', sans-serif;
    overflow-y: auto; overflow-x: hidden; scrollbar-width: none;
    overflow: visible !important;
  }
  .sr-sidebar::-webkit-scrollbar { display: none; }

  .sr-header { padding: 18px 18px 14px; border-bottom: 1px solid rgba(255,255,255,0.07); flex-shrink: 0; }
  .sr-brand { display: flex; align-items: center; gap: 10px; }
  .sr-brand-icon {
    width: 34px; height: 34px; border-radius: 10px;
    background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
    box-shadow: 0 4px 14px rgba(99,102,241,0.38);
  }
  .sr-brand-name {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 15px; font-weight: 700; color: #eef0f8;
    letter-spacing: -0.02em; line-height: 1.1;
  }
  .sr-brand-sub { font-size: 10px; color: rgba(255,255,255,0.3); letter-spacing: 0.08em; text-transform: uppercase; margin-top: 2px; }

  .sr-divider { height: 1px; background: rgba(255,255,255,0.07); flex-shrink: 0; }

  .sr-section { padding: 14px 18px; flex-shrink: 0; }
  .sr-section + .sr-section { border-top: 1px solid rgba(255,255,255,0.06); }
  .sr-section-label { font-size: 9.5px; font-weight: 600; letter-spacing: 0.13em; text-transform: uppercase; color: rgba(255,255,255,0.27); margin-bottom: 11px; }

  /* Location inputs */
  .sr-location-wrap { display: flex; flex-direction: column; gap: 0; }
  .sr-input-row {
    display: flex; align-items: center; gap: 9px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 11px; padding: 9px 12px;
    transition: border-color 0.18s, background 0.18s;
    position: relative;
  }
  .sr-input-row:focus-within { border-color: rgba(99,102,241,0.5); background: rgba(99,102,241,0.07); }
  .sr-input-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
  .sr-input-dot.start { background: #22c55e; box-shadow: 0 0 8px rgba(34,197,94,0.6); }
  .sr-input-dot.end   { background: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.6); }
  .sr-input {
    flex: 1; background: none; border: none; outline: none;
    font-size: 12.5px; color: #d8dff0; font-family: 'DM Sans', sans-serif; caret-color: #6366f1;
  }
  .sr-input::placeholder { color: rgba(255,255,255,0.25); }
  .sr-connector { width: 1px; height: 12px; background: rgba(255,255,255,0.12); margin: 3px 0 3px 13px; }

  .sr-suggestions {
    position: absolute; top: calc(100% + 5px); left: 0; right: 0;
    background: rgba(16,21,38,0.98); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px; overflow: hidden; z-index: 20;
    box-shadow: 0 16px 40px rgba(0,0,0,0.55);
  }
  .sr-suggestion {
    padding: 9px 13px; font-size: 11.5px; color: #b0b8d0; cursor: pointer;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    transition: background 0.12s; display: flex; align-items: flex-start; gap: 8px;
  }
  .sr-suggestion:last-child { border-bottom: none; }
  .sr-suggestion:hover { background: rgba(99,102,241,0.12); color: #c7d2fe; }
  .sr-suggestion-text { line-height: 1.35; }

  .sr-go-btn {
    width: 100%; padding: 10px; border-radius: 11px;
    background: linear-gradient(135deg, #3b82f6, #6366f1);
    border: none; color: white; font-size: 13px; font-weight: 600;
    font-family: 'Space Grotesk', sans-serif; cursor: pointer;
    transition: opacity 0.18s, transform 0.15s;
    box-shadow: 0 4px 16px rgba(99,102,241,0.35); margin-top: 10px;
  }
  .sr-go-btn:hover { opacity: 0.88; transform: translateY(-1px); }
  .sr-go-btn:active { transform: translateY(0); }
  .sr-go-btn:disabled { opacity: 0.38; cursor: not-allowed; transform: none; }

  /* Route cards */
  .sr-route-card { border-radius: 13px; padding: 13px 14px; margin-bottom: 9px; transition: transform 0.15s; }
  .sr-route-card:hover { transform: translateY(-1px); }
  .sr-route-card.safe { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); }
  .sr-route-card.fast { background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.18); }

  .sr-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 9px; }
  .sr-label-wrap { display: flex; align-items: center; gap: 8px; }
  .sr-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .safe .sr-dot { background: #22c55e; box-shadow: 0 0 7px rgba(34,197,94,0.55); }
  .fast .sr-dot { background: #ef4444; box-shadow: 0 0 7px rgba(239,68,68,0.55); }
  .sr-route-label { font-family: 'Space Grotesk', sans-serif; font-size: 12.5px; font-weight: 600; }
  .safe .sr-route-label { color: #86efac; }
  .fast .sr-route-label { color: #fca5a5; }
  .sr-score-badge { font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
  .safe .sr-score-badge { background: rgba(34,197,94,0.15); color: #4ade80; }
  .fast .sr-score-badge { background: rgba(239,68,68,0.15); color: #f87171; }

  .sr-track { width: 100%; height: 4px; border-radius: 99px; background: rgba(255,255,255,0.08); margin-bottom: 11px; overflow: hidden; }
  .sr-fill { height: 100%; border-radius: 99px; width: 0%; transition: width 1s cubic-bezier(0.34,1.4,0.64,1); }
  .safe .sr-fill { background: linear-gradient(90deg,#16a34a,#22c55e); }
  .fast .sr-fill { background: linear-gradient(90deg,#b91c1c,#ef4444); }

  .sr-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
  .sr-stat { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 9px; padding: 7px 10px; text-align: center; }
  .sr-stat-label { font-size: 8.5px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.28); margin-bottom: 3px; }
  .sr-stat-value { font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 600; color: #dde2f0; }

  .sr-legend { display: flex; gap: 14px; padding-top: 6px; }
  .sr-legend-item { display: flex; align-items: center; gap: 6px; font-size: 10.5px; color: rgba(255,255,255,0.32); }
  .sr-legend-line { width: 18px; height: 3px; border-radius: 2px; }
  .sr-legend-line.safe { background: #22c55e; }
  .sr-legend-line.fast { background: repeating-linear-gradient(90deg,#ef4444 0,#ef4444 4px,transparent 4px,transparent 8px); }

  /* Toggle */
  .sr-toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; cursor: pointer; transition: background 0.15s; border-top: 1px solid rgba(255,255,255,0.06); }
  .sr-toggle-row:hover { background: rgba(255,255,255,0.025); }
  .sr-toggle-left { display: flex; align-items: center; gap: 10px; }
  .sr-toggle-icon { width: 30px; height: 30px; border-radius: 9px; background: rgba(239,68,68,0.12); display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
  .sr-toggle-title { font-size: 12.5px; font-weight: 500; color: #cdd2e4; }
  .sr-toggle-sub { font-size: 10.5px; color: rgba(255,255,255,0.28); margin-top: 1px; }
  .sr-pill { width: 36px; height: 20px; border-radius: 99px; background: rgba(255,255,255,0.1); position: relative; transition: background 0.2s; flex-shrink: 0; }
  .sr-pill.on { background: #22c55e; }
  .sr-knob { width: 14px; height: 14px; border-radius: 50%; background: white; position: absolute; top: 3px; left: 3px; transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1); box-shadow: 0 1px 4px rgba(0,0,0,0.25); }
  .sr-pill.on .sr-knob { transform: translateX(16px); }

  /* Hotspots */
  .sr-hotspots { padding: 2px 18px 8px; }
  .sr-hotspot-item { display: flex; align-items: center; gap: 9px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .sr-hotspot-item:last-child { border-bottom: none; }
  .sr-hotspot-sev { width: 26px; height: 26px; border-radius: 7px; background: rgba(239,68,68,0.12); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #f87171; font-family: 'Space Grotesk', sans-serif; flex-shrink: 0; }
  .sr-hotspot-name { font-size: 12px; color: #aab2c8; font-weight: 500; }
  .sr-hotspot-type { font-size: 10px; color: rgba(255,255,255,0.25); margin-top: 1px; }

  /* Report btn */
  .sr-report-btn { margin: 4px 18px 12px; padding: 10px; border-radius: 11px; background: rgba(99,102,241,0.09); border: 1px solid rgba(99,102,241,0.22); color: #a5b4fc; font-size: 12.5px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; transition: all 0.18s; width: calc(100% - 36px); }
  .sr-report-btn:hover { background: rgba(99,102,241,0.16); border-color: rgba(99,102,241,0.38); color: #c7d2fe; }

  /* Status */
  .sr-status { margin-top: auto; padding: 10px 18px; display: flex; align-items: center; gap: 7px; border-top: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
  .sr-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; animation: sr-pulse 2.2s infinite; flex-shrink: 0; }
  @keyframes sr-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .sr-status-text { font-size: 10.5px; color: rgba(255,255,255,0.28); letter-spacing: 0.03em; }

  /* Empty state */
  .sr-empty { padding: 14px 0 4px; display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
  .sr-empty-icon { font-size: 26px; opacity: 0.3; }
  .sr-empty-text { font-size: 11.5px; color: rgba(255,255,255,0.25); line-height: 1.5; }

  /* Loading */
  .sr-loading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(8,12,24,0.5); backdrop-filter: blur(4px); z-index: 2000; }
  .sr-loading-card { background: rgba(18,23,40,0.97); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 18px 26px; display: flex; align-items: center; gap: 12px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; color: #d8dff0; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
  .sr-spinner { width: 18px; height: 18px; border: 2px solid rgba(99,102,241,0.22); border-top-color: #6366f1; border-radius: 50%; animation: sr-spin 0.7s linear infinite; flex-shrink: 0; }
  @keyframes sr-spin { to { transform: rotate(360deg); } }

  /* Modal */
  .sr-modal-backdrop { position: absolute; inset: 0; background: rgba(5,8,20,0.62); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
  .sr-modal { background: rgba(16,21,38,0.98); border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; padding: 22px 20px; width: 300px; box-shadow: 0 24px 64px rgba(0,0,0,0.6); font-family: 'DM Sans', sans-serif; }
  .sr-modal-title { font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 700; color: #eef0f8; margin-bottom: 5px; }
  .sr-modal-sub { font-size: 12px; color: rgba(255,255,255,0.32); margin-bottom: 16px; }
  .sr-modal-option { width: 100%; padding: 11px 14px; border-radius: 11px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #c8cfdf; font-size: 13px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; display: flex; align-items: center; gap: 9px; margin-bottom: 7px; transition: all 0.15s; text-align: left; }
  .sr-modal-option:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.25); color: #fca5a5; }
  .sr-modal-cancel { width: 100%; padding: 9px; background: none; border: none; color: rgba(255,255,255,0.28); font-size: 12.5px; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: color 0.15s; }
  .sr-modal-cancel:hover { color: rgba(255,255,255,0.52); }
  .sr-resize-handle {
    position: absolute;
    top: 0;
    right: -5px;
    width: 10px;
    height: 100%;
    cursor: col-resize;
    z-index: 20;
    background: transparent;
  }

  .sr-resize-handle:hover {
    background: rgba(99, 102, 241, 0.15);
  }
`;

const REPORT_TYPES = [
  { type: "Dark Street", icon: "🌑" },
  { type: "Crowded",     icon: "👥" },
  { type: "Theft Area",  icon: "🚨" },
];

// --- 5. Main Component ---
export default function MapView() {
  const [startQuery,       setStartQuery]       = useState("");
  const [endQuery,         setEndQuery]         = useState("");
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions,   setEndSuggestions]   = useState([]);
  const [start,            setStart]            = useState(null);
  const [end,              setEnd]              = useState(null);

  const [safeRoute,        setSafeRoute]        = useState([]);
  const [fastRoute,        setFastRoute]        = useState([]);
  const [safeData,         setSafeData]         = useState(null);
  const [fastData,         setFastData]         = useState(null);
  const [crimeData,        setCrimeData]        = useState([]);
  const [loading,          setLoading]          = useState(false);
  const [showHotspots,     setShowHotspots]     = useState(true);
  const [showReportModal,  setShowReportModal]  = useState(false);
  const [tempCoords,       setTempCoords]       = useState(null);
  const [barsReady,        setBarsReady]        = useState(false);
  const sidebarRef = useRef(null);
  const [sidebarWidth, setSidebarWidth] = useState(300);

  const startDebounce = useRef(null);
  const endDebounce   = useRef(null);

  useEffect(() => {
    const handle = document.getElementById('resizeHandle');
    let isDragging = false, startX = 0, startWidth = 0;

    const onMouseDown = (e) => {
      isDragging = true;
      startX = e.clientX;
      startWidth = sidebarRef.current.offsetWidth;
      document.body.style.cursor = 'col-resize';
    };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      const newWidth = Math.min(520, Math.max(220, startWidth + e.clientX - startX));
      setSidebarWidth(newWidth);
    };
    const onMouseUp = () => { isDragging = false; document.body.style.cursor = ''; };

    handle.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => { /* remove all listeners */ };
  }, []);


  const handleStartChange = (val) => {
    setStartQuery(val);
    setStart(null);
    clearTimeout(startDebounce.current);
    if (val.length < 3) { setStartSuggestions([]); return; }
    startDebounce.current = setTimeout(async () => {
      const results = await geocodeQuery(val);
      setStartSuggestions(results);
    }, 380);
  };

  const handleEndChange = (val) => {
    setEndQuery(val);
    setEnd(null);
    clearTimeout(endDebounce.current);
    if (val.length < 3) { setEndSuggestions([]); return; }
    endDebounce.current = setTimeout(async () => {
      const results = await geocodeQuery(val);
      setEndSuggestions(results);
    }, 380);
  };

  const selectStart = (item) => {
    setStart({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
    setStartQuery(item.display_name.split(",")[0]);
    setStartSuggestions([]);
  };

  const selectEnd = (item) => {
    setEnd({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
    setEndQuery(item.display_name.split(",")[0]);
    setEndSuggestions([]);
  };

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/reports/nearby", {
          params: { lat: 25.4358, lng: 81.8463, radius: 10000 },
        });
        setCrimeData(res.data);
      } catch (err) {
        console.error("Heatmap fetch error", err);
      }
    };
    fetchHeatmap();
  }, []);

  useEffect(() => {
    if (safeData || fastData) {
      const t = setTimeout(() => setBarsReady(true), 120);
      return () => clearTimeout(t);
    }
  }, [safeData, fastData]);

  const fetchRoute = async () => {
    if (!start || !end) return;
    try {
      setLoading(true);
      setBarsReady(false);
      setSafeData(null);
      setFastData(null);
      const res = await axios.post("http://127.0.0.1:5000/route", {
        start: { lat: start.lat, lng: start.lng },
        end:   { lat: end.lat,   lng: end.lng   },
      });
      const safest  = res.data.safestRoute;
      const fastest = res.data.fastestRoute;
      setSafeRoute(safest.route.geometry.coordinates.map((c) => [c[1], c[0]]));
      setFastRoute(fastest.route.geometry.coordinates.map((c) => [c[1], c[0]]));
      setSafeData(safest);
      setFastData(fastest);
    } catch (err) {
      console.error("Route fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReportSubmit = async (type) => {
    try {
      await axios.post("http://localhost:5000/api/reports/add", {
        type, severity: 5,
        lat: tempCoords.lat, lng: tempCoords.lng,
      });
      alert("Safety report logged!");
      setShowReportModal(false);
    } catch {
      alert("Submission failed");
    }
  };

  const startPoint = safeRoute[0] || fastRoute[0];
  const endPoint   = safeRoute[safeRoute.length - 1] || fastRoute[fastRoute.length - 1];
  const safeScore  = Math.round(safeData?.safetyScore || 0);
  const fastScore  = Math.round(fastData?.safetyScore || 0);
  const hasRoutes  = safeData || fastData;

  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      <style>{styles}</style>

      {loading && (
        <div className="sr-loading">
          <div className="sr-loading-card">
            <div className="sr-spinner" />
            Calculating safest route…
          </div>
        </div>
      )}

      <MapContainer
        center={[25.4358, 81.8463]}
        zoom={13}
        style={{ height: "100vh", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapClickHandler onMapClick={(e) => { setTempCoords(e.latlng); setShowReportModal(true); }} />

        {safeRoute.length > 1 && (
          <Polyline positions={safeRoute} pathOptions={{ color: "#22c55e", weight: 6, lineCap: "round" }} />
        )}
        {fastRoute.length > 1 && (
          <Polyline positions={fastRoute} pathOptions={{ color: "#ef4444", weight: 4, dashArray: "6, 11", lineCap: "round" }} />
        )}

        {startPoint && <Marker position={startPoint}><Popup>Start</Popup></Marker>}
        {endPoint   && <Marker position={endPoint}><Popup>End</Popup></Marker>}

        <FitBounds routes={[safeRoute, fastRoute]} />

        {crimeData.length > 0 && (
          <HeatmapLayer
            points={crimeData}
            longitudeExtractor={(m) => m.location.coordinates[0]}
            latitudeExtractor={(m) => m.location.coordinates[1]}
            intensityExtractor={(m) => m.severity}
            radius={25} blur={15} minOpacity={0.5}
            gradient={{ 0.4: "blue", 0.65: "lime", 1: "red" }}
          />
        )}

        {showHotspots && safeData?.hotspots?.map((spot, i) => (
          <Circle
          key={`hs-${i}`}
          center={[spot.lat, spot.lng]}
          radius={2000}
            pathOptions={{ color: "red", fillColor: "#ff0033", fillOpacity: 0.35, weight: 2 }}
            >
            <Tooltip sticky>
              <div style={{ textAlign: "center", fontFamily: "sans-serif" }}>
                <strong style={{ color: "#dc2626" }}>⚠️ {spot.type}</strong><br />
                <span style={{ fontSize: 12 }}>Severity: {spot.severity}/10</span>
              </div>
            </Tooltip>
          </Circle>
        ))}
      </MapContainer>

      {/* ════ SINGLE UNIFIED SIDEBAR ════ */}
      <aside ref={sidebarRef} className="sr-sidebar" style={{ width: sidebarWidth }}>
        <div id="resizeHandle" className="sr-resize-handle"></div>
        {/* Brand */}
        <div className="sr-header">
          <div className="sr-brand">
            <div className="sr-brand-icon">🛡️</div>
            <div>
              <div className="sr-brand-name">SafeRoute</div>
              <div className="sr-brand-sub">Live Safety Intelligence</div>
            </div>
          </div>
        </div>

        {/* ── Plan Your Route ── */}
        <div className="sr-section">
          <div className="sr-section-label">Plan Your Route</div>
          <div className="sr-location-wrap">

            {/* Start input */}
            <div style={{ position: "relative" }}>
              <div className="sr-input-row">
                <div className="sr-input-dot start" />
                <input
                  className="sr-input"
                  placeholder="Starting point…"
                  value={startQuery}
                  onChange={(e) => handleStartChange(e.target.value)}
                />
                {start && <span style={{ fontSize: 13, color: "#4ade80" }}>✓</span>}
              </div>
              {startSuggestions.length > 0 && (
                <div className="sr-suggestions">
                  {startSuggestions.map((s, i) => (
                    <div key={i} className="sr-suggestion" onClick={() => selectStart(s)}>
                      <span style={{ fontSize: 13, flexShrink: 0 }}>📍</span>
                      <span className="sr-suggestion-text">{s.display_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="sr-connector" />

            {/* End input */}
            <div style={{ position: "relative" }}>
              <div className="sr-input-row">
                <div className="sr-input-dot end" />
                <input
                  className="sr-input"
                  placeholder="Destination…"
                  value={endQuery}
                  onChange={(e) => handleEndChange(e.target.value)}
                />
                {end && <span style={{ fontSize: 13, color: "#4ade80" }}>✓</span>}
              </div>
              {endSuggestions.length > 0 && (
                <div className="sr-suggestions">
                  {endSuggestions.map((s, i) => (
                    <div key={i} className="sr-suggestion" onClick={() => selectEnd(s)}>
                      <span style={{ fontSize: 13, flexShrink: 0 }}>🏁</span>
                      <span className="sr-suggestion-text">{s.display_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              className="sr-go-btn"
              onClick={fetchRoute}
              disabled={!start || !end || loading}
              >
              {loading ? "Calculating…" : "Find Safest Route →"}
            </button>
          </div>
        </div>

        {/* ── Route Comparison ── */}
        <div className="sr-section">
          <div className="sr-section-label">Route Comparison</div>

          {!hasRoutes ? (
            <div className="sr-empty">
              <div className="sr-empty-icon">🗺️</div>
              <div className="sr-empty-text">Enter a start & destination above to compare routes</div>
            </div>
          ) : (
            <>
              <div className="sr-route-card safe">
                <div className="sr-card-header">
                  <div className="sr-label-wrap">
                    <div className="sr-dot" />
                    <div className="sr-route-label">Safest Route</div>
                  </div>
                  <div className="sr-score-badge">{safeScore}%</div>
                </div>
                <div className="sr-track">
                  <div className="sr-fill" style={{ width: barsReady ? `${safeScore}%` : "0%" }} />
                </div>
                <div className="sr-stats">
                  <div className="sr-stat">
                    <div className="sr-stat-label">Distance</div>
                    <div className="sr-stat-value">{(safeData?.distance / 1000 || 0).toFixed(1)} km</div>
                  </div>
                  <div className="sr-stat">
                    <div className="sr-stat-label">Reports</div>
                    <div className="sr-stat-value">{safeData?.userReportsCount || 0}</div>
                  </div>
                </div>
              </div>

              <div className="sr-route-card fast">
                <div className="sr-card-header">
                  <div className="sr-label-wrap">
                    <div className="sr-dot" />
                    <div className="sr-route-label">Fastest Route</div>
                  </div>
                  <div className="sr-score-badge">{fastScore}%</div>
                </div>
                <div className="sr-track">
                  <div className="sr-fill" style={{ width: barsReady ? `${fastScore}%` : "0%" }} />
                </div>
                <div className="sr-stats">
                  <div className="sr-stat">
                    <div className="sr-stat-label">Distance</div>
                    <div className="sr-stat-value">{(fastData?.distance / 1000 || 0).toFixed(1)} km</div>
                  </div>
                  <div className="sr-stat">
                    <div className="sr-stat-label">Reports</div>
                    <div className="sr-stat-value">{fastData?.userReportsCount || 0}</div>
                  </div>
                </div>
              </div>

              <div className="sr-legend">
                <div className="sr-legend-item">
                  <div className="sr-legend-line safe" /><span>Safe path</span>
                </div>
                <div className="sr-legend-item">
                  <div className="sr-legend-line fast" /><span>Fast path</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Hotspot Toggle ── */}
        <div
          className="sr-toggle-row"
          onClick={() => setShowHotspots((v) => !v)}
          role="button"
          aria-pressed={showHotspots}
          >
          <div className="sr-toggle-left">
            <div className="sr-toggle-icon">🚨</div>
            <div>
              <div className="sr-toggle-title">Police Dark Spots</div>
              <div className="sr-toggle-sub">Low-patrol danger zones</div>
            </div>
          </div>
          <div className={`sr-pill ${showHotspots ? "on" : ""}`}>
            <div className="sr-knob" />
          </div>
        </div>

        {showHotspots && safeData?.hotspots?.length > 0 && (
          <div className="sr-hotspots">
            {safeData.hotspots.slice(0, 4).map((spot, i) => (
              <div className="sr-hotspot-item" key={i}>
                <div className="sr-hotspot-sev">{spot.severity}</div>
                <div>
                  <div className="sr-hotspot-name">{spot.type}</div>
                  <div className="sr-hotspot-type">Danger zone</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Report button */}
        <button className="sr-report-btn" onClick={() => setShowReportModal(true)}>
          ⚠ Report Danger Here
        </button>

        {/* Status */}
        <div className="sr-status">
          <div className="sr-status-dot" />
          <div className="sr-status-text">Live data · Updated just now</div>
        </div>
      </aside>

      {/* ── Report Modal ── */}
      {showReportModal && (
        <div className="sr-modal-backdrop">
          <div className="sr-modal">
            <div className="sr-modal-title">Report Danger</div>
            <div className="sr-modal-sub">Flag this location for other users</div>
            {REPORT_TYPES.map(({ type, icon }) => (
              <button key={type} className="sr-modal-option" onClick={() => handleReportSubmit(type)}>
                <span style={{ fontSize: 16 }}>{icon}</span>{type}
              </button>
            ))}
            <button className="sr-modal-cancel" onClick={() => setShowReportModal(false)}>Cancel</button>
          </div>
        </div>
        
      )}
      </div>
  );
}