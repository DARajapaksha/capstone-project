import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Bell, Settings, LogOut, Edit3, Calendar, 
  CheckCircle2, Clock, ArrowRight, BookOpen, Activity, LayoutDashboard
} from 'lucide-react';

// 1. IMPORT YOUR NEW COMPONENT HERE
import VerificationTab from '../components/VerificationTab';

const Home = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div className="min-h-screen bg-[#F3F6FF] font-sans text-[#1A1A1A] antialiased">
      
      {/* TOP BAR - FIXED AS REQUESTED */}
      <header className="h-18 bg-white px-12 sticky top-0 z-50 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="bg-[#5D5FEF] p-2.5 rounded-[15px] shadow-lg shadow-indigo-100">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div className="text-left">
            <h2 className="font-black text-xl leading-none tracking-tight uppercase">Student Portal</h2>
            <span className="font-bold text-gray-400 text-[10px] uppercase tracking-[0.2em] mt-1 block">Identity Verification System</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <IconButton icon={<Bell size={20} />} notification />
            <IconButton icon={<Settings size={20} />} />
          </div>

          <div className="bg-white p-1.5 pr-6 rounded-[22px] shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="h-7 w-[1px] bg-gray-200 mx-1"></div>
            <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-all group">
              <LogOut size={16} />
              <span className="text-[10px] font-black uppercase">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-12">
        
        {/* PROFILE SECTION */}
        <section className="bg-white rounded-[50px] shadow-sm border border-white p-14 mb-10">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-12 text-left">
            <div className="flex items-center gap-10">
              <div className="w-32 h-32 bg-[#5D5FEF] rounded-[50%] flex items-center justify-center text-white font-black text-5xl shadow-2xl shadow-indigo-100">AJ</div>
              <div>
                <h1 className="text-3xl font-black mb-3 tracking-tighter uppercase">Alex Johnson</h1>
                <p className="text-gray-400  text-lg">Student ID: STU-2026-001</p>
                <div className="flex gap-4 mt-8">
                  <div className="grid grid-cols-3 gap-x-16 gap-y-8 border-l-2 border-gray-50 pl-16">
                    <InfoCol label="Email" val="alex.johnson@university.edu" />
                    <InfoCol label="NIC Number" val="123456789V" />
                    <InfoCol label="Enrolled Since" val="Jan 15, 2026" />
                  </div>
                  <button className="bg-[#5D5FEF] text-white px-8 py-3.5 rounded-2xl text-sm font-black flex items-center gap-2 shadow-lg hover:opacity-90 transition-all">
                    <Edit3 size={18} /> Edit Profile
                  </button>
                  <button className="bg-white text-[#5D5FEF] px-8 py-3.5 rounded-2xl text-sm font-black border border-gray-200 hover:bg-gray-50 transition-all">
                    Enroll in Exam
                  </button>
                </div>
              </div>
            </div>
            
          </div>
        </section>

        {/* STATS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <StatCard label="Verification Status" val="Verified" sub="Identity Confirmed" theme="success" isStatus />
          <StatCard label="Enrolled Exams" val="02" sub="1 need verification" theme="warning" />
          <StatCard label="Completed Exams" val="01" sub="Score: 96%" theme="success" />
          <StatCard label="Upcoming Exam" val="MATH-401" sub="Mar 15, 2026" theme="primary" />
        </div>

        {/* TAB BAR */}
        <div className="bg-white px-8 py-4 rounded-[30px] flex items-center gap-4 shadow-sm border border-white mb-12">
          <NavTab label="Overview" icon={<LayoutDashboard size={20}/>} active={activeTab === 'Overview'} onClick={() => setActiveTab('Overview')} />
          <NavTab label="Verification" icon={<ShieldCheck size={20}/>} active={activeTab === 'Verification'} onClick={() => setActiveTab('Verification')} />
          <NavTab label="My Exams" icon={<BookOpen size={20}/>} active={activeTab === 'My Exams'} onClick={() => setActiveTab('My Exams')} />
          <NavTab label="Activity" icon={<Activity size={20}/>} active={activeTab === 'Activity'} onClick={() => setActiveTab('Activity')} />
        </div>

        {/* 2. DYNAMIC CONTENT AREA BASED ON TAB */}
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* UPCOMING EXAMS (Wider) */}
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-6 pl-2">
                <h3 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Upcoming Exams</h3>
                <button className="text-[#5D5FEF] text-xs font-black uppercase tracking-widest hover:underline">View All</button>
              </div>
              <div className="space-y-4">
                <ExamCard title="Advanced Mathematics Final" code="MATH-401" date="Mar 15, 2026" time="10:00 AM" status="Pending" />
                <ExamCard title="Computer Science Midterm" code="CS-302" date="Mar 20, 2026" time="02:00 PM" status="Verified" />
                <ExamCard title="Physical Science Final" code="PHY-201" date="Apr 05, 2026" time="09:00 AM" status="Verified" />
              </div>
            </div>

            {/* RECENT ACTIVITY (Narrower - In White Box) */}
            <div className="flex flex-col h-full">
              <div className="mb-6 pl-2">
                <h3 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Recent Activity</h3>
              </div>
              <div className="bg-white rounded-[50px] p-10 border border-white shadow-sm flex-grow">
                <div className="space-y-12">
                  <ActivityItem icon={<ShieldCheck className="text-emerald-500" size={20}/>} title="Identity Verified" time="Mar 5, 11:00 AM" />
                  <ActivityItem icon={<CheckCircle2 className="text-indigo-500" size={20}/>} title="Enrolled MATH-401" time="Mar 4, 03:30 PM" />
                  <ActivityItem icon={<Clock className="text-blue-500" size={20}/>} title="Completed PHY-201" time="Feb 28, 11:00 AM" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. SHOW THE VERIFICATION COMPONENT WHEN TAB IS ACTIVE */}
        {activeTab === 'Verification' && (
          <VerificationTab />
        )}

      </main>
    </div>
  );
};

