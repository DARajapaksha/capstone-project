import { createContext, useContext, useState, useEffect } from 'react';

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

const ProfileContext = createContext(null);

export const ProfileProvider = ({ children }) => {
  const [profile, setProfileState] = useState(() => {
    return loadProfile();
  });

  const refreshProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:3000/api/user/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setProfileState(prev => {
            const updated = {
              ...prev,
              name: data.profile.name || prev.name,
              email: data.profile.email || prev.email,
              nic: data.profile.nic || prev.nic
            };
            localStorage.setItem('studentProfile', JSON.stringify(updated));
            return updated;
          });
        }
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const updateProfile = (updates) => {
    const updated = { ...profile, ...updates };
    setProfileState(updated);
    localStorage.setItem('studentProfile', JSON.stringify(updated));
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
