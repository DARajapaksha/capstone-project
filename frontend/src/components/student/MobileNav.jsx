import { Link, useLocation } from 'react-router-dom';
import { X, LayoutDashboard, ClipboardList, FileText, Activity } from 'lucide-react';

const navItems = [
  { to: '/student', label: 'Overview', icon: LayoutDashboard },
  { to: '/student/available', label: 'Available', icon: ClipboardList },
  { to: '/student/my-exams', label: 'My Exams', icon: FileText },
  { to: '/student/activity', label: 'Activity', icon: Activity }
];

const MobileNav = ({ open, onClose }) => {
  const location = useLocation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/40">
      <div className="fixed left-0 top-0 h-full w-72 overflow-y-auto bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Menu</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Student Portal</h2>
          </div>
          <button onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 transition hover:bg-slate-100" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-8 flex flex-col gap-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive ? 'border-l-4 border-indigo-500 bg-slate-50 text-slate-900' : 'border border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <Icon size={20} className={`transition ${isActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-5">
          <button className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
            <span>Settings</span>
            <X size={20} className="text-slate-500" />
          </button>
          <button className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            <span>Logout</span>
            <X size={20} className="text-slate-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
