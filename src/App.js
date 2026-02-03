import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
}

function App() {
  const [location, setLocation] = useState(null);
  const [requests, setRequests] = useState([]);
  const [screen, setScreen] = useState("home");
  const [selectedType, setSelectedType] = useState("");

  const volunteerLoc = { lat: 26.8500, lng: 80.9500 };

  useEffect(() => {
    const q = query(collection(db, "emergency_requests"), orderBy("time", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleFetchLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          alert("📍 Location Locked!");
        },
        () => alert("⚠️ Please allow GPS access!"),
        { enableHighAccuracy: true }
      );
    }
  };

  const submitSOS = async () => {
    if (!location) return alert("Fetch location first!");
    try {
      await addDoc(collection(db, "emergency_requests"), {
        type: selectedType,
        status: "Active",
        time: serverTimestamp(),
        latitude: location.lat,
        longitude: location.lng,
      });
      setScreen("map");
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 font-sans overflow-x-hidden">
      
      {/* ---------- HOME SCREEN ---------- */}
      {screen === "home" && (
        <div className="flex flex-col items-center justify-center h-[90vh] text-center">
          <h1 className="text-5xl font-black mb-2 text-cyan-500 tracking-tighter">RESQUENET</h1>
          <p className="text-slate-400 mb-12 text-sm uppercase tracking-widest">Community Crisis Lifeline</p>
          <button onClick={() => setScreen("category")} className="bg-red-600 w-48 h-48 rounded-full text-3xl font-black animate-pulse shadow-[0_0_40px_rgba(220,38,38,0.4)]">SOS</button>
          <button onClick={() => setScreen("dashboard")} className="mt-16 text-cyan-400 font-bold text-xs border-b border-cyan-400/30">VOLUNTEER DASHBOARD</button>
        </div>
      )}

      {/* ---------- CATEGORY SCREEN ---------- */}
      {screen === "category" && (
        <div className="max-w-md mx-auto pt-8 pb-10">
          <h2 className="text-2xl font-bold mb-8 text-center text-red-500 italic uppercase">Select Emergency</h2>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {["Medical", "Fire", "Food/Shelter", "Rescue"].map((type) => (
              <button key={type} onClick={() => setSelectedType(type)} className={`p-5 rounded-2xl border-2 transition-all font-bold ${selectedType === type ? "bg-red-600 border-white scale-105" : "bg-slate-800 border-slate-700 opacity-60"}`}>{type}</button>
            ))}
          </div>
          <button onClick={handleFetchLocation} className="w-full bg-slate-100 text-slate-900 py-4 rounded-2xl mb-4 font-black">
            {location ? "✅ LOCATION LOCKED" : "📍 1. FETCH MY LOCATION"}
          </button>
          <button onClick={submitSOS} disabled={!location || !selectedType} className="w-full bg-red-600 py-5 rounded-2xl font-black text-xl shadow-lg disabled:opacity-30">2. SUBMIT SOS</button>
          <button onClick={() => setScreen("home")} className="w-full text-slate-500 mt-6 text-sm uppercase font-bold tracking-widest">Cancel</button>
        </div>
      )}

      {/* ---------- REAL MAP SCREEN ---------- */}
      {screen === "map" && location && (
        <div className="max-w-md mx-auto pt-4 pb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-black text-red-500 uppercase">Live Rescue Map</h2>
            <div className="bg-cyan-500/10 text-cyan-400 text-[10px] font-bold px-3 py-1 rounded-full animate-pulse tracking-widest border border-cyan-400/20">RESCUER DISTANCE: {getDistance(location.lat, location.lng, volunteerLoc.lat, volunteerLoc.lng)} KM</div>
          </div>
          <div className="rounded-[2rem] overflow-hidden border-4 border-slate-800 shadow-2xl">
            <MapContainer center={[location.lat, location.lng]} zoom={13} style={{ height: "400px", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[location.lat, location.lng]}><Popup>You are here</Popup></Marker>
              <Marker position={[volunteerLoc.lat, volunteerLoc.lng]}><Popup>Rescuer is coming</Popup></Marker>
            </MapContainer>
          </div>
          <button onClick={() => setScreen("home")} className="w-full bg-slate-800 py-4 mt-6 rounded-2xl font-bold border border-slate-700">Exit Tracking</button>
        </div>
      )}

      {/* ---------- VOLUNTEER DASHBOARD */}
      {screen === "dashboard" && (
        <div className="max-w-md mx-auto pt-4 pb-20">
          <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-black text-cyan-500 tracking-tighter">ACTIVE ALERTS</h2>
            <button onClick={() => setScreen("home")} className="bg-slate-800 px-4 py-2 rounded-xl text-[10px] font-black text-white uppercase tracking-widest border border-slate-700">⬅️ Back</button>
          </div>

          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="bg-slate-800 p-5 rounded-3xl border-l-8 border-red-600 shadow-xl transition-transform active:scale-95">
                <div className="flex justify-between mb-3">
                  <span className="font-black text-red-500 uppercase text-xs tracking-widest">{req.type}</span>
                  <span className="text-[10px] text-slate-500 font-bold">{req.time?.toDate?.().toLocaleString().split(',')[1] || "Just Now"}</span>
                </div>
                <p className="text-[10px] text-slate-400 mb-4 font-mono">LOCATION: {Number(req.latitude)?.toFixed(3) ?? "N/A"}, {Number(req.longitude)?.toFixed(3) ?? "N/A"}</p>
                <button className="w-full bg-cyan-600/20 text-cyan-400 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] border border-cyan-500/30">Mark Resolved</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
