import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ShieldCheck, BookOpen, Activity, 
  Bell, Settings, LogOut, Edit3, Calendar, 
  CheckCircle2, Clock, ArrowRight, UserCircle2
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-[#F3F6FF] font-sans text-[#1A1A1A]">
      
      {/* SIDEBAR - Exactly as per Figma Navigation */}
      <aside className="w-[280px] bg-white border-r border-gray-100 flex flex-col py-10 px-8 fixed h-full z-30">
        <div className="flex items-center gap-4 mb-16 px-2">
          <div className="bg-[#5D5FEF] p-3 rounded-[18px] shadow-lg shadow-indigo-100">
            <ShieldCheck className="text-white w-7 h-7" />
          </div>
          <span className="font-black text-2xl tracking-tight italic">VerifyMe</span>
        </div>

        <nav className="flex-1 space-y-4">
          <SidebarLink icon={<LayoutDashboard size={22}/>} label="Overview" active />
          <SidebarLink icon={<ShieldCheck size={22}/>} label="Verification" />
          <SidebarLink icon={<BookOpen size={22}/>} label="My Exams" />
          <SidebarLink icon={<Activity size={22}/>} label="Activity" />
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 ml-[280px] flex flex-col min-h-screen">
        
        {/* TOP BAR */}
        <header className="h-24 flex items-center justify-between px-12 sticky top-0 z-20">
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Student Portal</h2>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <IconButton icon={<Bell size={20} />} notification />
              <IconButton icon={<Settings size={20} />} />
            </div>

            {/* PROFILE ACTION BOX */}
            <div className="bg-white p-2 pr-6 rounded-[24px] shadow-sm border border-white flex items-center gap-4">
              <div className="w-11 h-11 bg-indigo-50 rounded-[16px] flex items-center justify-center text-[#5D5FEF] font-bold">
                AJ
              </div>
              <div className="text-left min-w-[100px]">
                <p className="text-sm font-black text-gray-800 leading-none tracking-tight">Alex Johnson</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Student</p>
              </div>
              <div className="h-8 w-[1px] bg-gray-100 mx-1"></div>
              <button 
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-all p-2"
              >
                <LogOut size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="p-12 pt-4 max-w-[1400px]">
          
          {/* PROFILE SUMMARY CARD (Purple) */}
          <section className="bg-[#5D5FEF] rounded-[48px] p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-200/50 mb-12">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-white/20 rounded-[32px] flex items-center justify-center border border-white/30 backdrop-blur-md">
                   <UserCircle2 size={60} strokeWidth={1} />
                </div>
                <div className="text-left">
                  <h1 className="text-4xl font-black mb-1">Alex Johnson</h1>
                  <p className="text-indigo-100 font-bold opacity-80">Student ID: STU-2026-001</p>
                  <div className="flex gap-4 mt-4">
                    <button className="bg-white text-[#5D5FEF] px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                      <Edit3 size={16} /> Edit Profile
                    </button>
                    <button className="bg-[#4B4DDB] text-white px-5 py-2 rounded-xl text-sm font-bold border border-white/20">
                      Enroll in Exam
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 border-l border-white/20 pl-8">
                <DetailItem label="Email" value="alex.johnson@university.edu" />
                <DetailItem label="NIC Number" value="123456789V" />
                <DetailItem label="Enrolled Since" value="January 15, 2026" />
                <DetailItem label="Identity Status" value="Verified" status="success" />
              </div>
            </div>
          </section>

          {/* STATS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <StatBox label="Enrolled Exams" value="2" sub="1 need verification" color="warning" />
            <StatBox label="Completed Exams" value="1" sub="Score: 96%" color="success" />
            <StatBox label="Upcoming" value="MATH-401 Final" sub="Next: Mar 15" color="indigo" />
          </div>

          {/* TWO COLUMN CONTENT SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* UPCOMING EXAMS SECTION */}
            <div className="space-y-6">
              <SectionHeader title="Upcoming Exams" sub="Your scheduled examinations" />
              <ExamCard 
                title="Advanced Mathematics Final" 
                code="MATH-401" 
                date="March 15, 2026" 
                time="10:00 AM - 12:00 PM"
                status="Verify Required"
              />
              <ExamCard 
                title="Computer Science Midterm" 
                code="CS-302" 
                date="March 20, 2026" 
                time="2:00 PM - 4:00 PM"
                status="Verified"
              />
            </div>

            {/* RECENT ACTIVITY SECTION */}
            <div className="space-y-6">
              <SectionHeader title="Recent Activity" sub="Your latest actions" />
              <div className="bg-white rounded-[40px] p-8 shadow-sm space-y-8 border border-white">
                <ActivityItem icon={<ShieldCheck className="text-emerald-500"/>} title="Identity Verified" time="Mar 5, 2026 11:00 AM" />
                <ActivityItem icon={<CheckCircle2 className="text-indigo-500"/>} title="Enrolled in MATH-401" time="Mar 4, 2026 3:30 PM" />
                <ActivityItem icon={<Clock className="text-blue-500"/>} title="Completed PHY-201 Exam" time="Feb 28, 2026 11:00 AM" />
                <ActivityItem icon={<UserCircle2 className="text-gray-400"/>} title="Profile Updated" time="Feb 20, 2026 2:15 PM" />
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const DetailItem = ({ label, value, status }) => (
  <div className="text-left">
    <p className="text-[10px] uppercase font-black tracking-widest text-indigo-200 mb-1">{label}</p>
    <p className={`text-sm font-bold ${status === 'success' ? 'text-emerald-300' : 'text-white'}`}>{value}</p>
  </div>
);

const SidebarLink = ({ icon, label, active = false }) => (
  <div className={`flex items-center gap-5 px-7 py-4.5 rounded-[22px] cursor-pointer transition-all ${
    active ? 'bg-[#5D5FEF] text-white shadow-xl shadow-indigo-100' : 'text-gray-400 hover:bg-gray-50'
  }`}>
    {icon}
    <span className="font-bold text-base">{label}</span>
  </div>
);

const IconButton = ({ icon, notification }) => (
  <button className="p-3 bg-white text-gray-400 rounded-2xl shadow-sm border border-white transition-all relative">
    {icon}
    {notification && <span className="absolute top-3 right-3.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
  </button>
);

const StatBox = ({ label, value, sub, color }) => {
  const colors = {
    warning: 'text-amber-500',
    success: 'text-emerald-500',
    indigo: 'text-[#5D5FEF]'
  };
  return (
    <div className="bg-white p-10 rounded-[44px] shadow-sm border border-white text-left flex flex-col justify-center min-h-[160px]">
      <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">{label}</p>
      <p className={`text-2xl font-black ${colors[color]}`}>{value}</p>
      <p className="text-gray-400 text-xs font-bold mt-1 opacity-80">{sub}</p>
    </div>
  );
};

const SectionHeader = ({ title, sub }) => (
  <div className="text-left pl-2">
    <h3 className="text-xl font-black text-gray-800">{title}</h3>
    <p className="text-gray-400 text-sm font-bold">{sub}</p>
  </div>
);

const ExamCard = ({ title, code, date, time, status }) => (
  <div className="bg-white p-8 rounded-[40px] shadow-sm border border-white flex justify-between items-center group hover:shadow-md transition-shadow">
    <div className="text-left space-y-3">
      <div className="flex items-center gap-3">
        <span className="bg-indigo-50 text-[#5D5FEF] px-3 py-1 rounded-lg text-[10px] font-black">{code}</span>
        <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${status === 'Verified' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>{status}</span>
      </div>
      <h4 className="text-lg font-black text-gray-800">{title}</h4>
      <div className="flex items-center gap-6 text-gray-400 text-sm font-bold">
        <div className="flex items-center gap-2"><Calendar size={16}/> {date}</div>
        <div className="flex items-center gap-2"><Clock size={16}/> {time}</div>
      </div>
    </div>
    <button className={`p-4 rounded-2xl transition-all ${status === 'Verified' ? 'bg-indigo-50 text-[#5D5FEF]' : 'bg-[#5D5FEF] text-white shadow-lg shadow-indigo-100'}`}>
      {status === 'Verified' ? <ArrowRight size={20} /> : <span className="text-xs font-black">Verify Identity</span>}
    </button>
  </div>
);

const ActivityItem = ({ icon, title, time }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-5">
      <div className="p-3 bg-gray-50 rounded-2xl">{icon}</div>
      <div className="text-left">
        <p className="text-base font-black text-gray-800">{title}</p>
        <p className="text-xs text-gray-400 font-bold">{time}</p>
      </div>
    </div>
    <ArrowRight size={18} className="text-gray-300" />
  </div>
);

export default Home;