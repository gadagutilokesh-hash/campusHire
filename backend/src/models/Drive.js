import mongoose from 'mongoose';

const driveSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      index: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Associated job is required'],
      index: true,
    },
    dateTime: {
      type: Date,
      required: [true, 'Drive date and time is required'],
      index: true,
    },
    venueOrLink: {
      type: String,
      required: [true, 'Venue or virtual meeting link is required'],
      trim: true,
    },
    isVirtual: {
      type: Boolean,
      default: false,
    },
    currentRound: {
      type: String,
      required: [true, 'Round information is required'],
      trim: true,
    },
    roundDescription: {
      type: String,
    },
    instructions: {
      type: String,
    },
    coordinator: {
      name: { type: String, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: ['upcoming', 'in_progress', 'completed', 'cancelled'],
      default: 'upcoming',
      index: true,
    },
    targetBatch: {
      type: String,
      default: '2027',
    },
  },
  {
    timestamps: true,
  }
);

export const Drive = mongoose.model('Drive', driveSchema);
export default Drive;
