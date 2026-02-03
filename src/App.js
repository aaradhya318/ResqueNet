import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

function App() {
  const [location, setLocation] = useState(null);
  const [requests, setRequests] = useState([]);
  const [screen, setScreen] = useState('home');
  const [selectedType, setSelectedType] = useState('');
  
  // Volunteer Mock Position 
  const volunteerLoc = { lat: 26.8500, lng: 80.9500 }; 

  useEffect(() => {
    const q = query(collection(db, "emergency_requests"), orderBy("time", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleFetchLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          alert("📍 GPS Location Locked!");
        },
        () => alert("⚠️ Please allow GPS access!"),
        { enableHighAccuracy: true }
      );
    }
  };

  const submitSOS = async () => {
    if (!location) return alert("Please fetch location first!");
    try {
      await addDoc(collection(db, "emergency_requests"), {
        type: selectedType,
        status: "Active",
        time: new Date().toLocaleString(),
        latitude: location.lat,
        longitude: location.lng,
      });
      setScreen('map');
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 font-sans">
      
      {/* 1. HOME SCREEN */}
      {screen === 'home' && (
        <div className="flex flex-col items-center justify-center h-screen text-center">
          <h1 className="text-5xl font-black mb-2 tracking-tighter text-cyan-500">RESQUENET</h1>
          <p className="text-slate-400 mb-12 text-sm tracking-widest uppercase">Community Crisis Lifeline</p>
          
          <button 
            onClick={() => setScreen('category')} 
            className="bg-red-600 w-48 h-48 rounded-full text-3xl font-black shadow-[0_0_50px_rgba(220,38,38,0.5)] animate-pulse border-8 border-red-900/30"
          >
            SOS
          </button>
          
          <button 
            onClick={() => setScreen('dashboard')} 
            className="mt-16 text-cyan-400 font-bold tracking-widest text-xs border-b border-cyan-400/30 pb-1"
          >
            VOLUNTEER DASHBOARD
          </button>
        </div>
      )}

      {/* 2. CATEGORY & FETCH SCREEN */}
      {screen === 'category' && (
        <div className="max-w-md mx-auto pt-8">
          <h2 className="text-2xl font-bold mb-8 text-center">Emergency Details</h2>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {['Medical', 'Fire', 'Food/Shelter', 'Rescue'].map(type => (
              <button 
                key={type} 
                onClick={() => setSelectedType(type)} 
                className={`p-4 rounded-2xl border-2 transition-all ${selectedType === type ? 'bg-red-600 border-white scale-105' : 'bg-slate-800 border-slate-700 opacity-60'}`}
              >
                <div className="font-bold text-sm">{type}</div>
              </button>
            ))}
          </div>
          
          <div className="space-y-4">
            <button onClick={handleFetchLocation} className="w-full bg-slate-100 text-slate-900 py-4 rounded-2xl font-black uppercase text-sm tracking-wider">
              {location ? "✅ Location Locked" : "📍 1. Fetch My Location"}
            </button>
            
            <button 
              onClick={submitSOS} 
              disabled={!location || !selectedType} 
              className="w-full bg-red-600 py-5 rounded-2xl font-black text-xl shadow-lg disabled:opacity-20"
            >
              2. SUBMIT SOS
            </button>
          </div>
          <button onClick={() => setScreen('home')} className="w-full text-slate-500 mt-6 text-sm">Cancel Request</button>
        </div>
      )}

      {/* 3. VISUAL MAP SCREEN */}
      {screen === 'map' && (
        <div className="max-w-md mx-auto pt-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-red-500 uppercase">Rescue Map</h2>
            <div className="bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-[10px] font-bold animate-pulse">LIVE TRACKING</div>
          </div>

          {/* Visual Map Representation */}
          <div className="relative w-full h-80 bg-slate-800 rounded-[2rem] border-2 border-slate-700 overflow-hidden mb-6 shadow-inner">
             {/* Grid lines for map look */}
             <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
             
             {/* Victim Marker */}
             <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full shadow-[0_0_15px_red] mb-1"></div>
                <span className="text-[10px] font-bold bg-slate-900 px-2 py-0.5 rounded">YOU</span>
             </div>

             {/* Volunteer Marker */}
             <div className="absolute top-1/3 left-2/3 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-4 h-4 bg-cyan-400 rounded-full shadow-[0_0_15px_#22d3ee] mb-1 animate-bounce"></div>
                <span className="text-[10px] font-bold bg-slate-900 px-2 py-0.5 rounded">RESCUER</span>
             </div>

             {/* Connection Line */}
             <div className="absolute top-[42%] left-[30%] w-[35%] h-[2px] bg-dashed border-t-2 border-dashed border-slate-500 rotate-[-15deg]"></div>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 mb-6">
            <div className="flex justify-between items-center text-sm mb-4">
               <span className="text-slate-400 italic">Estimated Arrival</span>
               <span className="text-white font-bold">~ 8 Minutes</span>
            </div>
            <div className="h-1 bg-slate-700 rounded-full">
               <div className="bg-red-500 h-full w-2/3"></div>
            </div>
          </div>

          <button onClick={() => setScreen('home')} className="w-full bg-slate-800 py-4 rounded-xl text-sm font-bold border border-slate-700">Exit Tracking</button>
        </div>
      )}

      {/* 4. VOLUNTEER DASHBOARD (From Snapshot) */}
      {screen === 'dashboard' && (
        <div className="pt-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black">ACTIVE ALERTS</h2>
            <button onClick={() => setScreen('home')} className="text-slate-500 text-xs uppercase">Close</button>
          </div>
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className="bg-slate-800 p-5 rounded-2xl border-l-4 border-red-600">
                <div className="flex justify-between mb-2">
                  <span className="font-black text-red-500 uppercase text-xs tracking-widest">{req.type}</span>
                  <span className="text-[10px] text-slate-500">{req.time}</span>
                </div>
                <p className="text-[10px] text-slate-400 mb-3">Coords: {req.latitude.toFixed(3)}, {req.longitude.toFixed(3)}</p>
                <button className="w-full bg-cyan-500/10 text-cyan-400 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">Mark as Rescued</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;