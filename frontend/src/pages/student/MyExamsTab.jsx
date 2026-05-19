import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, Clock, Download } from 'lucide-react';
import './MyExamsTab.css';

const MyExamsTab = () => {
  const navigate = useNavigate();
  const [exams] = useState([
    {
      id: 1,
      courseName: 'Advanced Mathematics Final',
      courseCode: 'MATH-401',
      date: 'March 15, 2026',
      time: '10:00 AM - 12:00 PM',
      duration: '120 min',
      status: 'upcoming',
      verificationStatus: 'required',
      borderColor: 'border-yellow-200',
      bgCard: 'bg-yellow-50/10'
    },
    {
      id: 2,
      courseName: 'Computer Science Midterm',
      courseCode: 'CS-302',
      date: 'March 20, 2026',
      time: '2:00 PM - 4:00 PM',
      duration: '120 min',
      status: 'upcoming',
      verificationStatus: 'verified',
      verifiedAt: 'March 5, 2026',
      borderColor: 'border-slate-200',
      bgCard: 'bg-white'
    },
    {
      id: 3,
      courseName: 'Physics Lab Exam',
      courseCode: 'PHY-201',
      date: 'February 28, 2026',
      time: '9:00 AM - 11:00 AM',
      duration: '120 min',
      status: 'completed',
      verificationStatus: 'verified',
      score: '92%',
      borderColor: 'border-emerald-200',
      bgCard: 'bg-emerald-50/10'
    },
  ]);

  const handleVerifyIdentity = () => navigate('/verification');
  const handleCancelEnrollment = (examId) => alert('Cancel enrollment logic here');
  const handleViewDetails = (examId) => alert('View details logic here');
  const handleDownloadCertificate = (examId) => alert('Download certificate logic here');

  return (
    <div className="space-y-6">
      {exams.map((exam) => (
        <div key={exam.id} className={`rounded-xl border ${exam.borderColor} ${exam.bgCard} p-6 shadow-sm transition-all`}>
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{exam.courseName}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{exam.courseCode}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${exam.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
              </span>
              
              {exam.verificationStatus === 'required' ? (
                <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-[#ffb020] text-white">
                  <Clock size={14} /> Verify Required
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500 text-white">
                  <ShieldCheck size={14} /> Verified
                </span>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="border border-slate-200 rounded-lg p-3 bg-white">
              <p className="text-xs text-slate-500 mb-1">Date</p>
              <p className="text-sm font-medium text-slate-900">{exam.date}</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-3 bg-white">
              <p className="text-xs text-slate-500 mb-1">Time</p>
              <p className="text-sm font-medium text-slate-900">{exam.time}</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-3 bg-white">
              <p className="text-xs text-slate-500 mb-1">Duration</p>
              <p className="text-sm font-medium text-slate-900">{exam.duration}</p>
            </div>
            
            {exam.verifiedAt && (
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <p className="text-xs text-slate-500 mb-1">Verified At</p>
                <p className="text-sm font-medium text-emerald-600">{exam.verifiedAt}</p>
              </div>
            )}
            
            {exam.score && (
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <p className="text-xs text-slate-500 mb-1">Score</p>
                <p className="text-sm font-bold text-emerald-600">{exam.score}</p>
              </div>
            )}
          </div>

          {/* Verification Alert (if required) */}
          {exam.verificationStatus === 'required' && (
            <div className="bg-[#fffdf0] border border-[#ffec99] rounded-lg p-4 mb-6 flex items-start gap-3">
              <ShieldAlert size={20} className="text-[#eab308] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-slate-900">Identity verification required</p>
                <p className="text-sm text-slate-600 mt-0.5">You must verify your identity before taking this exam</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-3">
            {exam.verificationStatus === 'required' && (
              <>
                <button 
                  onClick={handleVerifyIdentity}
                  className="flex-1 bg-[#5B47FB] hover:bg-[#4b3ae6] text-white py-2.5 rounded-lg font-medium transition-colors flex justify-center items-center gap-2"
                >
                  <ShieldCheck size={18} /> Verify Identity Now
                </button>
                <button 
                  onClick={() => handleCancelEnrollment(exam.id)}
                  className="bg-[#E11D48] hover:bg-[#be123c] text-white py-2.5 px-6 rounded-lg font-medium transition-colors"
                >
                  Cancel Enrollment
                </button>
              </>
            )}

            {exam.status === 'upcoming' && exam.verificationStatus === 'verified' && (
              <>
                <button 
                  onClick={() => handleViewDetails(exam.id)}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-2.5 rounded-lg font-medium transition-colors"
                >
                  View Details
                </button>
                <button 
                  onClick={() => handleCancelEnrollment(exam.id)}
                  className="bg-[#E11D48] hover:bg-[#be123c] text-white py-2.5 px-6 rounded-lg font-medium transition-colors"
                >
                  Cancel Enrollment
                </button>
              </>
            )}

            {exam.status === 'completed' && (
              <button 
                onClick={() => handleDownloadCertificate(exam.id)}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-2.5 rounded-lg font-medium transition-colors flex justify-center items-center gap-2"
              >
                <Download size={18} /> Download Result Certificate
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyExamsTab;
