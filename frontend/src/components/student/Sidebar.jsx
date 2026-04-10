import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, FileText, Activity } from 'lucide-react';

const navItems = [
  { to: '/student', label: 'Overview', icon: LayoutDashboard },
  { to: '/student/available', label: 'Available Exams', icon: ClipboardList },
  { to: '/student/my-exams', label: 'My Exams', icon: FileText },
  { to: '/student/activity', label: 'Activity', icon: Activity }
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 hidden md:flex flex-col gap-6 rounded-r-[28px] border-r border-slate-200 bg-white p-6 shadow-[0_30px_60px_rgba(15,23,42,0.08)]">
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`group flex items-center gap-3 rounded-2xl border-l-4 px-4 py-3 text-sm font-medium transition ${isActive ? 'border-indigo-500 bg-slate-50 text-slate-900' : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Icon size={20} className={`transition ${isActive ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-600'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
