import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, User, History, Settings, LogOut, 
  ShieldCheck, Bell, ArrowRight, UserCircle 
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-[#F3F6FF] font-sans text-[#1A1A1A]">
      
      {/* SIDEBAR */}
      <aside className="w-[280px] bg-white border-r border-gray-100 flex flex-col py-10 px-8 fixed h-full z-30">
        <div className="flex items-center gap-4 mb-16 px-2">
          <div className="bg-[#5D5FEF] p-3 rounded-[18px] shadow-lg shadow-indigo-100">
            <ShieldCheck className="text-white w-7 h-7" />
          </div>
          <span className="font-black text-2xl tracking-tight">VerifyMe</span>
        </div>

        <nav className="flex-1 space-y-4 text-left">
          <SidebarLink icon={<LayoutDashboard size={24}/>} label="Dashboard" active />
          <SidebarLink icon={<User size={24}/>} label="Student Profile" />
          <SidebarLink icon={<History size={24}/>} label="Verification History" />
        </nav>
      </aside>

      {/* MAIN SECTION */}
      <div className="flex-1 ml-[280px] flex flex-col">
        
        {/* TOP BAR - WITH PROFILE BOX */}
        <header className="h-28 flex items-center justify-between px-12 sticky top-0 z-20">
          {/* Left Side Title */}
          <div className="text-left">
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Student Portal</h2>
            <p className="text-gray-400 text-xs font-bold mt-1">Welcome back, John!</p>
          </div>
          
          {/* Right Side: Icons & The Profile Box */}
          <div className="flex items-center gap-6">
            
            {/* Notification & Settings group */}
            <div className="flex items-center gap-3">
              <button className="p-3 bg-white text-gray-400 hover:text-[#5D5FEF] rounded-2xl shadow-sm border border-white transition-all relative">
                <Bell size={22} />
                <span className="absolute top-3 right-3.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <button className="p-3 bg-white text-gray-400 hover:text-[#5D5FEF] rounded-2xl shadow-sm border border-white transition-all">
                <Settings size={22} />
              </button>
            </div>

            {/* THE PROFILE BOX - 100% Match to your design */}
            <div className="bg-white p-2 pr-6 rounded-[24px] shadow-sm border border-white flex items-center gap-4">
              {/* Profile Icon Box */}
              <div className="w-12 h-12 bg-indigo-50 rounded-[18px] flex items-center justify-center text-[#5D5FEF]">
                <UserCircle size={30} />
              </div>
              
              {/* Profile Details */}
              <div className="text-left min-w-[100px]">
                <p className="text-[15px] font-black text-gray-800 leading-none tracking-tight">John Doe</p>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-1.5">Student</p>
              </div>

              {/* Small Vertical Divider inside the box */}
              <div className="h-8 w-[1px] bg-gray-100 mx-1"></div>

              {/* Logout inside the box */}
              <button 
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-all py-2 px-3 rounded-xl hover:bg-red-50"
              >
                <LogOut size={20} />
                <span className="text-sm font-bold">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="p-12 pt-4 max-w-[1400px]">
          
          {/* PURPLE HERO SECTION */}
          <section className="bg-[#5D5FEF] rounded-[56px] p-20 text-white relative overflow-hidden shadow-2xl shadow-indigo-200/50 mb-12">
            <div className="relative z-10 max-w-2xl text-left">
              <h1 className="text-6xl font-black mb-8 tracking-tighter leading-tight">Identity Verification</h1>
              <p className="text-indigo-100 text-xl mb-12 opacity-95 leading-relaxed font-medium max-w-lg">
                Securely verify your identity using our AI-driven facial recognition 
                integrated with blockchain for tamper-proof records.
              </p>
              <button 
                onClick={() => navigate('/verification')}
                className="bg-white text-[#5D5FEF] px-10 py-5 rounded-[22px] font-black text-lg flex items-center gap-4 hover:shadow-2xl transition-all active:scale-95"
              >
                Start Verification Now
                <ArrowRight size={24} />
              </button>
            </div>
            
            {/* Abstract Background Blobs */}
            <div className="absolute top-[-25%] right-[-15%] w-[600px] h-[600px] bg-white/10 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-15%] right-[10%] w-[350px] h-[350px] bg-indigo-400/20 rounded-full blur-[80px]"></div>
          </section>

          {/* STATS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StatCard label="Account Status" value="Unverified" variant="warning" />
            <StatCard label="Last Session" value="26 March 2026" variant="default" />
            <StatCard label="Blockchain Nodes" value="Active" variant="success" />
          </div>

        </main>
      </div>
    </div>
  );
};

// Reusable Components
const SidebarLink = ({ icon, label, active = false }) => (
  <div className={`flex items-center gap-5 px-7 py-5 rounded-[22px] cursor-pointer transition-all ${
    active ? 'bg-[#5D5FEF] text-white shadow-xl shadow-indigo-200' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
  }`}>
    {icon}
    <span className="font-bold text-base tracking-wide">{label}</span>
  </div>
);

const StatCard = ({ label, value, variant }) => {
  const colors = {
    warning: 'text-amber-500',
    success: 'text-emerald-500',
    default: 'text-gray-800'
  };

  return (
    <div className="bg-white p-12 rounded-[44px] shadow-sm border border-white min-h-[200px] flex flex-col justify-center text-left hover:shadow-md transition-shadow">
      <p className="text-gray-400 text-xs font-black uppercase tracking-[0.25em] mb-5">{label}</p>
      <p className={`text-3xl font-black ${colors[variant]}`}>{value}</p>
    </div>
  );
};

export default Home;