import mongoose from 'mongoose';

const selectionRoundSchema = new mongoose.Schema(
  {
    step: { type: Number, required: true },
    name: { type: String, required: true },
    description: { type: String },
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    responsibilities: [{ type: String }],
    skillsRequired: [{ type: String, trim: true }],
    eligibleDepartments: {
      type: [String],
      required: [true, 'At least one eligible department must be specified'],
      default: ['Computer Science & Engineering', 'Information Technology'],
    },
    minCgpa: {
      type: Number,
      required: [true, 'Minimum CGPA threshold is required'],
      min: [0, 'CGPA cannot be negative'],
      max: [10, 'CGPA cannot exceed 10.0'],
      default: 6.0,
    },
    maxActiveBacklogs: {
      type: Number,
      default: 0,
      min: [0, 'Allowed backlogs cannot be negative'],
    },
    salaryPackage: {
      ctcLpa: {
        type: Number,
        required: [true, 'CTC package in LPA is required'],
        min: [0, 'CTC cannot be negative'],
        index: true,
      },
      baseLpa: { type: Number },
      stipendMonthly: { type: String },
      bonus: { type: String },
    },
    category: {
      type: String,
      enum: ['Super Dream', 'Dream', 'Core', 'Regular'],
      default: 'Regular',
      index: true,
    },
    jobType: {
      type: String,
      enum: ['Full-Time', 'Internship', 'Internship + FTE'],
      default: 'Full-Time',
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    workMode: {
      type: String,
      enum: ['On-site', 'Hybrid', 'Remote'],
      default: 'Hybrid',
    },
    openings: {
      type: Number,
      default: 1,
      min: 1,
    },
    applicationDeadline: {
      type: Date,
      required: [true, 'Application deadline is required'],
      index: true,
    },
    driveDate: {
      type: Date,
    },
    bond: {
      type: String,
      default: 'None',
    },
    selectionRounds: [selectionRoundSchema],
    status: {
      type: String,
      enum: ['open', 'closed', 'upcoming', 'archived'],
      default: 'open',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound text search index for flexible querying
jobSchema.index({ company: 'text', title: 'text', description: 'text', skillsRequired: 'text' });

export const Job = mongoose.model('Job', jobSchema);
export default Job;
