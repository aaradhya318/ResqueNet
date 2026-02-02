import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";

function App() {
  const [screen, setScreen] = useState('welcome');
  const [requests, setRequests] = useState([]);
  const [location, setLocation] = useState(null);
  const [category, setCategory] = useState("Medical Emergency");

  // 1. Real-time Data Fetching
  useEffect(() => {
    const q = query(collection(db, "emergency_requests"), orderBy("time", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      setRequests(docs);
    });
    return () => unsubscribe();
  }, []);

  // 2. FETCH CURRENT LOCATION (Ab yeh permission maangega)
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setLocation(coords);
        alert("📍 Your current location has been locked!");
      }, () => {
        alert("Please enable GPS/Location permissions in your browser settings!");
      });
    }
  };

  // 3. SOS Request SEND (Ab bina location ke submit nahi hoga)
  const sendEmergency = async () => {
    if (!location) {
      alert("Please fetch your location first by clicking the button!");
      return;
    }

    try {
      await addDoc(collection(db, "emergency_requests"), {
        type: category,
        status: "Active",
        time: new Date().toLocaleString(),
        latitude: location.lat, 
        longitude: location.lng
      });
      alert('SOS Sent! Help is on the way.');
      setScreen('map'); 
    } catch (e) {
      console.error("Error: ", e);
    }
  };

  // --- UI SCREENS ---

  if (screen === 'welcome') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-5xl font-black text-cyan-400 mb-2">ResqueNet</h1>
        <p className="text-gray-400 mb-12">Instant Community Emergency Response</p>
        <div onClick={() => setScreen('form')} className="bg-red-600 w-48 h-48 rounded-full flex items-center justify-center border-8 border-red-900 shadow-[0_0_50px_rgba(220,38,38,0.5)] cursor-pointer active:scale-95 transition-all">
          <span className="text-4xl font-black">SOS</span>
        </div>
        <button onClick={() => setScreen('map')} className="mt-12 text-cyan-400 font-bold uppercase tracking-widest text-sm">Volunteer Dashboard</button>
      </div>
    );
  }

  if (screen === 'form') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <button onClick={() => setScreen('welcome')} className="text-cyan-400 mb-6">← Back</button>
        <h2 className="text-3xl font-bold mb-8 text-red-500">Ask for Help</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-800 p-4 rounded-xl border border-slate-700">
              <option>Medical Emergency</option>
              <option>Fire Emergency</option>
              <option>Rescue Needed</option>
              <option>Food/Shelter</option>
            </select>
          </div>

          <button onClick={getLocation} className="w-full bg-slate-800 border-2 border-cyan-600 py-4 rounded-xl font-bold">
            {location ? "📍 Location Secured" : "Fetch My GPS Location 📍"}
          </button>

          <button onClick={sendEmergency} className="w-full bg-red-600 py-5 rounded-xl font-black text-xl shadow-lg uppercase">
            Submit SOS
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'map') {
    const latestRequest = requests[0] || { latitude: 26.8467, longitude: 80.9462 };

    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 flex flex-col">
        <button onClick={() => setScreen('welcome')} className="text-cyan-400 mb-4 flex items-center">← Back</button>
        <h2 className="text-2xl font-bold mb-4">Nearby Alerts</h2>

        <div className="w-full h-64 bg-slate-800 rounded-3xl mb-6 overflow-hidden border-2 border-slate-700 relative">
          <iframe
          title="Emergency Location Map" 
          width="100%"
          height="100%"
          style={{ border: 0 }}
          src={`https://maps.google.com/maps?q=${latestRequest.latitude},${latestRequest.longitude}&z=15&output=embed`}
          ></iframe>
          <div className="absolute top-2 right-2 bg-red-600 px-2 py-1 rounded text-[10px] animate-pulse">LIVE TRACKING</div>
        </div>

        <div className="space-y-4 overflow-y-auto max-h-[300px]">
          {requests.map((req) => (
            <div key={req.id} className="bg-slate-800 p-4 rounded-xl border-l-4 border-red-500">
              <div className="flex justify-between items-center mb-2">
                <span className="text-red-400 font-bold text-xs">🚨 {req.type}</span>
                <span className="text-[10px] text-gray-500">{req.time}</span>
              </div>
              <p className="text-sm">Status: <span className="text-cyan-400 font-bold">{req.status}</span></p>
              <p className="text-[10px] text-slate-400 mt-1">📍 {req.latitude}, {req.longitude}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default App;