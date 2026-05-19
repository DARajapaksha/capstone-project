import { createContext, useContext, useState } from 'react';
import { auth } from '../firebase/firebase';

const DEFAULT_PROFILE = {
  name: 'Alex Johnson',
  studentId: 'STU-2026-001',
  email: 'alex.johnson@university.edu',
  nic: '123456789V',
  enrolledSince: 'January 15, 2026',
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

function loadActivities() {
  try {
    const saved = localStorage.getItem('studentActivities');
    return saved ? JSON.parse(saved) : [
      { id: 1, type: 'verification', title: 'Identity Verified', date: 'Mar 5, 2026 11:00 AM' },
      { id: 2, type: 'enrollment', title: 'Enrolled in MATH-401', date: 'Mar 4, 2026 3:30 PM' },
      { id: 3, type: 'exam', title: 'Completed PHY-201 Exam', date: 'Feb 28, 2026 11:00 AM' },
      { id: 4, type: 'profile', title: 'Profile Updated', date: 'Feb 20, 2026 2:16 PM' }
    ];
  } catch {
    return [];
  }
}

const ProfileContext = createContext(null);

export const ProfileProvider = ({ children }) => {
  const [profile, setProfileState] = useState(() => {
    const p = loadProfile();
    return { ...p, email: auth.currentUser?.email || p.email };
  });

  const [activities, setActivities] = useState(loadActivities());

  const updateProfile = (updates) => {
    const updated = { ...profile, ...updates };
    setProfileState(updated);
    localStorage.setItem('studentProfile', JSON.stringify(updated));
    addActivity('Profile Updated', 'profile');
  };

  const addActivity = (title, type) => {
    const newActivity = {
      id: Date.now(),
      type,
      title,
      date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
    };
    const updated = [newActivity, ...activities];
    setActivities(updated);
    localStorage.setItem('studentActivities', JSON.stringify(updated));
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, activities, addActivity }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
