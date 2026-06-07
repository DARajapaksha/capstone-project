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

  const refreshProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`http://${window.location.hostname}:5000/api/user/dashboard`, {
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

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, refreshProfile, editModalOpen, setEditModalOpen }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
