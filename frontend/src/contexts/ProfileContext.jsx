import { createContext, useContext, useState, useEffect } from 'react';

const DEFAULT_PROFILE = {
  name: '',
  studentId: '',
  email: '',
  nic: '',
  enrolledSince: '',
  department: 'Faculty of Computing',
  phone: '+94 77 123 4567',
  avatar: null,
};

function loadProfile() {
  try {
    const saved = localStorage.getItem('studentProfile');
    return saved ? { ...DEFAULT_PROFILE, ...JSON.parse(saved) } : { ...DEFAULT_PROFILE };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`Failed to write to localStorage for key "${key}":`, err);
  }
}

const ProfileContext = createContext(null);

export const ProfileProvider = ({ children }) => {
  const [profile, setProfileState] = useState(() => {
    return loadProfile();
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Shared dashboard state
  const [activities, setActivities] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [enrolledExams, setEnrolledExams] = useState([]);
  const [stats, setStats] = useState({ enrolledCount: 0, completedCount: 0, nextExam: 'None' });
  const [verificationStatus, setVerificationStatus] = useState('Not Submitted');
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const refreshProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoadingDashboard(false);
      return;
    }

    try {
      const response = await fetch(`http://${window.location.hostname}:5000/api/user/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        
        // 1. Profile
        if (data.profile) {
          setProfileState(prev => {
            const updated = {
              ...prev,
              name: data.profile.name || prev.name,
              email: data.profile.email || prev.email,
              nic: data.profile.nic || prev.nic,
              studentId: data.profile.studentId || prev.studentId,
              avatar: data.profile.avatar || prev.avatar,
              phone: data.profile.phone || prev.phone,
              department: data.profile.department || prev.department,
              enrolledSince: data.profile.enrolledSince || prev.enrolledSince
            };
            safeSetItem('studentProfile', JSON.stringify(updated));
            return updated;
          });
        }
        
        // 2. Notifications
        if (data.notifications) {
          const readIds = JSON.parse(localStorage.getItem('readNotificationIds') || '[]');
          const parsed = data.notifications.map(n => ({
            ...n,
            read: n.read || readIds.includes(n.id)
          }));
          setNotifications(parsed);
          setUnreadCount(parsed.filter(n => !n.read).length);
        }

        // 3. Stats and Exams
        if (data.stats) setStats(data.stats);
        if (data.upcomingExams) setUpcomingExams(data.upcomingExams);
        if (data.enrolledExams) setEnrolledExams(data.enrolledExams);
        if (data.verificationStatus) setVerificationStatus(data.verificationStatus);
        
        // 4. Raw recent activities
        if (data.recentActivity) {
          setActivities(data.recentActivity);
        }
      } else {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('studentProfile');
          localStorage.removeItem('studentAvatar');
          window.location.href = '/login';
        }
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const updateProfile = (updates) => {
    const updated = { ...profile, ...updates };
    setProfileState(updated);
    safeSetItem('studentProfile', JSON.stringify(updated));
  };

  const markNotificationAsRead = (id) => {
    const readIds = JSON.parse(localStorage.getItem('readNotificationIds') || '[]');
    if (!readIds.includes(id)) {
      readIds.push(id);
      safeSetItem('readNotificationIds', JSON.stringify(readIds));
    }
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      setUnreadCount(updated.filter(n => !n.read).length);
      return updated;
    });
  };

  const markAllNotificationsAsRead = () => {
    const readIds = JSON.parse(localStorage.getItem('readNotificationIds') || '[]');
    notifications.forEach(n => {
      if (!readIds.includes(n.id)) {
        readIds.push(n.id);
      }
    });
    safeSetItem('readNotificationIds', JSON.stringify(readIds));
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      setUnreadCount(0);
      return updated;
    });
  };

  return (
    <ProfileContext.Provider value={{ 
      profile, 
      updateProfile, 
      refreshProfile, 
      editModalOpen, 
      setEditModalOpen,
      notifications,
      unreadCount,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      activities,
      upcomingExams,
      enrolledExams,
      stats,
      verificationStatus,
      loadingDashboard
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
