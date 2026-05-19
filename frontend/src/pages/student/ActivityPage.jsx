import React from 'react';
import {
  CheckCircle, FileText, User, ChevronRight
} from 'lucide-react';

const activities = [
  { 
    id: 1, 
    type: 'verification', 
    icon: CheckCircle, 
    color: 'text-emerald-500', 
    bg: 'bg-emerald-50', 
    title: 'Identity Verified', 
    date: 'Mar 5, 2026 11:00 AM'
  },
  { 
    id: 2, 
    type: 'enrollment', 
    icon: FileText, 
    color: 'text-blue-500', 
    bg: 'bg-blue-50', 
    title: 'Enrolled in MATH-401', 
    date: 'Mar 4, 2026 3:30 PM'
  },
  { 
    id: 3, 
    type: 'exam', 
    icon: CheckCircle, 
    color: 'text-emerald-500', 
    bg: 'bg-emerald-50', 
    title: 'Completed PHY-201 Exam', 
    date: 'Feb 28, 2026 11:00 AM'
  },
  { 
    id: 4, 
    type: 'profile', 
    icon: FileText, 
    color: 'text-blue-500', 
    bg: 'bg-blue-50', 
    title: 'Profile Updated', 
    date: 'Feb 20, 2026 2:15 PM'
  },
];

const ActivityPage = () => {
  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">Activity Log</h2>
        <p className="text-sm text-slate-500 mt-1">Complete history of your account activity</p>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div
              key={activity.id}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full ${activity.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={20} className={activity.color} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{activity.title}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{activity.date}</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityPage;

