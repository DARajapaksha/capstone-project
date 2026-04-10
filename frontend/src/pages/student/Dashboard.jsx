import React, { useState } from 'react';
import { Calendar, CheckCircle, Clock, Award, User, Mail, CreditCard, FileText, ShieldCheck, ShieldAlert, Edit2, Plus, Zap } from 'lucide-react';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'available', label: 'Verification' },
    { id: 'my-exams', label: 'My Exams' },
    { id: 'activity', label: 'Activity' }
  ];

  const stats = [
    { icon: Calendar, label: 'Total Exams', value: '12', color: 'text-blue-600', borderColor: 'border-l-green-500' },
    { icon: CheckCircle, label: 'Completed', value: '8', color: 'text-green-600', borderColor: 'border-l-purple-500' },
    { icon: Clock, label: 'Pending', value: '4', color: 'text-orange-600', borderColor: 'border-l-orange-500' },
    { icon: Award, label: 'Average Score', value: '85%', color: 'text-purple-600', borderColor: 'border-l-blue-500' }
  ];

  const upcomingExams = [
    { title: 'Advanced Mathematics Final', code: 'MATH-401', time: '10:00 AM - 12:00 PM', date: 'March 15, 2026', status: 'Verify Required', statusColor: 'bg-[#F0B100] text-white', borderColor: 'border-[#FFDF20]', actionColor: 'bg-[#5B47FB]', actionIcon: ShieldAlert, statusIcon: ShieldAlert },
    { title: 'Computer Science Midterm', code: 'CS-302', time: '2:00 PM - 4:00 PM', date: 'March 20, 2026', status: 'Verified', statusColor: 'bg-[#00C950] text-white', borderColor: 'border-gray-200', actionColor: 'bg-[#00C950]', actionIcon: ShieldCheck, statusIcon: ShieldCheck }
  ];

  const activities = [
    { action: 'Identity Verified', date: 'Mar 5, 2026 11:30 AM', icon: CheckCircle, color: 'text-green-600' },
    { action: 'Enrolled in MATH-401', date: 'Mar 4, 2026 3:30 PM', icon: FileText, color: 'text-blue-600' },
    { action: 'Completed PHY-201 Exam', date: 'Feb 28, 2026 11:00 AM', icon: CheckCircle, color: 'text-green-600' },
    { action: 'Profile Updated', date: 'Feb 20, 2026 2:16 PM', icon: User, color: 'text-purple-600' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
            {/* Left Column: Upcoming Exams */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Exams</h3>
                <p className="text-sm text-gray-500 mt-1">Your scheduled examinations</p>
              </div>
              <div className="space-y-4">
                {upcomingExams.map((exam, index) => (
                  <div key={index} className={`p-4 border-2 rounded-lg ${exam.borderColor}`}>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="font-semibold text-gray-900">{exam.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{exam.code}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ECEEF2] text-gray-700">
                          Upcoming
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${exam.statusColor}`}>
                          <exam.statusIcon size={12} />
                          {exam.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                      <Calendar size={16} className="text-gray-500" />
                      <span>{exam.date} • {exam.time}</span>
                    </div>
                    {exam.status === 'Verify Required' && (
                      <button className={`w-full px-4 py-2 text-white rounded-lg font-medium hover:opacity-90 transition flex items-center justify-center gap-2 ${exam.actionColor}`}>
                        <exam.actionIcon size={16} />
                        Verify Identity for this Exam
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Recent Activity */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <p className="text-sm text-gray-500 mt-1">Your latest actions</p>
              </div>
              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <activity.icon size={20} className={`${activity.color} mt-0.5 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-600 mt-1">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'available':
        return (
          <div className="bg-white p-6 rounded-xl shadow-sm min-h-[400px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-full">
                <Zap size={32} className="text-gray-400" />
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 max-w-sm">
                <p className="text-gray-500 font-medium text-sm">Verification modules are being updated by the team.</p>
              </div>
            </div>
          </div>
        );
      case 'my-exams':
        return (
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Exams</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Advanced Mathematics Final</p>
                  <p className="text-sm text-gray-500">MATH-401 • Completed - Score: 92%</p>
                </div>
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Computer Science Midterm</p>
                  <p className="text-sm text-gray-500">CS-302 • Completed - Score: 88%</p>
                </div>
                <CheckCircle size={20} className="text-green-600" />
              </div>
            </div>
          </div>
        );
      case 'activity':
        return (
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <activity.icon size={20} className={`${activity.color} mt-0.5 flex-shrink-0`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-600 mt-1">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <User size={32} className="text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">John Doe</h3>
                <p className="text-sm text-gray-500">Student ID: 12345678</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition">
                <Edit2 size={16} />
                Edit Profile
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#5B47FB] text-white rounded-lg font-medium hover:opacity-90 transition">
                <Plus size={16} />
                Enroll in Exam
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <Mail size={20} className="text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Email</p>
                  <p className="text-sm font-medium text-gray-900">john.doe@university.edu</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-orange-600" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">NIC</p>
                  <p className="text-sm font-medium text-gray-900">123456789V</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-green-600" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Enrollment Date</p>
                  <p className="text-sm font-medium text-gray-900">Jan 15, 2024</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${stat.borderColor}`}>
              <div className="flex items-center gap-3">
                <stat.icon size={20} className={stat.color} />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <nav className="flex gap-6 border-b border-gray-200 pb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-sm font-medium transition ${activeTab === tab.id ? 'text-purple-600 border-b-2 border-purple-600 pb-2' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {renderContent()}
    </div>
  );
};

export default Dashboard;