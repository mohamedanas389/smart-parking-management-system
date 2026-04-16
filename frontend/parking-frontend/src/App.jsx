import { useState, useEffect } from 'react';
import { getParkingLots, getParkingLotById, bookSlot, releaseSlot } from './api';

export default function App() {
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, slot: null });
  const [form, setForm] = useState({ bookedBy: '', vehicleNumber: '' });
  const [action, setAction] = useState('book'); // 'book' or 'release'

  // Fetch all lots initially
  useEffect(() => {
    getParkingLots().then(res => {
      setLots(res.data);
      setLoading(false);
    });
  }, []);

  // Handle selecting a parking lot to view slots
  const viewSlots = async (id) => {
    const res = await getParkingLotById(id);
    setSelectedLot(res.data);
  };

  // Open Booking Modal
  const openBookModal = (slot) => {
    setForm({ bookedBy: '', vehicleNumber: '' });
    setAction('book');
    setModal({ open: true, slot });
  };

  // Open Release Modal / Direct Release
  const handleRelease = async (slotId) => {
    await releaseSlot(selectedLot._id, { slotId });
    viewSlots(selectedLot._id); // Refresh data
  };

  // Submit Booking
  const handleBooking = async (e) => {
    e.preventDefault();
    if (!form.bookedBy || !form.vehicleNumber) return alert("Fill all fields");
    
    await bookSlot(selectedLot._id, { 
      slotId: modal.slot.id, 
      ...form 
    });
    
    setModal({ open: false, slot: null });
    viewSlots(selectedLot._id); // Refresh data
    // Update parent list availability count
    setLots(prev => prev.map(l => l._id === selectedLot._id ? selectedLot : l));
  };

  // Dynamic Stats Calculation
  const getStats = (lot) => {
    if (!lot) return { available: 0, occupied: 0 };
    const available = lot.slots.filter(s => !s.isOccupied).length;
    return { available, occupied: lot.totalSlots - available };
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center text-slate-400">
      <i className="fas fa-spinner fa-spin text-3xl mr-3 text-emerald-400"></i> Loading System...
    </div>
  );

  return (
    <div className="min-h-screen p-6 md:p-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <span className="text-emerald-400"><i className="fas fa-square-parking"></i></span> 
            ParkSmart
          </h1>
          <p className="text-slate-500 mt-1">Real-time parking availability & slot reservation</p>
        </div>
        {selectedLot && (
          <button onClick={() => setSelectedLot(null)} className="text-slate-400 hover:text-white transition flex items-center gap-2">
            <i className="fas fa-arrow-left"></i> Back to Lots
          </button>
        )}
      </header>

      {/* LOT LIST VIEW */}
      {!selectedLot ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lots.map(lot => {
            const stats = getStats(lot);
            const percentage = Math.round((stats.available / lot.totalSlots) * 100);
            return (
              <div key={lot._id} onClick={() => viewSlots(lot._id)} 
                   className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-emerald-500/50 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold group-hover:text-emerald-400 transition">{lot.name}</h2>
                    <p className="text-sm text-slate-500 mt-1"><i className="fas fa-location-dot mr-1"></i>{lot.location}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full">
                    <div className="pulse-dot"></div>
                    <span className="text-emerald-400 text-sm font-semibold">Live</span>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-slate-400">Available: <span className="text-emerald-400 font-bold">{stats.available}</span></span>
                  <span className="text-slate-400">Occupied: <span className="text-red-400 font-bold">{stats.occupied}</span></span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div style={{ width: `${percentage}%` }} 
                       className={`h-full rounded-full transition-all ${percentage > 30 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                </div>
                <p className="text-right text-xs text-slate-600 mt-1">{percentage}% Free</p>
              </div>
            );
          })}
        </div>
      ) : (
        /* SLOT DETAIL VIEW */
        <div>
          <div className="flex flex-wrap gap-6 mb-8">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl px-6 py-4 flex-1 min-w-[200px]">
              <p className="text-slate-500 text-sm">Total Slots</p>
              <p className="text-3xl font-bold">{selectedLot.totalSlots}</p>
            </div>
            <div className="bg-slate-900/50 border border-emerald-900/50 rounded-xl px-6 py-4 flex-1 min-w-[200px]">
              <p className="text-emerald-500 text-sm">Available</p>
              <p className="text-3xl font-bold text-emerald-400">{getStats(selectedLot).available}</p>
            </div>
            <div className="bg-slate-900/50 border border-red-900/50 rounded-xl px-6 py-4 flex-1 min-w-[200px]">
              <p className="text-red-500 text-sm">Occupied</p>
              <p className="text-3xl font-bold text-red-400">{getStats(selectedLot).occupied}</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-6 mb-6 text-sm">
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500"></span> Regular</span>
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-purple-500/20 border border-purple-500"></span> EV Charging</span>
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-cyan-500/20 border border-cyan-500"></span> Handicap</span>
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-red-500/20 border border-red-500 opacity-50"></span> Occupied</span>
          </div>

          {/* Parking Grid */}
          <div className="parking-lot-grid">
            {selectedLot.slots.map(slot => (
              <div 
                key={slot.id} 
                className={`slot ${slot.isOccupied ? 'occupied' : slot.type}`}
                onClick={() => slot.isOccupied ? handleRelease(slot.id) : openBookModal(slot)}
                title={slot.isOccupied ? `Click to release\n${slot.vehicleNumber}` : `Click to book Slot ${slot.id}`}
              >
                <i className={`fas ${slot.isOccupied ? 'fa-car-side text-red-400' : slot.type === 'ev' ? 'fa-bolt text-purple-400' : slot.type === 'handicap' ? 'fa-wheelchair text-cyan-400' : 'fa-check text-emerald-400'} text-lg mb-1`}></i>
                <span className="text-xs font-bold">{slot.id}</span>
                {slot.isOccupied && <span className="text-[10px] text-red-300 mt-1 truncate w-full text-center px-1">{slot.vehicleNumber}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      {modal.open && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4" onClick={() => setModal({open: false})}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-1">Reserve Slot <span className="text-emerald-400">#{modal.slot.id}</span></h3>
            <p className="text-slate-500 text-sm mb-6">Fill in your details to confirm booking.</p>
            
            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-1">Your Name</label>
                <input required type="text" value={form.bookedBy} onChange={e => setForm({...form, bookedBy: e.target.value})}
                       className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition" placeholder="John Doe" />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Vehicle Number</label>
                <input required type="text" value={form.vehicleNumber} onChange={e => setForm({...form, vehicleNumber: e.target.value.toUpperCase()})}
                       className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition" placeholder="MH 12 AB 1234" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal({open: false})} className="flex-1 py-3 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 transition">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-lg bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}