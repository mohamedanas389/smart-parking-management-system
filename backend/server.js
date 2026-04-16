import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Parking from './models/Parking.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error(err));

// Seed Data (Runs only if DB is empty)
const seedDB = async () => {
  const count = await Parking.countDocuments();
  if (count === 0) {
    const slots = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      type: i === 2 || i === 15 ? 'ev' : i === 5 ? 'handicap' : 'regular',
      isOccupied: Math.random() > 0.6 // Randomly occupy some slots initially
    }));
    await Parking.create({ name: "Central Hub Parking", location: "Downtown, City Center", totalSlots: 20, slots });
    console.log('📦 Database Seeded');
  }
};
seedDB();

// --- ROUTES ---

// 1. Get all parking lots
app.get('/api/parking', async (req, res) => {
  const lots = await Parking.find();
  res.json(lots);
});

// 2. Get single parking lot details
app.get('/api/parking/:id', async (req, res) => {
  const lot = await Parking.findById(req.params.id);
  res.json(lot);
});

// 3. Book a slot
app.put('/api/parking/:id/book', async (req, res) => {
  const { slotId, vehicleNumber, bookedBy } = req.body;
  const lot = await Parking.findById(req.params.id);
  const slot = lot.slots.find(s => s.id === slotId);
  
  if (slot.isOccupied) return res.status(400).json({ message: 'Slot already occupied' });
  
  slot.isOccupied = true;
  slot.vehicleNumber = vehicleNumber;
  slot.bookedBy = bookedBy;
  await lot.save();
  res.json({ message: 'Slot booked successfully', lot });
});

// 4. Release a slot
app.put('/api/parking/:id/release', async (req, res) => {
  const { slotId } = req.body;
  const lot = await Parking.findById(req.params.id);
  const slot = lot.slots.find(s => s.id === slotId);
  
  slot.isOccupied = false;
  slot.vehicleNumber = null;
  slot.bookedBy = null;
  await lot.save();
  res.json({ message: 'Slot released successfully', lot });
});

app.listen(process.env.PORT, () => console.log(`🚀 Server running on port ${process.env.PORT}`));