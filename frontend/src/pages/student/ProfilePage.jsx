import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, CreditCard, Calendar, Edit2, Lock, Bell,
  Shield, CheckCircle, Camera, Save, X, Eye, EyeOff, ChevronRight
} from 'lucide-react';
import { auth } from '../../firebase/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

// Load saved profile from localStorage, or use defaults
const DEFAULT_PROFILE = {
  name: 'Alex Johnson',
  studentId: 'STU-2026-001',
  email: 'alex.johnson@university.edu',
  nic: '123456789V',
  enrolledSince: 'January 15, 2026',
  department: 'Faculty of Computing',
  phone: '+94 77 123 4567',
};

function loadProfile() {
  try {
    const saved = localStorage.getItem('studentProfile');
    return saved ? { ...DEFAULT_PROFILE, ...JSON.parse(saved) } : { ...DEFAULT_PROFILE };
  } catch { return { ...DEFAULT_PROFILE }; }
}


const ProfilePage = () => {
  const navigate = useNavigate();
  const [editingProfile, setEditingProfile] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [profile, setProfile] = useState(() => {
    const p = loadProfile();
    // Override email with Firebase current user if available
    return { ...p, email: auth.currentUser?.email || p.email };
  });

  const [editForm, setEditForm] = useState({ ...profile });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [notifications, setNotifications] = useState({
    examReminders: true,
    verificationAlerts: true,
    enrollmentUpdates: true,
    systemAnnouncements: false,
  });

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    await new Promise(r => setTimeout(r, 800));
    const updated = { ...editForm };
    setProfile(updated);
    // Persist to localStorage so changes survive page refresh
    localStorage.setItem('studentProfile', JSON.stringify(updated));
    setEditingProfile(false);
    setSavingProfile(false);
    // Show success banner for 3 seconds
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSavePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { alert('New passwords do not match'); return; }
    if (passwordForm.newPassword.length < 6) { alert('Password must be at least 6 characters'); return; }
    setSavingPassword(true);
    try {
      const user = auth.currentUser;
      const cred = EmailAuthProvider.credential(user.email, passwordForm.currentPassword);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, passwordForm.newPassword);
      alert('Password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordSection(false);
    } catch (err) { alert('Failed: ' + err.message); }
    setSavingPassword(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Save success banner */}
      {saveSuccess && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-pulse">
          <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-emerald-800">Profile saved successfully!</p>
        </div>
      )}
      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </div>
                <button className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-50">
                  <Camera size={12} className="text-gray-500" />
                </button>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                <p className="text-sm text-gray-500">{profile.studentId}</p>
                <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                  <CheckCircle size={11} /> Identity Verified
                </span>
              </div>
            </div>
            {!editingProfile && (
              <button onClick={() => { setEditingProfile(true); setEditForm({ ...profile }); }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition">
                <Edit2 size={15} /> Edit Profile
              </button>
            )}
          </div>

          {!editingProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: Mail, label: 'Email Address', value: profile.email },
                { icon: CreditCard, label: 'NIC Number', value: profile.nic },
                { icon: Calendar, label: 'Enrolled Since', value: profile.enrolledSince },
                { icon: Shield, label: 'Department', value: profile.department },
                { icon: User, label: 'Phone Number', value: profile.phone },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                    <Icon size={16} className="text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'name', label: 'Full Name' },
                  { key: 'phone', label: 'Phone Number' },
                  { key: 'department', label: 'Department' },
                  { key: 'nic', label: 'NIC Number' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
                    <input type="text" value={editForm[key]}
                      onChange={e => setEditForm({ ...editForm, [key]: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400">Email and Student ID cannot be changed.</p>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSaveProfile} disabled={savingProfile}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60">
                  <Save size={15} /> {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => setEditingProfile(false)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">
                  <X size={15} /> Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <button onClick={() => setShowPasswordSection(!showPasswordSection)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Lock size={18} className="text-amber-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Change Password</p>
              <p className="text-sm text-gray-500">Update your account password</p>
            </div>
          </div>
          <ChevronRight size={18} className={`text-gray-400 transition-transform ${showPasswordSection ? 'rotate-90' : ''}`} />
        </button>

        {showPasswordSection && (
          <div className="px-6 pb-6 border-t border-gray-50 pt-4 space-y-4">
            {[
              { key: 'currentPassword', label: 'Current Password', show: showCurrentPw, toggle: () => setShowCurrentPw(!showCurrentPw) },
              { key: 'newPassword', label: 'New Password', show: showNewPw, toggle: () => setShowNewPw(!showNewPw) },
              { key: 'confirmPassword', label: 'Confirm New Password', show: showNewPw, toggle: null },
            ].map(({ key, label, show, toggle }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} value={passwordForm[key]}
                    onChange={e => setPasswordForm({ ...passwordForm, [key]: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-10" />
                  {toggle && (
                    <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button onClick={handleSavePassword} disabled={savingPassword}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60">
              <Lock size={15} /> {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        )}
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Bell size={18} className="text-blue-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Notification Preferences</p>
            <p className="text-sm text-gray-500">Choose what you want to be notified about</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { key: 'examReminders', label: 'Exam Reminders', desc: 'Get reminded 24 hours before your exams' },
            { key: 'verificationAlerts', label: 'Verification Alerts', desc: 'Alerts for identity verification status changes' },
            { key: 'enrollmentUpdates', label: 'Enrollment Updates', desc: 'Updates when your enrollment status changes' },
            { key: 'systemAnnouncements', label: 'System Announcements', desc: 'General platform news and updates' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <button onClick={() => setNotifications({ ...notifications, [key]: !notifications[key] })}
                className={`relative w-11 h-6 rounded-full transition-colors ${notifications[key] ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${notifications[key] ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Verification Status */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Shield size={18} className="text-emerald-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Identity Verification</p>
            <p className="text-sm text-gray-500">Your current verification status</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100 mb-4">
          <CheckCircle className="text-emerald-500 flex-shrink-0" size={20} />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Identity Verified</p>
            <p className="text-xs text-emerald-600">Verified March 5, 2026 · Valid until Dec 31, 2026</p>
          </div>
        </div>
        <button onClick={() => navigate('/verification')}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
          <Shield size={15} /> Re-verify Identity
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
