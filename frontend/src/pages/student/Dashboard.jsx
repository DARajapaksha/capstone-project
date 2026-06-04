import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';
import { ref, onValue } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebase/firebase';
import { Calendar, CheckCircle, Clock, Award, User, Mail, CreditCard, FileText, ShieldCheck, ShieldAlert, Edit2, Plus, Zap, X, Upload } from 'lucide-react';
import AvailableExams from './AvailableExams';
import MyExamsTab from './MyExamsTab';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAvailableExams, setShowAvailableExams] = useState(false);
  const navigate = useNavigate();
  const { profile, updateProfile, editModalOpen, setEditModalOpen } = useProfile();
  const [savingProfile, setSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', nic: '', studentId: '', avatar: '' });
  const fileInputRef = useRef(null);
  const tabRefs = useRef({});
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });

  // Real-time data from Firebase
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) {
      setPillStyle({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [activeTab]);

  // Real-time: Upcoming Exams from Enrollments joined with Exams
  useEffect(() => {
    const auth = getAuth();
    let unsubEnrollments = null;
    let unsubExams = null;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) { setLoadingExams(false); return; }

      const enrollmentsRef = ref(db, `Enrollments/${user.uid}`);
      unsubEnrollments = onValue(enrollmentsRef, (enrollSnap) => {
        if (!enrollSnap.exists()) { setUpcomingExams([]); setLoadingExams(false); return; }
        const enrollments = enrollSnap.val();
        const examIds = Object.keys(enrollments);

        const examsRef = ref(db, 'Exams');
        unsubExams = onValue(examsRef, (examsSnap) => {
          setLoadingExams(false);
          const allExams = examsSnap.exists() ? examsSnap.val() : {};
          const joined = examIds
            .filter(examId => allExams[examId])
            .map(examId => {
            const enrollment = enrollments[examId];
            const exam = allExams[examId];
            const statusVal = enrollment.verificationStatus || 'pending';
            const verified = statusVal === 'verified';
            const rejected = statusVal === 'rejected';
            const underReview = statusVal === 'review';

            let statusText = 'Verify Required';
            let statusColor = 'bg-[#F0B100] text-white';
            let borderColor = 'border-[#FFDF20]';
            let Icon = ShieldAlert;

            if (verified) {
              statusText = 'Verified';
              statusColor = 'bg-[#00C950] text-white';
              borderColor = 'border-gray-200';
              Icon = ShieldCheck;
            } else if (underReview) {
              statusText = 'Pending Review';
              statusColor = 'bg-[#3B82F6] text-white';
              borderColor = 'border-[#93C5FD]';
              Icon = Clock;
            } else if (rejected) {
              statusText = 'Verification Rejected';
              statusColor = 'bg-[#DC2626] text-white';
              borderColor = 'border-[#DC2626]';
              Icon = ShieldAlert;
            }

            return {
              id: examId,
              title: exam.courseName || 'Unknown Exam',
              code: exam.courseCode || examId,
              date: exam.date || 'TBD',
              time: exam.time || 'TBD',
              status: statusText,
              statusColor: statusColor,
              borderColor: borderColor,
              statusIcon: Icon,
              actionIcon: Icon,
              isVerified: verified,
              isUnderReview: underReview,
              txHash: profile?.blockchainTxHash || null
            };
          });
          joined.sort((a, b) => new Date(a.date) - new Date(b.date));
          setUpcomingExams(joined);
        });
      });
    });

    return () => {
      unsubAuth();
      if (unsubEnrollments) unsubEnrollments();
      if (unsubExams) unsubExams();
    };
  }, []);

  // Real-time: Recent Activity from Audit_Log filtered by current user
  useEffect(() => {
    const auth = getAuth();
    let unsubAudit = null;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) { setLoadingActivity(false); return; }

      const auditRef = ref(db, 'Audit_Log');
      unsubAudit = onValue(auditRef, (snap) => {
        setLoadingActivity(false);
        if (!snap.exists()) { setActivities([]); return; }
        const all = snap.val();
        const userLogs = Object.values(all)
          .filter(log => log.userId === user.uid)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5)
          .map(log => {
            const event = (log.event || '').toLowerCase();
            let icon = FileText, color = 'text-blue-600';
            if (event.includes('fail') || event.includes('reject')) { icon = ShieldAlert; color = 'text-red-600'; }
            else if (event.includes('verif') || event.includes('complet')) { icon = CheckCircle; color = 'text-green-600'; }
            else if (event.includes('profile')) { icon = User; color = 'text-purple-600'; }
            const ts = log.timestamp ? new Date(log.timestamp) : null;
            const dateStr = ts
              ? ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                + ' ' + ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              : '';
            return { action: log.event || 'Activity', date: dateStr, icon, color };
          });
        setActivities(userLogs);
      });
    });

    return () => {
      unsubAuth();
      if (unsubAudit) unsubAudit();
    };
  }, []);


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

  const stats = [
    { icon: Calendar, label: 'Total Exams', value: '12', color: 'text-blue-600', borderColor: 'border-l-green-500' },
    { icon: CheckCircle, label: 'Completed', value: '8', color: 'text-green-600', borderColor: 'border-l-purple-500' },
    { icon: Clock, label: 'Pending', value: '4', color: 'text-orange-600', borderColor: 'border-l-orange-500' },
    { icon: Award, label: 'Average Score', value: '85%', color: 'text-purple-600', borderColor: 'border-l-blue-500' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
            {/* Left Column: Upcoming Exams */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar size={18} className="text-gray-500" /> Upcoming Exams
                </h3>
                <p className="text-sm text-gray-500 mt-1">Your scheduled examinations</p>
              </div>
              <div className="space-y-4">
                {loadingExams ? (
                  <p className="text-sm text-gray-400 text-center py-6">Loading exams…</p>
                ) : upcomingExams.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No enrolled exams yet.</p>
                  </div>
                ) : upcomingExams.map((exam) => (
                  <div key={exam.id} className={`p-4 border-2 rounded-lg ${exam.borderColor}`}>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="font-semibold text-gray-900">{exam.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{exam.code}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ECEEF2] text-gray-700">
                          Upcoming
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${exam.statusColor}`}>
                          <exam.statusIcon size={12} />
                          {exam.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                      <Calendar size={16} className="text-gray-500" />
                      <span>{exam.date} • {exam.time}</span>
                    </div>

                    {exam.isVerified && exam.txHash && (
                      <div className="mt-2 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500 font-medium mb-1">Blockchain Tx Hash:</p>
                        <a href={`https://amoy.polygonscan.com/tx/${exam.txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-indigo-600 hover:text-indigo-800 break-all underline flex items-center gap-1">
                          {exam.txHash}
                        </a>
                      </div>
                    )}

                    {!exam.isVerified && !exam.isUnderReview && (
                      <button
                        onClick={() => navigate('/verification', { state: { examId: exam.id, examCode: exam.code } })}
                        className="w-full px-4 py-2 bg-[#5B47FB] text-white rounded-lg font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
                      >
                        <exam.actionIcon size={16} />
                        {exam.status === 'Verification Rejected' ? 'Retry Verification for this Exam' : 'Verify Identity for this Exam'}
                      </button>
                    )}
                    {exam.isUnderReview && (
                      <div className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium border border-blue-100 flex items-center justify-center gap-2 text-sm">
                        <Clock size={16} />
                        Awaiting Manual Review
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Recent Activity */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <p className="text-sm text-gray-500 mt-1">Your latest actions</p>
              </div>
              <div className="space-y-3">
                {loadingActivity ? (
                  <p className="text-sm text-gray-400 text-center py-6">Loading activity…</p>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Clock size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No recent activity yet.</p>
                  </div>
                ) : activities.map((activity, index) => (
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
        return <MyExamsTab />;
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
        <div className="space-y-5">

          {/* ── Profile Card ── */}
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            {/* Top row: avatar + name + buttons */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
              <div className="flex items-center gap-4">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Profile" className="w-20 h-20 rounded-full object-cover shrink-0 shadow" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#5B47FB] to-[#9333ea] flex items-center justify-center shrink-0 shadow-md">
                    <span className="text-white text-2xl font-black tracking-tight">{initials}</span>
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">{profile.name}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Student ID: {profile.studentId}</p>
                </div>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:pt-1">
                <button
                  onClick={handleOpenEditModal}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition cursor-pointer"
                >
                  <Edit2 size={15} />
                  Edit Profile
                </button>
                <button
                  onClick={() => setShowAvailableExams(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#5B47FB] text-white rounded-lg text-sm font-medium hover:opacity-90 transition"
                >
                  <Plus size={15} />
                  Enroll in Exam
                </button>
              </div>
            </div>

            {/* Info row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                <Mail size={18} className="text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium">Email</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{profile.email}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                <CreditCard size={18} className="text-purple-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium">NIC Number</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{profile.nic}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                <Calendar size={18} className="text-green-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium">Enrolled Since</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{profile.enrolledSince}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(() => {
              const totalEnrolled = upcomingExams.length;
              const needVerification = upcomingExams.filter(e => e.status === 'Verify Required').length;
              const nextExam = upcomingExams.length > 0 ? upcomingExams[0] : null;
              
              let nextExamDate = 'None';
              let nextExamName = 'No upcoming exams';
              if (nextExam) {
                const d = new Date(nextExam.date);
                if (!isNaN(d.getTime())) {
                  nextExamDate = `Next: ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                } else {
                  nextExamDate = `Next: ${nextExam.date}`;
                }
                nextExamName = nextExam.title;
              }
              
              const isFullyVerified = totalEnrolled > 0 && needVerification === 0;
              const vStatusText = totalEnrolled === 0 ? 'No Exams' : isFullyVerified ? 'Verified' : 'Pending';
              const vStatusBg = totalEnrolled === 0 ? 'bg-gray-100 text-gray-700' : isFullyVerified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700';
              const VIcon = totalEnrolled === 0 ? ShieldCheck : isFullyVerified ? CheckCircle : ShieldAlert;

              return (
                <>
                  {/* Verification Status */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-green-400">
                    <p className="text-xs text-gray-500 font-medium mb-3">Verification Status</p>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mb-3 ${vStatusBg}`}>
                      <VIcon size={12} /> {vStatusText}
                    </span>
                    <p className="text-xs text-gray-500">
                      {totalEnrolled === 0 ? "Enroll to start" : isFullyVerified ? "All clear!" : "Action needed"}
                    </p>
                  </div>

                  {/* Enrolled Exams */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-blue-400">
                    <p className="text-xs text-gray-500 font-medium mb-2">Enrolled Exams</p>
                    <div className="flex items-center justify-between">
                      <p className="text-3xl font-bold text-gray-900">{totalEnrolled}</p>
                      <FileText size={22} className="text-blue-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{needVerification} need verification</p>
                  </div>

                  {/* Completed Exams */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-purple-400">
                    <p className="text-xs text-gray-500 font-medium mb-2">Completed Exams</p>
                    <div className="flex items-center justify-between">
                      <p className="text-3xl font-bold text-gray-900">0</p>
                      <Award size={22} className="text-purple-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Avg. Score: 0%</p>
                  </div>

                  {/* Upcoming */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-orange-400">
                    <p className="text-xs text-gray-500 font-medium mb-2">Upcoming</p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-gray-900 leading-tight truncate pr-2">{nextExamDate}</p>
                      <Clock size={22} className="text-orange-400 shrink-0" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2 truncate">{nextExamName}</p>
                  </div>
                </>
              );
            })()}
          </div>

          {/* ── Tab Nav ── */}
          <nav className="relative flex bg-gray-100 rounded-2xl p-1 w-fit">
            {/* Sliding white pill */}
            <span
              aria-hidden
              style={{
                position: 'absolute',
                top: 4,
                bottom: 4,
                left: pillStyle.left,
                width: pillStyle.width,
                transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1), width 0.25s cubic-bezier(0.4,0,0.2,1)',
                background: 'white',
                borderRadius: '0.75rem',
                boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
            {tabs.map(tab => (
              <button
                key={tab.id}
                ref={el => { tabRefs.current[tab.id] = el; }}
                onClick={() => {
                  if (tab.id === 'available') {
                    navigate('/verification');
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className={`relative z-10 px-4 py-2 text-sm font-medium rounded-xl transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
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

export default Dashboard;
