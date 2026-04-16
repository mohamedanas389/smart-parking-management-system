import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema({
  id: Number,
  type: { type: String, enum: ['regular', 'ev', 'handicap'], default: 'regular' },
  isOccupied: { type: Boolean, default: false },
  bookedBy: { type: String, default: null },
  vehicleNumber: { type: String, default: null }
});

const parkingSchema = new mongoose.Schema({
  name: String,
  location: String,
  totalSlots: Number,
  slots: [slotSchema]
}, { timestamps: true });

export default mongoose.model('Parking', parkingSchema);