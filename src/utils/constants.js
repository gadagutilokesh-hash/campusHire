// Application constants and configurations

export const APP_CONFIG = {
  NAME: 'CampusHire',
  TAGLINE: 'Modern Campus Recruitment & Placement Portal',
  COLLEGE_NAME: 'Sree Dattha Institute of Engineering and Science',
  COLLEGE_SHORT: 'SDES',
  PLACEMENT_SESSION: '2026-2027',
  VERSION: '1.0.0-milestone1',
  CONTACT_EMAIL: 'placements@sdes.edu.in',
  HELP_DESK: '+91 (080) 2854-9922',
};

export const USER_ROLES = {
  STUDENT: 'student',
  OFFICER: 'placement_officer',
};

export const APPLICATION_STATUS = {
  APPLIED: 'Applied',
  SHORTLISTED: 'Shortlisted',
  ASSESSMENT_SCHEDULED: 'Assessment Scheduled',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  SELECTED: 'Selected',
  REJECTED: 'Rejected',
};

export const JOB_TYPES = {
  FULL_TIME: 'Full-Time',
  INTERNSHIP: 'Internship',
  INTERN_PLUS_FTE: 'Internship + FTE',
};

export const BRANCHES = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Electrical & Electronics',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Data Science & AI',
];

export const SALARY_RANGES = [
  { label: 'All Packages', min: 0, max: Infinity },
  { label: 'Below ₹6 LPA', min: 0, max: 6 },
  { label: '₹6 - ₹12 LPA', min: 6, max: 12 },
  { label: '₹12 - ₹20 LPA', min: 12, max: 20 },
  { label: 'Above ₹20 LPA (Super Dream)', min: 20, max: Infinity },
];
