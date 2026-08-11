import { auth } from "../firebase/firebase";
import { signOut } from "firebase/auth";
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Bell, Settings, LogOut, Edit3, Calendar,
  CheckCircle2, Clock, ArrowRight, BookOpen, Activity, LayoutDashboard, X, Upload
} from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';
import NotificationsDropdown from '../components/student/NotificationsDropdown';
import SettingsDropdown from '../components/student/SettingsDropdown';

const Home = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const { profile, updateProfile, editModalOpen, setEditModalOpen } = useProfile();
  const [savingProfile, setSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', nic: '', studentId: '', avatar: '' });
  const fileInputRef = useRef(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'AJ';

  useEffect(() => {
    if (editModalOpen) {
      setEditForm({
        name: profile?.name || '',
        email: profile?.email || '',
        nic: profile?.nic || '',
        studentId: profile?.studentId || '',
        avatar: profile?.avatar || ''
      });
    }
  }, [editModalOpen, profile]);

  const handleOpenEditModal = () => {
    setEditModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: editForm.name,
        email: editForm.email,
        nic: editForm.nic
      };

      if (editForm.avatar !== profile?.avatar) {
        payload.avatar = editForm.avatar;
      }

      const response = await fetch(`http://${window.location.hostname}:5000/api/user/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        updateProfile(data.user);
        setEditModalOpen(false);
        alert('Profile updated successfully!');
      } else {
        let errMsg = 'Failed to update profile';
        try {
          const data = await response.json();
          errMsg = data.error || errMsg;
        } catch (parseErr) {
          errMsg = `Server Error (Status ${response.status})`;
        }
        alert(errMsg);
        if (response.status === 401) {
          handleLogout();
        }
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('An error occurred while saving profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setEditForm(prev => ({ ...prev, avatar: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    try {
      signOut(auth).catch((err) => console.error('signOut error:', err));
    } catch (err) {
      console.error('signOut catch error:', err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('studentProfile');
    localStorage.removeItem('studentAvatar');
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#F3F6FF] font-sans text-[#1A1A1A] antialiased">

      {/* TOP BAR - FIXED AS REQUESTED */}
      <header className="h-18 bg-white px-12 sticky top-0 z-50 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="bg-[#800000] p-2.5 rounded-[15px] shadow-lg shadow-red-100">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div className="text-left">
            <h2 className="font-black text-xl leading-none tracking-tight uppercase">Student Portal</h2>
            <span className="font-bold text-gray-400 text-[10px] uppercase tracking-[0.2em] mt-1 block">Identity Verification System</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-3 bg-[#F3F6FF] text-gray-400 rounded-2xl relative hover:text-[#800000] transition-all cursor-pointer"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-3 right-3.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            {notifOpen && (
              <NotificationsDropdown
                onClose={() => setNotifOpen(false)}
                onUnreadChange={(count) => setUnreadCount(count)}
              />
            )}
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="p-3 bg-[#F3F6FF] text-gray-400 rounded-2xl relative hover:text-[#800000] transition-all cursor-pointer"
            >
              <Settings size={20} />
            </button>
            {settingsOpen && (
              <SettingsDropdown
                onClose={() => setSettingsOpen(false)}
                onEditProfile={handleOpenEditModal}
                onOpenNotifications={() => setNotifOpen(true)}
                onLogout={handleLogout}
              />
            )}
          </div>

          <div className="bg-white p-1.5 pr-6 rounded-[22px] shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="h-7 w-[1px] bg-gray-200 mx-1"></div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-all group">
              <LogOut size={16} />
              <span className="text-[10px] font-black uppercase">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-12">

        {/* PROFILE SECTION */}
        <section className="bg-white rounded-[50px] shadow-sm border border-white p-14 mb-10">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-12 text-left">
            <div className="flex items-center gap-10">
              {profile?.avatar ? (
                <img src={profile.avatar} alt="Profile" className="w-32 h-32 rounded-full object-cover shadow-2xl border-4 border-white ring-4 ring-red-100" />
              ) : (
                <div className="w-32 h-32 bg-[#800000] rounded-[50%] flex items-center justify-center text-white font-black text-5xl shadow-2xl shadow-red-100">{initials}</div>
              )}
              <div>
                <h1 className="text-3xl font-black mb-3 tracking-tighter uppercase">{profile?.name || ''}</h1>
                <p className="text-gray-400  text-lg">Student ID: {profile?.studentId || ''}</p>
                <div className="flex gap-4 mt-8">
                  <div className="grid grid-cols-3 gap-x-16 gap-y-8 border-l-2 border-gray-50 pl-16">
                    <InfoCol label="Email" val={profile?.email || ''} />
                    <InfoCol label="NIC Number" val={profile?.nic || ''} />
                    <InfoCol label="Enrolled Since" val={profile?.enrolledSince || ''} />
                  </div>
                  <button onClick={handleOpenEditModal} className="bg-white border border-gray-200 text-gray-700 px-8 py-3.5 rounded-2xl text-sm font-black flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm cursor-pointer">
                    <Edit3 size={18} /> Edit Profile
                  </button>
                  <button className="bg-[#800000] text-white px-8 py-3.5 rounded-2xl text-sm font-black flex items-center gap-2 shadow-lg hover:opacity-90 transition-all cursor-pointer">
                    Enroll in Exam
                  </button>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* STATS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <StatCard label="Verification Status" val="Verified" sub="Identity Confirmed" theme="success" isStatus />
          <StatCard label="Enrolled Exams" val="02" sub="1 need verification" theme="warning" />
          <StatCard label="Completed Exams" val="01" sub="Score: 96%" theme="success" />
          <StatCard label="Upcoming Exam" val="MATH-401" sub="Mar 15, 2026" theme="primary" />
        </div>

        {/* TAB BAR */}
        <div className="bg-white px-8 py-4 rounded-[30px] flex items-center gap-4 shadow-sm border border-white mb-12">
          <NavTab label="Overview" icon={<LayoutDashboard size={20} />} active={activeTab === 'Overview'} onClick={() => setActiveTab('Overview')} />
          <NavTab label="Verification" icon={<ShieldCheck size={20} />} active={activeTab === 'Verification'} onClick={() => setActiveTab('Verification')} />
          <NavTab label="My Exams" icon={<BookOpen size={20} />} active={activeTab === 'My Exams'} onClick={() => setActiveTab('My Exams')} />
          <NavTab label="Activity" icon={<Activity size={20} />} active={activeTab === 'Activity'} onClick={() => setActiveTab('Activity')} />
        </div>

        {/* BOTTOM CONTENT GRID - MATCHING FIGMA RATIO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* UPCOMING EXAMS (Wider) */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6 pl-2">
              <h3 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Upcoming Exams</h3>
              <button className="text-[#800000] text-xs font-black uppercase tracking-widest hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              <ExamCard title="Advanced Mathematics Final" code="MATH-401" date="Mar 15, 2026" time="10:00 AM" status="Pending" />
              <ExamCard title="Computer Science Midterm" code="CS-302" date="Mar 20, 2026" time="02:00 PM" status="Verified" />
              <ExamCard title="Physical Science Final" code="PHY-201" date="Apr 05, 2026" time="09:00 AM" status="Verified" />
            </div>
          </div>

          {/* RECENT ACTIVITY (Narrower - In White Box) */}
          <div className="flex flex-col h-full">
            <div className="mb-6 pl-2">
              <h3 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Recent Activity</h3>
            </div>
            <div className="bg-white rounded-[50px] p-10 border border-white shadow-sm flex-grow">
              <div className="space-y-12">
                <ActivityItem icon={<ShieldCheck className="text-emerald-500" size={20} />} title="Identity Verified" time="Mar 5, 11:00 AM" />
                <ActivityItem icon={<CheckCircle2 className="text-red-800" size={20} />} title="Enrolled MATH-401" time="Mar 4, 03:30 PM" />
                <ActivityItem icon={<Clock className="text-red-700" size={20} />} title="Completed PHY-201" time="Feb 28, 11:00 AM" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* EDIT PROFILE MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full shadow-2xl border border-white relative text-left overflow-hidden">
            {/* Close Button */}
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="p-8">
              {/* Header */}
              <h2 className="text-2xl font-extrabold text-gray-900 leading-none">Edit Profile</h2>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                Make changes to your profile information here. Click save when you're done.
              </p>

              <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
                {/* Profile Picture */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Profile Picture</label>
                  <div className="flex items-center gap-4">
                    {editForm.avatar ? (
                      <img
                        src={editForm.avatar}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-white ring-2 ring-red-100"
                      />
                    ) : profile?.avatar ? (
                      <img
                        src={profile.avatar}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-white ring-2 ring-red-100"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#800000] to-[#4d0000] flex items-center justify-center text-white text-xl font-black shadow-md">
                        {initials}
                      </div>
                    )}
                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 text-sm font-bold text-gray-700 transition-colors cursor-pointer"
                      >
                        <Upload size={14} /> Upload Photo
                      </button>
                      <p className="text-[10px] text-gray-400 mt-1.5 ml-1">JPG, PNG or GIF (max. 5MB)</p>
                    </div>
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-[#F3F6FF] border-none rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-[#800000] text-sm font-semibold text-gray-800"
                    placeholder="Full Name"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-[#F3F6FF] border-none rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-[#800000] text-sm font-semibold text-gray-800"
                    placeholder="Email Address"
                    required
                  />
                </div>

                {/* NIC Number */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">NIC Number</label>
                  <input
                    type="text"
                    value={editForm.nic}
                    onChange={(e) => setEditForm({ ...editForm, nic: e.target.value })}
                    className="w-full bg-[#F3F6FF] border-none rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-[#800000] text-sm font-semibold text-gray-800"
                    placeholder="NIC Number"
                    required
                  />
                </div>

                {/* Student ID */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Student ID</label>
                  <input
                    type="text"
                    value={editForm.studentId}
                    className="w-full bg-[#ECEEF2] border-none rounded-xl py-3 px-4 outline-none text-sm font-semibold text-gray-500 cursor-not-allowed"
                    disabled
                  />
                  <p className="text-[10px] text-gray-400 italic ml-1 mt-1">Student ID cannot be changed</p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="border border-gray-200 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="bg-[#800000] hover:bg-[#660000] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-red-100 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />
    </div>
  );
};

// --- FIGMA COMPONENT HELPERS ---

const NavTab = ({ label, icon, active, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-10 py-3.5 rounded-[22px] font-black transition-all ${active ? 'bg-[#800000] text-white shadow-lg shadow-red-100' : 'text-gray-400 hover:text-gray-600'
    }`}>
    {icon} <span className="text-[12px] uppercase tracking-tighter">{label}</span>
  </button>
);

const StatCard = ({ label, val, sub, theme, isStatus }) => {
  const colors = { warning: 'text-amber-500', success: 'text-emerald-500', primary: 'text-[#800000]' };
  return (
    <div className="bg-white p-10 rounded-[45px] border border-white text-left shadow-sm min-h-[190px] flex flex-col justify-center">
      <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{label}</p>
      <p className={`font-black tracking-tighter leading-none ${isStatus ? 'text-3xl' : 'text-5xl'} ${colors[theme]}`}>{val}</p>
      <p className="text-gray-400 text-[11px] font-bold mt-4 opacity-80 uppercase">{sub}</p>
    </div>
  );
};

const ExamCard = ({ title, code, date, time, status }) => (
  <div className="bg-white p-6 rounded-[35px] border border-white flex justify-between items-center text-left hover:shadow-md transition-shadow group">
    <div className="flex items-center gap-6">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${status === 'Pending' ? 'bg-amber-50' : 'bg-red-50'}`}>
        <BookOpen className={status === 'Pending' ? 'text-amber-500' : 'text-[#800000]'} size={24} />
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black text-[#800000] uppercase tracking-widest leading-none mb-1">{code}</p>
        <h4 className="text-lg font-black text-gray-800 leading-tight">{title}</h4>
        <div className="flex gap-4 text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">
          <span className="flex items-center gap-1.5"><Calendar size={12} /> {date}</span>
          <span className="flex items-center gap-1.5"><Clock size={12} /> {time}</span>
        </div>
      </div>
    </div>
    <button className={`p-4 rounded-2xl transition-all ${status === 'Pending' ? 'bg-[#800000] text-white shadow-lg px-8' : 'bg-gray-50 text-gray-400 group-hover:bg-[#800000] group-hover:text-white'}`}>
      {status === 'Pending' ? <span className="text-[10px] font-black uppercase">Verify Now</span> : <ArrowRight size={20} />}
    </button>
  </div>
);

const ActivityItem = ({ icon, title, time }) => (
  <div className="flex items-center gap-6 text-left group">
    <div className="p-4 bg-[#F3F6FF] rounded-[22px] group-hover:bg-red-50 transition-colors">{icon}</div>
    <div className="flex-grow">
      <p className="text-sm font-black text-gray-800 tracking-tight leading-none mb-1.5">{title}</p>
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.15em]">{time}</p>
    </div>
    <ArrowRight size={16} className="text-gray-200" />
  </div>
);

const InfoCol = ({ label, val }) => (
  <div>
    <p className="text-[10px] uppercase font-black tracking-[0.15em] text-gray-400 mb-1">{label}</p>
    <p className="text-[15px] font-black text-gray-800">{val}</p>
  </div>
);

const IconButton = ({ icon, notification }) => (
  <button className="p-3 bg-[#F3F6FF] text-gray-400 rounded-2xl relative hover:text-[#800000] transition-all">
    {icon}
    {notification && <span className="absolute top-3 right-3.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
  </button>
);

export default Home;
