import React, { useState, useEffect } from 'react';
import {
  User,
  GraduationCap,
  Award,
  FileText,
  Code,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Upload,
  ExternalLink,
  Trash2,
  Plus,
  Loader2,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';

const TABS = [
  { id: 1, label: 'Personal Info', icon: User },
  { id: 2, label: 'Academic Records', icon: GraduationCap },
  { id: 3, label: 'Academic Standing', icon: Award },
  { id: 4, label: 'PDF Resume', icon: FileText },
  { id: 5, label: 'Skills & Badges', icon: Code },
  { id: 6, label: 'Policy Agreement', icon: ShieldCheck },
];

const SUGGESTED_SKILLS = [
  'Data Structures & Algorithms',
  'React.js',
  'Node.js',
  'Python',
  'Java',
  'C++',
  'SQL & Database Design',
  'System Design',
  'Machine Learning',
  'Git & Version Control',
  'Docker & Cloud Basics',
  'RESTful API Design',
];

export const ProfileVerificationModal = ({ isOpen, onClose, initialTabId = 1 }) => {
  const { user, updateProfile, uploadResume } = useAuth();
  const { success, error: notifyError } = useNotifications();

  const [activeTab, setActiveTab] = useState(initialTabId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [personalForm, setPersonalForm] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const [academicForm, setAcademicForm] = useState({
    department: 'Computer Science & Engineering',
    rollNo: '',
    course: 'B.Tech',
    graduationYear: 2027,
  });

  const [standingForm, setStandingForm] = useState({
    cgpa: '',
    activeBacklogs: 0,
    historyBacklogs: 0,
    tenthPercentage: '',
    twelfthPercentage: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');

  const [skillsList, setSkillsList] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [skillLevel, setSkillLevel] = useState('Intermediate');

  const [policyAgreed, setPolicyAgreed] = useState(false);

  // Sync form state when user changes or modal opens
  useEffect(() => {
    if (user) {
      setPersonalForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
      });

      setAcademicForm({
        department: user.department || user.branch || 'Computer Science & Engineering',
        rollNo: user.rollNo && user.rollNo !== 'Not Assigned' ? user.rollNo : '',
        course: user.course || 'B.Tech',
        graduationYear: user.graduationYear || 2027,
      });

      setStandingForm({
        cgpa: user.cgpa ? String(user.cgpa) : '',
        activeBacklogs: user.activeBacklogs || 0,
        historyBacklogs: user.historyBacklogs || 0,
        tenthPercentage: user.tenthPercentage ? String(user.tenthPercentage) : '',
        twelfthPercentage: user.twelfthPercentage ? String(user.twelfthPercentage) : '',
      });

      setSkillsList(Array.isArray(user.skills) ? [...user.skills] : []);
      setPolicyAgreed(Boolean(user.policyAcknowledged));
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (initialTabId) {
      setActiveTab(initialTabId);
    }
  }, [initialTabId, isOpen]);

  // Tab 1 Submit: Personal Details
  const handleSavePersonal = async (e) => {
    e.preventDefault();
    if (!personalForm.name.trim()) {
      notifyError('Full name is required.');
      return;
    }
    if (!personalForm.phone.trim()) {
      notifyError('Valid contact phone number is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({
        name: personalForm.name.trim(),
        phone: personalForm.phone.trim(),
        address: personalForm.address.trim(),
      });
      success('Personal details and contact info saved successfully!');
    } catch (err) {
      notifyError(err.message || 'Failed to update personal details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tab 2 Submit: Academic Records
  const handleSaveAcademic = async (e) => {
    e.preventDefault();
    if (!academicForm.department.trim()) {
      notifyError('Academic department is required.');
      return;
    }
    if (!academicForm.rollNo.trim()) {
      notifyError('Official student roll number is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({
        department: academicForm.department.trim(),
        rollNo: academicForm.rollNo.trim().toUpperCase(),
        course: academicForm.course.trim(),
        graduationYear: Number(academicForm.graduationYear) || 2027,
      });
      success('Academic department and roll number verified successfully!');
    } catch (err) {
      notifyError(err.message || 'Failed to update academic records.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tab 3 Submit: Academic Standing
  const handleSaveStanding = async (e) => {
    e.preventDefault();
    const parsedCgpa = parseFloat(standingForm.cgpa);
    if (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10) {
      notifyError('Please enter a valid CGPA between 0.00 and 10.00.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({
        cgpa: parsedCgpa,
        activeBacklogs: Number(standingForm.activeBacklogs) || 0,
        historyBacklogs: Number(standingForm.historyBacklogs) || 0,
        tenthPercentage: standingForm.tenthPercentage ? parseFloat(standingForm.tenthPercentage) : undefined,
        twelfthPercentage: standingForm.twelfthPercentage ? parseFloat(standingForm.twelfthPercentage) : undefined,
      });
      success('Academic standing and CGPA record updated successfully!');
    } catch (err) {
      notifyError(err.message || 'Failed to update academic standing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tab 4 File Selection & Upload: Resume
  const handleFileChange = (e) => {
    setFileError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setFileError('Invalid file type. Only PDF documents (.pdf) are accepted.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError('File exceeds maximum size limit of 5 MB.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadResume = async () => {
    if (!selectedFile) {
      setFileError('Please select a valid PDF resume file to upload.');
      return;
    }

    setIsSubmitting(true);
    setFileError('');

    try {
      // Read file as base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result;
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = () => reject(new Error('Failed to read file from disk.'));
      });
      reader.readAsDataURL(selectedFile);

      const fileData = await base64Promise;

      await uploadResume({
        fileName: selectedFile.name,
        fileType: selectedFile.type || 'application/pdf',
        fileSize: selectedFile.size,
        fileData,
      });

      setSelectedFile(null);
      success('PDF resume successfully uploaded, verified, and linked to profile!');
    } catch (err) {
      notifyError(err.message || 'Failed to upload resume document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tab 5: Technical Skills & Badges
  const handleAddSkill = (skillToAdd) => {
    const s = (skillToAdd || newSkill).trim();
    if (!s) return;
    if (skillsList.some((existing) => existing.toLowerCase() === s.toLowerCase())) {
      notifyError(`'${s}' is already in your skills profile.`);
      return;
    }
    setSkillsList([...skillsList, s]);
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkillsList(skillsList.filter((s) => s !== skillToRemove));
  };

  const handleSaveSkills = async () => {
    if (skillsList.length === 0) {
      notifyError('Please add at least one technical competency or programming language.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({
        skills: skillsList,
      });
      success('Technical skills profile updated and verified successfully!');
    } catch (err) {
      notifyError(err.message || 'Failed to update technical skills.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tab 6: Placement Policy Agreement
  const handleSavePolicy = async () => {
    if (!policyAgreed) {
      notifyError('You must explicitly acknowledge and accept the 2026-27 placement guidelines.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({
        policyAcknowledged: true,
      });
      success('Placement Policy acknowledgment signed and recorded successfully!');
    } catch (err) {
      notifyError(err.message || 'Failed to submit placement policy agreement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const checklist = user?.completionChecklist || [];
  const isCheckCompleted = (id) => Boolean(checklist.find((c) => c.id === id)?.completed);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verify Placement Profile"
      subtitle="Complete official institutional verification checks for campus placement eligibility"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        {/* Verification Check Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 p-1 bg-[#F3F5F7] rounded-md border border-slate-200">
          {TABS.map((tab) => {
            const completed = isCheckCompleted(tab.id);
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center p-2 rounded text-center transition-colors cursor-pointer relative ${
                  isActive
                    ? 'bg-white text-[#0A0A0A] shadow-xs border border-slate-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 font-medium'
                }`}
              >
                <div className="flex items-center gap-1 mb-1">
                  <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#007BA7]' : 'text-slate-500'}`} />
                  {completed ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  )}
                </div>
                <span className="text-[10px] leading-tight line-clamp-1">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Personal Details & Contact Info */}
        {activeTab === 1 && (
          <form onSubmit={handleSavePersonal} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700">
              <p className="font-semibold text-[#0A0A0A] mb-0.5">Verification Rule 1: Contact Identity</p>
              <p className="text-[11px] text-[#667085]">
                Corporate recruiters communicate assessment links and interview schedules via your verified institutional email and phone number.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-[#0A0A0A] mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  value={personalForm.name}
                  onChange={(e) => setPersonalForm({ ...personalForm, name: e.target.value })}
                  placeholder="e.g. Arjun Sharma"
                  className="w-full px-3 py-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:border-[#007BA7] text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0A0A0A] mb-1">Institutional Email (Verified)</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-slate-500 cursor-not-allowed font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0A0A0A] mb-1">Contact Phone Number *</label>
                <input
                  type="tel"
                  value={personalForm.phone}
                  onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:border-[#007BA7] text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0A0A0A] mb-1">Campus / Residential Address</label>
                <input
                  type="text"
                  value={personalForm.address}
                  onChange={(e) => setPersonalForm({ ...personalForm, address: e.target.value })}
                  placeholder="Hostel / City Address"
                  className="w-full px-3 py-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:border-[#007BA7] text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#007BA7] hover:bg-[#00668A] text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Personal Details</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Academic Records */}
        {activeTab === 2 && (
          <form onSubmit={handleSaveAcademic} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700">
              <p className="font-semibold text-[#0A0A0A] mb-0.5">Verification Rule 2: Academic Enrollment</p>
              <p className="text-[11px] text-[#667085]">
                Placement eligibility criteria filter candidates by degree discipline, graduation batch, and official student roll number.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-[#0A0A0A] mb-1">Department / Discipline *</label>
                <select
                  value={academicForm.department}
                  onChange={(e) => setAcademicForm({ ...academicForm, department: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:border-[#007BA7] text-slate-800"
                  required
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
                  <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Data Science & Artificial Intelligence">Data Science & Artificial Intelligence</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#0A0A0A] mb-1">Official Student Roll Number *</label>
                <input
                  type="text"
                  value={academicForm.rollNo}
                  onChange={(e) => setAcademicForm({ ...academicForm, rollNo: e.target.value.toUpperCase() })}
                  placeholder="e.g. 23BCSE042"
                  className="w-full px-3 py-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:border-[#007BA7] text-slate-800 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0A0A0A] mb-1">Program / Degree</label>
                <input
                  type="text"
                  value={academicForm.course}
                  onChange={(e) => setAcademicForm({ ...academicForm, course: e.target.value })}
                  placeholder="e.g. B.Tech"
                  className="w-full px-3 py-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:border-[#007BA7] text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0A0A0A] mb-1">Graduation Passing Year *</label>
                <input
                  type="number"
                  min="2020"
                  max="2035"
                  value={academicForm.graduationYear}
                  onChange={(e) => setAcademicForm({ ...academicForm, graduationYear: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:border-[#007BA7] text-slate-800"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#007BA7] hover:bg-[#00668A] text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Academic Records</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Academic Standing */}
        {activeTab === 3 && (
          <form onSubmit={handleSaveStanding} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700">
              <p className="font-semibold text-[#0A0A0A] mb-0.5">Verification Rule 3: CGPA & Backlogs</p>
              <p className="text-[11px] text-[#667085]">
                Companies mandate cutoff thresholds (e.g. CGPA &ge; 7.00 with 0 active backlogs) during automated resume screening.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-[#0A0A0A] mb-1">Cumulative CGPA (out of 10.0) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={standingForm.cgpa}
                  onChange={(e) => setStandingForm({ ...standingForm, cgpa: e.target.value })}
                  placeholder="e.g. 8.78"
                  className="w-full px-3 py-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:border-[#007BA7] text-slate-800 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0A0A0A] mb-1">Active Backlogs</label>
                <input
                  type="number"
                  min="0"
                  value={standingForm.activeBacklogs}
                  onChange={(e) => setStandingForm({ ...standingForm, activeBacklogs: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:border-[#007BA7] text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0A0A0A] mb-1">History of Backlogs</label>
                <input
                  type="number"
                  min="0"
                  value={standingForm.historyBacklogs}
                  onChange={(e) => setStandingForm({ ...standingForm, historyBacklogs: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:border-[#007BA7] text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <label className="block font-semibold text-[#0A0A0A] mb-1">10th Standard Percentage (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={standingForm.tenthPercentage}
                  onChange={(e) => setStandingForm({ ...standingForm, tenthPercentage: e.target.value })}
                  placeholder="e.g. 94.6"
                  className="w-full px-3 py-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:border-[#007BA7] text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0A0A0A] mb-1">12th Standard Percentage (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={standingForm.twelfthPercentage}
                  onChange={(e) => setStandingForm({ ...standingForm, twelfthPercentage: e.target.value })}
                  placeholder="e.g. 92.4"
                  className="w-full px-3 py-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:border-[#007BA7] text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#007BA7] hover:bg-[#00668A] text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Academic Standing</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 4: Resume Upload */}
        {activeTab === 4 && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-700">
              <p className="font-semibold text-[#0A0A0A] mb-0.5">Verification Rule 4: Genuine PDF Resume</p>
              <p className="text-[11px] text-[#667085]">
                Upload your official single or two-page resume in PDF format (maximum size 5 MB). The server inspects file headers to verify genuine document structure.
              </p>
            </div>

            {user?.resumeUrl && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-md flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-emerald-950">Active Verified Resume:</span>{' '}
                    <span className="font-mono text-emerald-800">{user.resumeName || 'Candidate_Resume.pdf'}</span>
                    {user.resumeUpdatedAt && (
                      <p className="text-[10px] text-emerald-700">
                        Uploaded on: {new Date(user.resumeUpdatedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <a
                  href={user.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-300 flex items-center gap-1 transition-colors"
                >
                  <span>Preview</span>
                  <ExternalLink className="w-3 h-3 text-[#007BA7]" />
                </a>
              </div>
            )}

            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-[#007BA7] transition-colors bg-[#F3F5F7]/40">
              <Upload className="w-8 h-8 text-[#007BA7] mx-auto mb-2" />
              <p className="font-semibold text-slate-800 mb-1">
                {selectedFile ? selectedFile.name : 'Select or drop your PDF resume here'}
              </p>
              <p className="text-[11px] text-[#667085] mb-3">
                {selectedFile
                  ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to verify and upload`
                  : 'Only genuine PDF documents up to 5 MB are supported'}
              </p>

              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded border border-slate-300 text-xs cursor-pointer shadow-xs">
                <span>Browse Local Computer</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {fileError && (
                <p className="mt-2 text-[11px] text-rose-600 flex items-center justify-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{fileError}</span>
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleUploadResume}
                disabled={!selectedFile || isSubmitting}
                className="px-4 py-2 bg-[#007BA7] hover:bg-[#00668A] text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Upload & Verify PDF Resume</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 5: Technical Skills & Badges */}
        {activeTab === 5 && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-700">
              <p className="font-semibold text-[#0A0A0A] mb-0.5">Verification Rule 5: Technical Competency</p>
              <p className="text-[11px] text-[#667085]">
                Candidate skill tags are matched against job prerequisites published by recruitment partners.
              </p>
            </div>

            {/* Add Skill Input */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="Enter skill or programming language (e.g. React.js, Python)"
                  className="w-full px-3 py-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:border-[#007BA7] text-slate-800"
                />
              </div>

              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                className="px-3 py-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:border-[#007BA7] text-slate-800"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>

              <button
                type="button"
                onClick={() => handleAddSkill()}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md flex items-center justify-center gap-1 font-semibold cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Skill</span>
              </button>
            </div>

            {/* Quick Suggestions */}
            <div>
              <p className="text-[10px] font-bold text-[#667085] uppercase tracking-wider mb-1.5">
                Quick Add Suggestions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_SKILLS.filter((s) => !skillsList.includes(s)).map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleAddSkill(skill)}
                    className="px-2 py-0.5 text-[11px] font-medium bg-[#F3F5F7] hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition-colors cursor-pointer"
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Active Skills */}
            <div>
              <p className="text-[10px] font-bold text-[#667085] uppercase tracking-wider mb-2">
                Your Recorded Skills ({skillsList.length})
              </p>
              {skillsList.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-md text-center text-slate-500">
                  No skills listed yet. Add at least one technical competency to verify this section.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skillsList.map((skill) => (
                    <div
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-800 shadow-2xs"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#007BA7]" />
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer ml-0.5"
                        aria-label={`Remove ${skill}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveSkills}
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#007BA7] hover:bg-[#00668A] text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Technical Skills Profile</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 6: Placement Policy Agreement */}
        {activeTab === 6 && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-700">
              <p className="font-semibold text-[#0A0A0A] mb-0.5">Verification Rule 6: Placement Policy Accord</p>
              <p className="text-[11px] text-[#667085]">
                Review the 2026-27 campus recruitment terms. All candidates must sign the formal agreement before submitting applications.
              </p>
            </div>

            {/* Scrollable Policy Document Container */}
            <div className="border border-slate-200 rounded-md p-4 bg-[#F3F5F7]/50 max-h-48 overflow-y-auto space-y-3 text-[11px] text-slate-700 leading-relaxed font-sans">
              <div>
                <h4 className="font-bold text-[#0A0A0A] mb-0.5">1. Accuracy of Academic Records</h4>
                <p>
                  Candidates are strictly responsible for the accuracy of all submitted details, including CGPA, backlogs, and resume credentials. Submission of falsified records or forged credentials results in immediate placement de-registration and disciplinary inquiry.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#0A0A0A] mb-0.5">2. Mandatory Attendance & Interview Commitments</h4>
                <p>
                  Registering for an active placement drive constitutes a binding commitment to participate in all scheduled online tests, group discussions, and interview rounds. Unexcused absence leads to a mandatory suspension from subsequent recruitment drives.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#0A0A0A] mb-0.5">3. One-Offer Policy & Offer Acceptance</h4>
                <p>
                  Upon receiving an official employment offer through CampusHire, candidate placement status transitions to 'Placed' in accordance with institutional multi-offer governance bylaws.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#0A0A0A] mb-0.5">4. Code of Conduct & Interview Attire</h4>
                <p>
                  Candidates must adhere strictly to formal professional business attire and exhibit decorum during all recruitment interactions with visiting corporate personnel.
                </p>
              </div>
            </div>

            {user?.policyAcknowledged && user.policyAcknowledgedAt && (
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-md flex items-center gap-2 text-emerald-950 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Policy signed and verified on {new Date(user.policyAcknowledgedAt).toLocaleDateString()} at{' '}
                  {new Date(user.policyAcknowledgedAt).toLocaleTimeString()}
                </span>
              </div>
            )}

            <label className="flex items-start gap-2.5 p-3 rounded-md bg-white border border-slate-300 cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={policyAgreed}
                onChange={(e) => setPolicyAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-[#007BA7] border-slate-300 rounded focus:ring-[#007BA7]"
              />
              <span className="text-xs text-slate-800 leading-normal">
                I, <strong className="text-[#0A0A0A]">{user?.name || 'Student'}</strong> (Roll No:{' '}
                <strong className="text-[#0A0A0A]">{user?.rollNo || 'Pending'}</strong>), have read and unconditionally accept the 2026-27 Campus Placement Rules and Disciplinary Code.
              </span>
            </label>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSavePolicy}
                disabled={!policyAgreed || isSubmitting}
                className="px-4 py-2 bg-[#007BA7] hover:bg-[#00668A] text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Sign & Submit Placement Agreement</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ProfileVerificationModal;
