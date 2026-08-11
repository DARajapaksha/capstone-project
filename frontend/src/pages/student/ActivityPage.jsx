import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, ShieldCheck, FileText, User, Clock, Filter,
  Calendar, BookOpen, AlertCircle, ChevronRight
} from 'lucide-react';

const allActivities = [
  { id: 1, type: 'verification', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50', title: 'Identity Verified', detail: 'Face match score: 96% — Liveness: Passed', date: 'Mar 5, 2026', time: '11:30 AM', read: true },
  { id: 2, type: 'enrollment', icon: BookOpen, color: 'text-red-700', bg: 'bg-blue-50', title: 'Enrolled in MATH-401', detail: 'Advanced Mathematics Final — March 15, 2026', date: 'Mar 4, 2026', time: '3:30 PM', read: true },
  { id: 3, type: 'exam', icon: CheckCircle, color: 'text-purple-500', bg: 'bg-purple-50', title: 'Completed PHY-201', detail: 'Physics Lab Exam — Score: 92%', date: 'Feb 28, 2026', time: '11:00 AM', read: true },
  { id: 4, type: 'profile', icon: User, color: 'text-orange-500', bg: 'bg-orange-50', title: 'Profile Updated', detail: 'Email address and NIC number updated', date: 'Feb 20, 2026', time: '2:16 PM', read: true },
  { id: 5, type: 'enrollment', icon: BookOpen, color: 'text-red-700', bg: 'bg-blue-50', title: 'Enrolled in CS-302', detail: 'Computer Science Midterm — March 20, 2026', date: 'Feb 18, 2026', time: '10:05 AM', read: true },
  { id: 6, type: 'verification', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50', title: 'Verification Attempt Failed', detail: 'Low lighting detected — please retry with better lighting', date: 'Feb 15, 2026', time: '4:20 PM', read: true },
  { id: 7, type: 'exam', icon: CheckCircle, color: 'text-purple-500', bg: 'bg-purple-50', title: 'Completed CS-201', detail: 'Intro to Computer Science — Score: 88%', date: 'Jan 30, 2026', time: '9:15 AM', read: true },
  { id: 8, type: 'enrollment', icon: BookOpen, color: 'text-red-700', bg: 'bg-blue-50', title: 'Enrolled in PHY-201', detail: 'Physics Lab Exam — Feb 28, 2026', date: 'Jan 25, 2026', time: '1:45 PM', read: true },
  { id: 9, type: 'profile', icon: User, color: 'text-orange-500', bg: 'bg-orange-50', title: 'Account Created', detail: 'Welcome to the Identity Verification System', date: 'Jan 15, 2026', time: '9:00 AM', read: true },
];

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Verification', value: 'verification' },
  { label: 'Enrollment', value: 'enrollment' },
  { label: 'Exams', value: 'exam' },
  { label: 'Profile', value: 'profile' },
];

const ActivityPage = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();

  const filtered = activeFilter === 'all'
    ? allActivities
    : allActivities.filter(a => a.type === activeFilter);

  // Group by month
  const grouped = filtered.reduce((acc, activity) => {
    const month = activity.date.split(' ').slice(0, 2).join(' ').replace(/,.*/, '');
    const key = activity.date.split(' ').slice(0, 2).join(' ');
    if (!acc[key]) acc[key] = [];
    acc[key].push(activity);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Activity Log</h2>
            <p className="text-sm text-gray-500 mt-1">A complete history of your account activity</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar size={16} />
            <span>{allActivities.length} total events</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-5 flex-wrap">
          <Filter size={16} className="text-gray-400" />
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeFilter === f.value
                  ? 'bg-red-800 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {Object.entries(grouped).map(([month, activities]) => (
        <div key={month}>
          {/* Month Header */}
          <div className="flex items-center gap-3 mb-3 px-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{month}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-gray-50">
            {activities.map((activity, idx) => {
              const Icon = activity.icon;
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-5 hover:bg-gray-50 transition-colors group cursor-default"
                >
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-2xl ${activity.bg} flex items-center justify-center`}>
                    <Icon size={18} className={activity.color} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{activity.detail}</p>
                  </div>

                  {/* Time */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-gray-400">{activity.date}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No activity found</p>
          <p className="text-sm text-gray-400 mt-1">Try a different filter</p>
        </div>
      )}
    </div>
  );
};

export default ActivityPage;
