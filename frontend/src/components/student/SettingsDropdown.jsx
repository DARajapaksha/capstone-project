import { useRef, useEffect } from 'react';
import { User, Bell, Shield, LogOut } from 'lucide-react';

const SettingsDropdown = ({ onClose, onEditProfile, onOpenNotifications, onLogout }) => {
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

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-full mt-3 w-64 bg-white rounded-3xl shadow-xl border border-gray-100 z-50 text-left overflow-hidden p-6"
    >
      <h3 className="font-extrabold text-[#1A1A1A] text-base tracking-tight mb-4 px-1">Settings</h3>
      
      <div className="space-y-1">
        <button
          onClick={() => {
            onEditProfile();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 hover:text-slate-900 text-sm font-semibold cursor-pointer text-left"
        >
          <User size={16} className="text-slate-500" />
          <span>Edit Profile</span>
        </button>

        <button
          onClick={() => {
            onOpenNotifications();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 hover:text-slate-900 text-sm font-semibold cursor-pointer text-left"
        >
          <Bell size={16} className="text-slate-500" />
          <span>Notifications</span>
        </button>

        <button
          onClick={() => {
            alert('Privacy & Security settings are managed by your administrator.');
            onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 hover:text-slate-900 text-sm font-semibold cursor-pointer text-left"
        >
          <Shield size={16} className="text-slate-500" />
          <span>Privacy & Security</span>
        </button>
      </div>

      <div className="border-t border-gray-100 my-3" />

      <button
        onClick={() => {
          onLogout();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors text-red-500 text-sm font-bold cursor-pointer text-left"
      >
        <LogOut size={16} />
        <span>Logout</span>
      </button>
    </div>
  );
};

export default SettingsDropdown;
