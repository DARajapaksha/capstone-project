import { auth } from "../firebase/firebase";
import { signOut } from "firebase/auth";
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Bell, Settings, LogOut, Edit3, Calendar,
  CheckCircle2, Clock, ArrowRight, BookOpen, Activity, LayoutDashboard, X, Upload, Award,
  User, Edit2, CheckCircle, Mail, CreditCard, FileText, ShieldAlert
} from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';
import NotificationsDropdown from '../components/student/NotificationsDropdown';
import SettingsDropdown from '../components/student/SettingsDropdown';

const parseDateSafe = (dateStr) => {
  if (!dateStr) return new Date();
  const parts = dateStr.trim().split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed month
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
};

const Home = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const { profile, updateProfile, editModalOpen, setEditModalOpen, unreadCount } = useProfile();
  const [savingProfile, setSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', nic: '', studentId: '', avatar: '' });
  const fileInputRef = useRef(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'AJ';

  const [activities, setActivities] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [stats, setStats] = useState({ enrolledCount: 0, completedCount: 0, nextExam: 'None' });
  const [verificationStatus, setVerificationStatus] = useState('Not Submitted');

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEventDetails = (event) => {
    if (event && event.startsWith('Enrolled in')) {
      return {
        action: event,
        icon: FileText,
        color: 'text-blue-600'
      };
    }
    switch (event) {
      case 'login':
        return {
          action: 'Login Successful',
          icon: User,
          color: 'text-indigo-600'
        };
      case 'Profile Updated':
        return {
          action: 'Profile Updated',
          icon: Edit2,
          color: 'text-purple-600'
        };
      default:
        return {
          action: event || 'User Action',
          icon: CheckCircle,
          color: 'text-green-600'
        };
    }
  };

  const loadActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        
        if (data.recentActivity) {
          const filtered = data.recentActivity.filter(item => item.event !== 'Images Uploaded');
          const mapped = filtered.map(item => {
            const details = getEventDetails(item.event);
            return {
              action: details.action,
              date: formatTimestamp(item.timestamp),
              icon: details.icon,
              color: details.color
            };
          });
          setActivities(mapped);
        }

        if (data.verificationStatus) {
          setVerificationStatus(data.verificationStatus);
        }

        if (data.upcomingExams) {
          setUpcomingExams(data.upcomingExams);
        }

        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

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

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
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
        loadActivities();
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
          <div className="bg-[#5D5FEF] p-2.5 rounded-[15px] shadow-lg shadow-indigo-100">
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
              className="p-3 bg-[#F3F6FF] text-gray-400 rounded-2xl relative hover:text-[#5D5FEF] transition-all cursor-pointer"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-3 right-3.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            {notifOpen && (
              <NotificationsDropdown
                onClose={() => setNotifOpen(false)}
              />
            )}
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="p-3 bg-[#F3F6FF] text-gray-400 rounded-2xl relative hover:text-[#5D5FEF] transition-all cursor-pointer"
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
        <section className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm mb-10 text-left">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {profile?.avatar ? (
              <img src={profile.avatar} alt="Profile" className="w-24 h-24 rounded-full object-cover shadow-md border-2 border-white" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-md border-2 border-white">
                {initials}
              </div>
            )}
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">{profile?.name || ''}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Student ID: {profile?.studentId || ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleOpenEditModal} className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition cursor-pointer shadow-sm">
                    <Edit2 size={16} />
                    Edit Profile
                  </button>
                  <button onClick={() => navigate('/student/available')} className="flex items-center gap-2 px-4 py-2 bg-[#5B47FB] text-white rounded-xl text-sm font-medium hover:opacity-90 transition cursor-pointer shadow-sm">
                    <BookOpen size={16} />
                    Enroll in Exam
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-gray-100 flex items-center gap-3">
                  <Mail size={18} className="text-blue-600" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Email</p>
                    <p className="text-sm font-medium text-gray-800 break-all">{profile?.email || ''}</p>
                  </div>
                </div>

                <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-gray-100 flex items-center gap-3">
                  <CreditCard size={18} className="text-purple-600" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">NIC Number</p>
                    <p className="text-sm font-medium text-gray-800">{profile?.nic || ''}</p>
                  </div>
                </div>

                <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-gray-100 flex items-center gap-3">
                  <Calendar size={18} className="text-blue-600" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Enrolled Since</p>
                    <p className="text-sm font-medium text-gray-800">{profile?.enrolledSince || ''}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <StatCard 
            label="Verification Status" 
            sub={verificationStatus === 'Verified' || verificationStatus === 'Approved' ? 'Identity verified' : 'Action required'} 
            theme={verificationStatus === 'Verified' || verificationStatus === 'Approved' ? 'green' : (verificationStatus === 'Pending' ? 'orange' : 'blue')}
          >
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] text-xs font-extrabold shadow-sm ${
              verificationStatus === 'Verified' || verificationStatus === 'Approved'
                ? 'bg-[#00CA71] text-white shadow-[#00CA71]/20'
                : (verificationStatus === 'Pending' ? 'bg-[#F0B100] text-white shadow-amber-500/20' : 'bg-slate-200 text-slate-700')
            }`}>
              {verificationStatus === 'Verified' || verificationStatus === 'Approved' ? (
                <CheckCircle2 size={13} className="text-white" />
              ) : (
                <ShieldAlert size={13} />
              )}
              <span>{verificationStatus}</span>
            </div>
          </StatCard>
          <StatCard label="Enrolled Exams" sub={`${stats.enrolledCount} active`} theme="blue" icon={BookOpen}>
            <span className="text-2xl font-black text-gray-800 tracking-tight">{stats.enrolledCount}</span>
          </StatCard>
          <StatCard label="Completed Exams" sub={`${stats.completedCount} finished`} theme="purple" icon={Award}>
            <span className="text-2xl font-black text-gray-800 tracking-tight">{stats.completedCount}</span>
          </StatCard>
          <StatCard label="Upcoming" sub={stats.nextExam !== 'None' ? 'Next exam scheduled' : 'No upcoming exams'} theme="orange" icon={Clock}>
            <span className="text-sm font-black text-gray-800 tracking-tight">{stats.nextExam}</span>
          </StatCard>
        </div>

        {/* TAB BAR */}
        <div className="bg-white px-8 py-4 rounded-[30px] flex items-center gap-4 shadow-sm border border-white mb-12">
          <NavTab label="Overview" icon={<LayoutDashboard size={20} />} active={activeTab === 'Overview'} onClick={() => setActiveTab('Overview')} />
          <NavTab label="Verification" icon={<ShieldCheck size={20} />} active={activeTab === 'Verification'} onClick={() => setActiveTab('Verification')} />
          <NavTab label="My Exams" icon={<BookOpen size={20} />} active={activeTab === 'My Exams'} onClick={() => {
            setActiveTab('My Exams');
            navigate('/student/my-exams');
          }} />
          <NavTab label="Activity" icon={<Activity size={20} />} active={activeTab === 'Activity'} onClick={() => {
            setActiveTab('Activity');
            navigate('/student/activity');
          }} />
        </div>

        {/* BOTTOM CONTENT GRID - MATCHING FIGMA RATIO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* UPCOMING EXAMS (Wider) */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6 pl-2">
              <h3 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Upcoming Exams</h3>
              <button onClick={() => navigate('/student/my-exams')} className="text-[#5D5FEF] text-xs font-black uppercase tracking-widest hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              {upcomingExams.length > 0 ? (
                upcomingExams.map((exam, index) => {
                  const getExamFullDate = (exam) => {
                    const d = parseDateSafe(exam.date);
                    if (exam.time) {
                      const timeMatch = exam.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
                      if (timeMatch) {
                        let hours = parseInt(timeMatch[1], 10);
                        const minutes = parseInt(timeMatch[2], 10);
                        const ampm = timeMatch[3].toUpperCase();
                        if (ampm === 'PM' && hours < 12) hours += 12;
                        if (ampm === 'AM' && hours === 12) hours = 0;
                        d.setHours(hours, minutes, 0, 0);
                      }
                    }
                    return d;
                  };

                  const examFullDate = getExamFullDate(exam);
                  const now = new Date();
                  const isMissed = examFullDate < now && exam.verificationStatus !== 'verified';
                  const statusText = isMissed ? 'Verification Missed' : (exam.verificationStatus === 'verified' ? 'Verified' : 'Pending');

                  return (
                    <ExamCard
                      key={exam.id || index}
                      title={exam.courseName}
                      code={exam.courseCode}
                      date={parseDateSafe(exam.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      time={exam.time}
                      status={statusText}
                      isMissed={isMissed}
                      onVerify={() => navigate('/verification', { state: { from: '/home' } })}
                    />
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-400 bg-white rounded-[35px] border border-white">
                  No upcoming exams scheduled.
                </div>
              )}
            </div>
          </div>

          {/* RECENT ACTIVITY (Narrower - In White Box) */}
          <div className="flex flex-col h-full">
            <div className="mb-6 pl-2">
              <h3 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Recent Activity</h3>
            </div>
            <div className="bg-white rounded-[50px] p-10 border border-white shadow-sm flex-grow">
              <div className="space-y-12">
                {activities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <ActivityItem
                      key={index}
                      icon={<Icon className={activity.color} size={20} />}
                      title={activity.action}
                      time={activity.date}
                    />
                  );
                })}
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
                        className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-white ring-2 ring-indigo-100"
                      />
                    ) : profile?.avatar ? (
                      <img
                        src={profile.avatar}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-white ring-2 ring-indigo-100"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#5D5FEF] to-[#7c3aed] flex items-center justify-center text-white text-xl font-black shadow-md">
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
                    className="w-full bg-[#F3F6FF] border-none rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-[#5D5FEF] text-sm font-semibold text-gray-800"
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
                    className="w-full bg-[#F3F6FF] border-none rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-[#5D5FEF] text-sm font-semibold text-gray-800"
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
                    className="w-full bg-[#F3F6FF] border-none rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-[#5D5FEF] text-sm font-semibold text-gray-800"
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
                    className="bg-[#5D5FEF] hover:bg-[#4B4DDB] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-100 transition-colors disabled:opacity-50 cursor-pointer"
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
  <button onClick={onClick} className={`flex items-center gap-3 px-10 py-3.5 rounded-[22px] font-black transition-all ${active ? 'bg-[#5D5FEF] text-white shadow-lg shadow-indigo-100' : 'text-gray-400 hover:text-gray-600'
    }`}>
    {icon} <span className="text-[12px] uppercase tracking-tighter">{label}</span>
  </button>
);

const StatCard = ({ label, sub, theme, icon: Icon, children }) => {
  const themeClasses = {
    green: {
      border: 'border-[#10B981]/25 border-l-[5px] border-l-[#10B981]',
      text: 'text-[#10B981]',
    },
    blue: {
      border: 'border-[#3B82F6]/25 border-l-[5px] border-l-[#3B82F6]',
      text: 'text-[#3B82F6]',
    },
    purple: {
      border: 'border-[#A855F7]/25 border-l-[5px] border-l-[#A855F7]',
      text: 'text-[#A855F7]',
    },
    orange: {
      border: 'border-[#F97316]/25 border-l-[5px] border-l-[#F97316]',
      text: 'text-[#F97316]',
    }
  };

  const currentTheme = themeClasses[theme] || themeClasses.blue;

  return (
    <div className={`bg-white p-6 rounded-[20px] border ${currentTheme.border} text-left shadow-sm min-h-[145px] flex flex-col justify-between`}>
      <p className="text-gray-400 text-sm font-semibold leading-none mb-1">{label}</p>
      <div className="flex items-center justify-between w-full my-1">
        {children}
        {Icon && <Icon className={`${currentTheme.text} w-6 h-6`} />}
      </div>
      <p className="text-gray-400 text-xs font-normal leading-none">{sub}</p>
    </div>
  );
};

const ExamCard = ({ title, code, date, time, status, isMissed, onVerify }) => {
  const showVerifyBtn = status === 'Pending' && !isMissed;
  const cardBorder = isMissed ? 'border-red-500 shadow-md shadow-red-50' : 'border-white';
  const iconBg = isMissed ? 'bg-red-50' : (status === 'Pending' ? 'bg-amber-50' : 'bg-indigo-50');
  const iconColor = isMissed ? 'text-red-500' : (status === 'Pending' ? 'text-amber-500' : 'text-[#5D5FEF]');

  return (
    <div className={`bg-white p-6 rounded-[35px] border ${cardBorder} flex flex-col gap-4 text-left hover:shadow-md transition-shadow group`}>
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${iconBg}`}>
            <BookOpen className={iconColor} size={24} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-[#5D5FEF] uppercase tracking-widest leading-none mb-1">{code}</p>
            <h4 className="text-lg font-black text-gray-800 leading-tight">{title}</h4>
            <div className="flex gap-4 text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">
              <span className="flex items-center gap-1.5"><Calendar size={12} /> {date}</span>
              <span className="flex items-center gap-1.5"><Clock size={12} /> {time}</span>
            </div>
          </div>
        </div>
        {showVerifyBtn && (
          <button onClick={onVerify} className="p-4 rounded-2xl transition-all bg-[#5D5FEF] text-white shadow-lg px-8 cursor-pointer">
            <span className="text-[10px] font-black uppercase">Verify Now</span>
          </button>
        )}
        {!showVerifyBtn && !isMissed && (
          <button className="p-4 rounded-2xl transition-all bg-gray-50 text-gray-400 group-hover:bg-[#5D5FEF] group-hover:text-white">
            <ArrowRight size={20} />
          </button>
        )}
      </div>
      {isMissed && (
        <div className="bg-red-50 text-red-700 text-xs font-semibold p-3 rounded-lg border border-red-200 flex items-center gap-2">
          <ShieldAlert size={14} className="text-red-500" />
          <span>Identity verification was not completed for this exam. Registration is suspended.</span>
        </div>
      )}
    </div>
  );
};

const ActivityItem = ({ icon, title, time }) => (
  <div className="flex items-center gap-6 text-left group">
    <div className="p-4 bg-[#F3F6FF] rounded-[22px] group-hover:bg-indigo-50 transition-colors">{icon}</div>
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
  <button className="p-3 bg-[#F3F6FF] text-gray-400 rounded-2xl relative hover:text-[#5D5FEF] transition-all">
    {icon}
    {notification && <span className="absolute top-3 right-3.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
  </button>
);

export default Home;
