import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Announcement message is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    authorName: {
      type: String,
      default: 'Placement Cell Office',
      trim: true,
    },
    publicationDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    targetAudience: {
      type: [String],
      default: ['all'],
    },
    tag: {
      type: String,
      enum: ['Drive Notice', 'Assessment', 'Interview Schedule', 'Policy', 'Training', 'General'],
      default: 'General',
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Announcement = mongoose.model('Announcement', announcementSchema);
export default Announcement;
