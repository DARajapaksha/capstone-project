import React, { useEffect, useState } from 'react';
import { X, Upload } from 'lucide-react';

const EditProfileModal = ({ open, onClose, profile, onSave }) => {
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [nic, setNic] = useState(profile.nic);
  const [studentId, setStudentId] = useState(profile.studentId);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setEmail(profile.email);
      setNic(profile.nic);
      setStudentId(profile.studentId);
    }
  }, [profile]);

  if (!open) return null;

  const initials = fullName
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSave = () => {
    onSave({ fullName, email, nic, studentId });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
      <div className="w-full max-w-xl rounded-[32px] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Edit Profile</h2>
            <p className="mt-1 text-sm text-slate-500">
              Make changes to your profile information here. Click save when you're done.
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-5">
          <div className="flex items-center gap-4 rounded-[28px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-lg font-semibold text-white">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Profile Picture</p>
              <button className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                <Upload size={16} /> Upload Photo
              </button>
              <p className="mt-1 text-xs text-slate-400">JPG, PNG or GIF (max. 5MB)</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Full Name</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">NIC Number</span>
              <input
                value={nic}
                onChange={(e) => setNic(e.target.value)}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Student ID</span>
              <input
                value={studentId}
                disabled
                className="w-full cursor-not-allowed rounded-3xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none"
              />
            </label>
          </div>

          <p className="text-xs text-slate-400">Student ID cannot be changed</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="rounded-3xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-3xl bg-[#5B47FB] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#4b3dde]"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
