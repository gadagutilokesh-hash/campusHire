import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: [
        'applied',
        'shortlisted',
        'assessment_scheduled',
        'interview_scheduled',
        'selected',
        'rejected',
        'withdrawn',
      ],
    },
    stageTitle: { type: String },
    date: { type: Date, default: Date.now },
    note: { type: String },
    venue: { type: String },
    meetingLink: { type: String },
    score: { type: String },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: true }
);

const applicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
      index: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job reference is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: [
          'applied',
          'shortlisted',
          'assessment_scheduled',
          'interview_scheduled',
          'selected',
          'rejected',
          'withdrawn',
        ],
        message: '{VALUE} is not a valid application status',
      },
      default: 'applied',
      index: true,
    },
    appliedDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    resumeUrl: {
      type: String,
      trim: true,
    },
    studentSnapshot: {
      name: String,
      rollNo: String,
      email: String,
      department: String,
      cgpa: Number,
      activeBacklogs: Number,
    },
    statusHistory: [statusHistorySchema],
    feedbackNote: {
      type: String,
    },
    offeredPackageLpa: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce single application per student per job via compound unique index
applicationSchema.index({ student: 1, job: 1 }, { unique: true });

export const Application = mongoose.model('Application', applicationSchema);
export default Application;
