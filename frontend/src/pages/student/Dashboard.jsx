import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';


import { Calendar, CheckCircle, Clock, Award, User, Mail, CreditCard, FileText, ShieldCheck, ShieldAlert, Edit2, Plus, Zap, X, Upload, BookOpen, CheckCircle2 } from 'lucide-react';
import AvailableExams from './AvailableExams';
import MyExamsTab from './MyExamsTab';

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

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'overview');
  const [showAvailableExams, setShowAvailableExams] = useState(false);
  const { 
    profile, 
    updateProfile, 
    editModalOpen, 
    setEditModalOpen,
    activities: rawActivities,
    upcomingExams,
    enrolledExams,
    stats,
    verificationStatus,
    refreshProfile
  } = useProfile();
  const [savingProfile, setSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', nic: '', studentId: '', avatar: '' });
  const fileInputRef = useRef(null);

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'AJ';

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

  const activities = React.useMemo(() => {
    if (!rawActivities) return [];
    const filtered = rawActivities.filter(item => item.event !== 'Images Uploaded');
    return filtered.map(item => {
      const details = getEventDetails(item.event);
      return {
        action: details.action,
        date: formatTimestamp(item.timestamp),
        icon: details.icon,
        color: details.color
      };
    });
  }, [rawActivities]);

  useEffect(() => {
    refreshProfile();
  }, [activeTab]);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state?.activeTab]);

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

      const response = await fetch('http://localhost:3000/api/user/profile', {
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
          localStorage.removeItem('token');
          localStorage.removeItem('studentProfile');
          localStorage.removeItem('studentAvatar');
          navigate('/login');
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


  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'available', label: 'Verification' },
    { id: 'my-exams', label: 'My Exams' },
    { id: 'activity', label: 'Activity' }
  ];
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
            {/* Left Column: Upcoming Exams */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Exams</h3>
                <p className="text-sm text-gray-500 mt-1">Your scheduled examinations</p>
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

                    const statusText = isMissed 
                      ? 'Verification Missed' 
                      : (exam.verificationStatus === 'verified' ? 'Verified' : 'Verify Required');
                    const statusColor = isMissed
                      ? 'bg-red-500 text-white'
                      : (exam.verificationStatus === 'verified' ? 'bg-[#00C950] text-white' : 'bg-[#F0B100] text-white');
                    const borderColor = isMissed
                      ? 'border-red-500 shadow-md shadow-red-50'
                      : (exam.verificationStatus === 'verified' ? 'border-gray-200' : 'border-[#FFDF20]');
                    const actionColor = 'bg-[#5B47FB]';
                    const actionIcon = exam.verificationStatus === 'verified' ? ShieldCheck : ShieldAlert;
                    const statusIcon = isMissed ? ShieldAlert : (exam.verificationStatus === 'verified' ? ShieldCheck : ShieldAlert);

                    return (
                      <div key={exam.id || index} className={`p-4 border-2 rounded-lg ${borderColor}`}>
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div>
                            <p className="font-semibold text-gray-900">{exam.courseName}</p>
                            <p className="text-sm text-gray-600 mt-1">{exam.courseCode}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ECEEF2] text-gray-700">
                              Upcoming
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                              <statusIcon size={12} />
                              {statusText}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                          <Calendar size={16} className="text-gray-500" />
                          <span>
                            {parseDateSafe(exam.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {exam.time} ({exam.duration} hrs)
                          </span>
                        </div>
                        {isMissed && (
                          <div className="bg-red-50 text-red-700 text-xs font-semibold p-3 rounded-lg border border-red-200 mt-2 flex items-center gap-2">
                            <ShieldAlert size={14} className="text-red-500" />
                            <span>Identity verification was not completed for this exam. Registration is suspended.</span>
                          </div>
                        )}
                        {!isMissed && exam.verificationStatus !== 'verified' && (
                          <button
                            onClick={() => navigate('/verification', { state: { from: '/student' } })}
                            className={`w-full px-4 py-2 text-white rounded-lg font-medium hover:opacity-90 transition flex items-center justify-center gap-2 ${actionColor}`}
                          >
                            <actionIcon size={16} />
                            Verify Identity for this Exam
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-lg">
                    No upcoming exams scheduled.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Recent Activity */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <p className="text-sm text-gray-500 mt-1">Your latest actions</p>
              </div>
              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <activity.icon size={20} className={`${activity.color} mt-0.5 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-600 mt-1">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'available':
        return (
          <div className="bg-white p-6 rounded-xl shadow-sm min-h-[400px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-full">
                <Zap size={32} className="text-gray-400" />
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 max-w-sm">
                <p className="text-gray-500 font-medium text-sm">Verification modules are being updated by the team.</p>
              </div>
            </div>
          </div>
        );
      case 'my-exams':
        return <MyExamsTab exams={enrolledExams} />;
      case 'activity':
        return (
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <activity.icon size={20} className={`${activity.color} mt-0.5 flex-shrink-0`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-600 mt-1">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {showAvailableExams ? (
        <AvailableExams onBack={() => setShowAvailableExams(false)} />
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {profile.avatar ? (
                <img src={profile.avatar} alt="Profile" className="w-24 h-24 rounded-full object-cover shadow-md border-2 border-white" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-md border-2 border-white">
                  {initials}
                </div>
              )}
              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="text-left">
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight">{profile.name}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Student ID: {profile.studentId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handleOpenEditModal} className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition cursor-pointer shadow-sm">
                      <Edit2 size={16} />
                      Edit Profile
                    </button>
                    <button
                      onClick={() => setShowAvailableExams(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#5B47FB] text-white rounded-xl text-sm font-medium hover:opacity-90 transition cursor-pointer shadow-sm">
                      <BookOpen size={16} />
                      Enroll in Exam
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-gray-100 flex items-center gap-3">
                    <Mail size={18} className="text-blue-600" />
                    <div className="text-left">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Email</p>
                      <p className="text-sm font-medium text-gray-800 break-all">{profile.email}</p>
                    </div>
                  </div>

                  <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-gray-100 flex items-center gap-3">
                    <CreditCard size={18} className="text-purple-600" />
                    <div className="text-left">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">NIC Number</p>
                      <p className="text-sm font-medium text-gray-800">{profile.nic}</p>
                    </div>
                  </div>

                  <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-gray-100 flex items-center gap-3">
                    <Calendar size={18} className="text-blue-600" />
                    <div className="text-left">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Enrolled Since</p>
                      <p className="text-sm font-medium text-gray-800">{profile.enrolledSince}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <nav className="flex gap-6 border-b border-gray-200 pb-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'available') {
                    navigate('/verification');
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className={`text-sm font-medium transition ${activeTab === tab.id ? 'text-purple-600 border-b-2 border-purple-600 pb-2' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {renderContent()}
        </div>
      )}

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
    </>
  );
};

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

export default Dashboard;