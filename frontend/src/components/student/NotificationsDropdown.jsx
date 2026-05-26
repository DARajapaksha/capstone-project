import { useState, useRef, useEffect } from 'react';
import { ShieldAlert, Bell, CheckCircle2 } from 'lucide-react';

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    type: 'warning',
    icon: ShieldAlert,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    title: 'Verification Required',
    body: 'Your identity verification is required for MATH-401 Final Exam',
    time: '2 hours ago',
    read: false
  },
  {
    id: 2,
    type: 'info',
    icon: Bell,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    title: 'Exam Reminder',
    body: 'CS-302 Midterm exam starts in 3 days',
    time: '5 hours ago',
    read: false
  },
  {
    id: 3,
    type: 'success',
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    title: 'Verification Successful',
    body: 'Your identity has been verified for CS-302',
    time: '1 day ago',
    read: true
  }
];

const NotificationsDropdown = ({ onClose, onUnreadChange }) => {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
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

  const markOneRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    onUnreadChange?.(updated.filter(n => !n.read).length);
  };

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    onUnreadChange?.(0);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
        {notifications.map(n => {
          const Icon = n.icon;
          return (
            <div
              key={n.id}
              onClick={() => markOneRead(n.id)}
              className="flex items-start gap-4 p-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
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
              {!n.read && (
                <span className="flex-shrink-0 w-2.5 h-2.5 bg-[#5D5FEF] rounded-full self-center" />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-50">
        <button
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="w-full py-3.5 text-center text-xs font-bold text-slate-700 hover:text-slate-900 disabled:text-slate-400 hover:bg-slate-50 transition-all cursor-pointer"
        >
          {unreadCount === 0 ? 'All caught up ✓' : 'Mark all as read'}
        </button>
      </div>
    </div>
  );
};

export default NotificationsDropdown;
