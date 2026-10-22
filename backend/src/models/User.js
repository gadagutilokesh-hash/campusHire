import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
      index: true,
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'placement_officer'],
        message: '{VALUE} is not a valid user role',
      },
      required: [true, 'Role is required'],
      default: 'student',
    },
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    department: {
      type: String,
      trim: true,
      required: function () {
        return this.role === 'student';
      },
    },
    graduationYear: {
      type: Number,
      required: function () {
        return this.role === 'student';
      },
    },
    // Student-specific profile fields
    studentProfile: {
      rollNo: {
        type: String,
        trim: true,
        uppercase: true,
        sparse: true,
      },
      cgpa: {
        type: Number,
        min: [0, 'CGPA cannot be negative'],
        max: [10, 'CGPA cannot exceed 10.0'],
      },
      activeBacklogs: {
        type: Number,
        default: 0,
        min: 0,
      },
      historyBacklogs: {
        type: Number,
        default: 0,
        min: 0,
      },
      phone: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
      course: {
        type: String,
        trim: true,
        default: 'B.Tech',
      },
      tenthPercentage: {
        type: Number,
        min: 0,
        max: 100,
      },
      twelfthPercentage: {
        type: Number,
        min: 0,
        max: 100,
      },
      skills: [{ type: String, trim: true }],
      skillBadges: [
        {
          name: { type: String, trim: true },
          level: {
            type: String,
            enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
            default: 'Intermediate',
          },
        },
      ],
      resumeUrl: {
        type: String,
        trim: true,
      },
      resumeName: {
        type: String,
        trim: true,
      },
      resumeSize: {
        type: Number,
      },
      resumeUpdatedAt: {
        type: Date,
      },
      policyAcknowledged: {
        type: Boolean,
        default: false,
      },
      policyAcknowledgedAt: {
        type: Date,
      },
      profileCompletion: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      placementStatus: {
        type: String,
        enum: ['unplaced', 'in_process', 'placed'],
        default: 'unplaced',
      },
    },
    // Placement officer specific fields
    officerProfile: {
      designation: { type: String, trim: true },
      officeRoom: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const calculateCompletionPercentage = (user) => {
  if (!user || user.role !== 'student') return 0;
  const sp = user.studentProfile || {};

  const rollNoUpper = String(sp.rollNo || '').trim().toUpperCase();
  const hasRollNo = Boolean(
    rollNoUpper &&
    rollNoUpper !== 'NOT ASSIGNED' &&
    rollNoUpper !== 'NOT_ASSIGNED' &&
    rollNoUpper !== 'N/A' &&
    rollNoUpper !== 'PENDING'
  );

  const checks = [
    // 1. Personal Details & Contact Info
    Boolean(user.name && user.email && sp.phone),
    // 2. Academic Records (Department & Roll No)
    Boolean(user.department && hasRollNo && user.graduationYear),
    // 3. Academic Standing (CGPA & Backlogs)
    Boolean(sp.cgpa !== undefined && sp.cgpa !== null && sp.cgpa > 0),
    // 4. Resume Uploaded
    Boolean(sp.resumeUrl && sp.resumeUrl.trim().length > 0),
    // 5. Technical Skills & Badges
    Boolean(Array.isArray(sp.skills) && sp.skills.length > 0),
    // 6. Placement Policy Acknowledgment Form
    Boolean(sp.policyAcknowledged === true && sp.policyAcknowledgedAt),
  ];

  const completedCount = checks.filter(Boolean).length;
  return Math.round((completedCount / checks.length) * 100);
};

export const User = mongoose.model('User', userSchema);
export default User;
