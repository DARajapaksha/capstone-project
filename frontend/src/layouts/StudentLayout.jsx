import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import MobileNav from '../components/student/MobileNav';
import NotificationsDropdown from '../components/student/NotificationsDropdown';
import SettingsDropdown from '../components/student/SettingsDropdown';
import { useProfile } from '../contexts/ProfileContext';
import { Bell, LogOut, Menu, Settings } from 'lucide-react';
import logoImg from '../assets/logo.jpg';



const StudentLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2); // 2 unread initially
  const { setEditModalOpen } = useProfile();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Firebase signOut error:', err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('studentProfile');
    localStorage.removeItem('studentAvatar');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <header className="relative -mx-4 sm:-mx-6 lg:-mx-8 flex items-center justify-between bg-white p-4 rounded-xl mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMenuOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-white shadow-sm shrink-0 overflow-hidden">
                  <img src={logoImg} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-semibold text-slate-900 leading-tight">Student Portal</h1>
                  <p className="text-xs text-slate-500 hidden sm:block">Identity Verification System</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer" aria-label="Notifications">
                <Bell size={20} />
                {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />}
              </button>
              {notifOpen && (
                <NotificationsDropdown
                  onClose={() => setNotifOpen(false)}
                  onUnreadChange={(count) => setUnreadCount(count)}
                />
              )}
              <button onClick={() => setSettingsOpen(!settingsOpen)} className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer" aria-label="Settings">
                <Settings size={20} />
              </button>
              {settingsOpen && (
                <SettingsDropdown
                  onClose={() => setSettingsOpen(false)}
                  onEditProfile={() => setEditModalOpen(true)}
                  onOpenNotifications={() => setNotifOpen(true)}
                  onLogout={handleLogout}
                />
              )}
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-white bg-red-800 rounded-xl hover:bg-red-900 shrink-0">
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </header>
          <main>
            <Outlet />
          </main>
        </div>
      </div>
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
};

export default StudentLayout;
