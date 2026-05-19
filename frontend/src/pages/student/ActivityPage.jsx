import React from 'react';
import { useProfile } from '../../contexts/ProfileContext';
import {
  CheckCircle, FileText, User, ChevronRight
} from 'lucide-react';

const activityConfig = {
  verification: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  enrollment: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
  exam: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  profile: { icon: User, color: 'text-purple-500', bg: 'bg-purple-50' },
  default: { icon: CheckCircle, color: 'text-gray-500', bg: 'bg-gray-50' }
};

const ActivityPage = () => {
  const { activities } = useProfile();

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">Activity Log</h2>
        <p className="text-sm text-slate-500 mt-1">Complete history of your account activity</p>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => {
          const config = activityConfig[activity.type] || activityConfig.default;
          const Icon = config.icon;
          return (
            <div
              key={activity.id}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={20} className={config.color} />
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

