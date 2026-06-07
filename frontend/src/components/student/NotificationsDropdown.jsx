import { useState, useRef, useEffect } from 'react';
import { ShieldAlert, Bell, CheckCircle2 } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase/firebase';
import { useNavigate } from 'react-router-dom';

const NotificationsDropdown = ({ onClose, onUnreadChange }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('readNotifs')) || [];
    } catch {
      return [];
    }
  });
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  // Fetch notifications from REST API
  useEffect(() => {
    const auth = getAuth();
    
    // Use onAuthStateChanged to ensure we wait for Firebase to initialize the user on reload
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      const token = localStorage.getItem('token');

      if (!user || !token) {
        setNotifications([]);
        onUnreadChange?.(0);
        return;
      }

      try {
        const response = await fetch(`http://${window.location.hostname}:5000/api/user/home`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          let generatedNotifs = [];

          // Add Login notification
          const lastSignIn = user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime) : new Date();
          generatedNotifs.push({
            id: `login-${lastSignIn.getTime()}`,
            type: 'info',
            icon: CheckCircle2,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
            title: 'Login Successful',
            body: 'You have successfully logged into the system.',
            time: 'Recently',
            timestamp: lastSignIn.getTime(),
            actionUrl: '/student/dashboard' // Changed from /dashboard
          });

          // Process Enrolled Exams (Upcoming)
          const upcomingExams = data.myExams?.upcoming || [];
          upcomingExams.forEach(exam => {
            const examId = exam.id;
            const examName = exam.courseCode || exam.courseName || 'Exam';
            const verified = (exam.verificationStatus || 'pending') === 'verified';

            // Verification notification
            if (verified) {
              generatedNotifs.push({
                id: `${examId}-verified`,
                type: 'success',
                icon: CheckCircle2,
                color: 'text-emerald-500',
                bg: 'bg-emerald-50',
                title: 'Verification Successful',
                body: `Your identity has been verified for ${examName}`,
                time: 'Recently',
                timestamp: new Date(exam.enrolledAt || Date.now()).getTime() + 1000,
                actionUrl: '/student/dashboard'
              });
            } else {
              generatedNotifs.push({
                id: `${examId}-pending`,
                type: 'warning',
                icon: ShieldAlert,
                color: 'text-amber-500',
                bg: 'bg-amber-50',
                title: 'Verification Required',
                body: `Your identity verification is required for ${examName}`,
                time: 'Action Needed',
                timestamp: new Date(exam.enrolledAt || Date.now()).getTime(),
                actionUrl: '/verification',
                actionState: { examId, examCode: exam.courseCode || examName }
              });
            }

            // Exam Reminder Notification (if in the future)
            if (exam.date) {
              const examDate = new Date(exam.date);
              if (!isNaN(examDate.getTime()) && examDate.getTime() > Date.now()) {
                const daysLeft = Math.ceil((examDate.getTime() - Date.now()) / (1000 * 3600 * 24));
                generatedNotifs.push({
                  id: `${examId}-reminder`,
                  type: 'info',
                  icon: Bell,
                  color: 'text-blue-500',
                  bg: 'bg-blue-50',
                  title: 'Exam Reminder',
                  body: `${examName} starts in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
                  time: exam.date,
                  timestamp: examDate.getTime() - (30 * 24 * 60 * 60 * 1000), // Sort it properly
                  actionUrl: '/student/dashboard'
                });
              }
            }
          });

          // Sort by timestamp descending
          generatedNotifs.sort((a, b) => b.timestamp - a.timestamp);
          setNotifications(generatedNotifs);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    });

    return () => unsubscribe();
  }, []);

  // Update parent with unread count whenever notifications or read status changes
  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;
  useEffect(() => {
    onUnreadChange?.(unreadCount);
  }, [unreadCount, onUnreadChange]);

  const markOneRead = (id) => {
    if (!readIds.includes(id)) {
      const newReadIds = [...readIds, id];
      setReadIds(newReadIds);
      localStorage.setItem('readNotifs', JSON.stringify(newReadIds));
    }
  };

  const handleNotificationClick = (n) => {
    markOneRead(n.id);
    if (n.actionUrl) {
      navigate(n.actionUrl, { state: n.actionState });
      onClose();
    }
  };

  const markAllRead = () => {
    const allIds = notifications.map(n => n.id);
    const newReadIds = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(newReadIds);
    localStorage.setItem('readNotifs', JSON.stringify(newReadIds));
  };

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-full mt-3 w-[360px] bg-white rounded-3xl shadow-xl border border-gray-100 z-50 text-left overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <h3 className="font-extrabold text-[#1A1A1A] text-base tracking-tight">Notifications</h3>
        {unreadCount > 0 && (
          <span className="bg-[#F3F6FF] text-slate-600 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
            {unreadCount} new
          </span>
        )}
      </div>

      {/* Notification Items */}
      <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm font-medium">No notifications yet</div>
        ) : (
          notifications.map(n => {
            const Icon = n.icon;
            const isRead = readIds.includes(n.id);
            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`flex items-start gap-4 p-4 hover:bg-slate-50/50 transition-colors cursor-pointer ${isRead ? 'opacity-60' : ''}`}
              >
                {/* Icon Circle */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full ${n.bg} flex items-center justify-center`}>
                  <Icon size={18} className={n.color} />
                </div>

                {/* Text Info */}
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {n.title}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    {n.body}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                    {n.time}
                  </p>
                </div>

                {/* Unread dot */}
                {!isRead && (
                  <span className="flex-shrink-0 w-2.5 h-2.5 bg-[#5D5FEF] rounded-full self-center" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-50">
        <button
          onClick={markAllRead}
          disabled={unreadCount === 0 || notifications.length === 0}
          className="w-full py-3.5 text-center text-xs font-bold text-slate-700 hover:text-slate-900 disabled:text-slate-400 hover:bg-slate-50 transition-all cursor-pointer"
        >
          {unreadCount === 0 ? 'All caught up ✓' : 'Mark all as read'}
        </button>
      </div>
    </div>
  );
};

export default NotificationsDropdown;
