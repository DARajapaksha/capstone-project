import { ShieldCheck, BookOpen, CheckCircle, AlertCircle, X, Bell } from 'lucide-react';

const notifications = [
  { id: 1, type: 'verification', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50', title: 'Identity Verified', body: 'Your identity has been successfully verified.', time: '2h ago', read: false },
  { id: 2, type: 'exam', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50', title: 'Exam Reminder', body: 'MATH-401 is in 24 hours. Make sure you\'re prepared!', time: '5h ago', read: false },
  { id: 3, type: 'enrollment', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50', title: 'Enrolled in CS-302', body: 'You have successfully enrolled in Computer Science Midterm.', time: '2d ago', read: true },
  { id: 4, type: 'exam', icon: CheckCircle, color: 'text-purple-500', bg: 'bg-purple-50', title: 'PHY-201 Results Ready', body: 'Your Physics Lab Exam results are now available. Score: 92%', time: '5d ago', read: true },
  { id: 5, type: 'system', icon: Bell, color: 'text-gray-500', bg: 'bg-gray-50', title: 'System Maintenance', body: 'Scheduled maintenance on May 20, 2026 from 2-4 AM.', time: '1w ago', read: true },
];

const NotificationsDrawer = ({ open, onClose }) => {
  if (!open) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/20" />
      <div
        className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-xs text-indigo-600 font-medium mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition text-gray-500">
            <X size={18} />
          </button>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {notifications.map(n => {
            const Icon = n.icon;
            return (
              <div key={n.id} className={`flex items-start gap-3 p-4 hover:bg-gray-50 transition cursor-pointer ${!n.read ? 'bg-indigo-50/40' : ''}`}>
                <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${n.bg} flex items-center justify-center`}>
                  <Icon size={16} className={n.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${!n.read ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                    {!n.read && <span className="flex-shrink-0 w-2 h-2 bg-indigo-500 rounded-full mt-1.5" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <button className="w-full py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-xl transition">
            Mark all as read
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationsDrawer;
