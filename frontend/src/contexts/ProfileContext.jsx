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
};

function loadProfile() {
  try {
    const saved = localStorage.getItem('studentProfile');
    return saved ? { ...DEFAULT_PROFILE, ...JSON.parse(saved) } : { ...DEFAULT_PROFILE };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

const ProfileContext = createContext(null);

export const ProfileProvider = ({ children }) => {
  const [profile, setProfileState] = useState(() => {
    const p = loadProfile();
    return { ...p, email: auth.currentUser?.email || p.email };
  });

  const updateProfile = (updates) => {
    const updated = { ...profile, ...updates };
    setProfileState(updated);
    localStorage.setItem('studentProfile', JSON.stringify(updated));
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
