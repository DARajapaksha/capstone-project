import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import MobileNav from '../components/student/MobileNav';
import { Bell, LogOut, Menu, ShieldCheck, Settings } from 'lucide-react';

const StudentLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);

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
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">Student Portal</h1>
                  <p className="text-xs text-slate-500">Identity Verification System</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50" aria-label="Notifications">
                <Bell size={20} />
              </button>
              <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50" aria-label="Settings">
                <Settings size={20} />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700">
                <LogOut size={20} />
                Logout
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