// --- FIGMA COMPONENT HELPERS ---

const NavTab = ({ label, icon, active, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-10 py-3.5 rounded-[22px] font-black transition-all ${
    active ? 'bg-[#5D5FEF] text-white shadow-lg shadow-indigo-100' : 'text-gray-400 hover:text-gray-600'
  }`}>
    {icon} <span className="text-[12px] uppercase tracking-tighter">{label}</span>
  </button>
);

const StatCard = ({ label, val, sub, theme, isStatus }) => {
  const colors = { warning: 'text-amber-500', success: 'text-emerald-500', primary: 'text-[#5D5FEF]' };
  return (
    <div className="bg-white p-10 rounded-[45px] border border-white text-left shadow-sm min-h-[190px] flex flex-col justify-center">
      <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{label}</p>
      <p className={`font-black tracking-tighter leading-none ${isStatus ? 'text-3xl' : 'text-5xl'} ${colors[theme]}`}>{val}</p>
      <p className="text-gray-400 text-[11px] font-bold mt-4 opacity-80 uppercase">{sub}</p>
    </div>
  );
};

const ExamCard = ({ title, code, date, time, status }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white p-6 rounded-[35px] border border-white flex justify-between items-center text-left hover:shadow-md transition-shadow group">
      <div className="flex items-center gap-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${status === 'Pending' ? 'bg-amber-50' : 'bg-indigo-50'}`}>
          <BookOpen className={status === 'Pending' ? 'text-amber-500' : 'text-[#5D5FEF]'} size={24} />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-[#5D5FEF] uppercase tracking-widest leading-none mb-1">{code}</p>
          <h4 className="text-lg font-black text-gray-800 leading-tight">{title}</h4>
          <div className="flex gap-4 text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">
            <span className="flex items-center gap-1.5"><Calendar size={12}/> {date}</span>
            <span className="flex items-center gap-1.5"><Clock size={12}/> {time}</span>
          </div>
        </div>
      </div>
      <button 
        onClick={() => status === 'Pending' && navigate('/verification')}
        className={`p-4 rounded-2xl transition-all ${status === 'Pending' ? 'bg-[#5D5FEF] text-white shadow-lg px-8 hover:bg-[#4b4ddb]' : 'bg-gray-50 text-gray-400 group-hover:bg-[#5D5FEF] group-hover:text-white'}`}>
        {status === 'Pending' ? <span className="text-[10px] font-black uppercase">Verify Now</span> : <ArrowRight size={20} />}
      </button>
    </div>
  );
};

const ActivityItem = ({ icon, title, time }) => (
  <div className="flex items-center gap-6 text-left group">
    <div className="p-4 bg-[#F3F6FF] rounded-[22px] group-hover:bg-indigo-50 transition-colors">{icon}</div>
    <div className="flex-grow">
      <p className="text-sm font-black text-gray-800 tracking-tight leading-none mb-1.5">{title}</p>
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.15em]">{time}</p>
    </div>
    <ArrowRight size={16} className="text-gray-200" />
  </div>
);

const InfoCol = ({ label, val }) => (
  <div>
    <p className="text-[10px] uppercase font-black tracking-[0.15em] text-gray-400 mb-1">{label}</p>
    <p className="text-[15px] font-black text-gray-800">{val}</p>
  </div>
);

const IconButton = ({ icon, notification }) => (
  <button className="p-3 bg-[#F3F6FF] text-gray-400 rounded-2xl relative hover:text-[#5D5FEF] transition-all">
    {icon}
    {notification && <span className="absolute top-3 right-3.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
  </button>
);

export default Home;