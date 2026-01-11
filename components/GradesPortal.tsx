import React, { useState, useEffect, useRef } from 'react';
import { AppState, AttendanceStatus, Student, Gender } from '../types.ts';
import { QrCode, Activity, Target, Calendar, Check, BadgeCheck, RefreshCw, Loader2, BarChart3, Scan, CreditCard, User, GraduationCap, Award, ChevronLeft } from 'lucide-react';
import { MONTHS_SEM1, MONTHS_SEM2 } from '../constants.tsx';

interface Props {
  data: AppState;
}

const GradesPortal: React.FC<Props> = ({ data }) => {
  const [identifier, setIdentifier] = useState('');
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewSemester, setViewSemester] = useState<1 | 2>(currentTime.getMonth() >= 6 ? 1 : 2);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focusInput = () => { if (inputRef.current) inputRef.current.focus(); };
    focusInput();
    const interval = setInterval(focusInput, 500); 
    return () => clearInterval(interval);
  }, []);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    const student = data.students.find(s => s.nis === identifier.trim() || s.cardId === identifier.trim());
    if (student) setActiveStudent(student);
    setIdentifier('');
  };

  const getFullStats = (studentId: string, className: string, targetSem: 1 | 2) => {
    const sem = data.semesters[targetSem];
    const records = sem.attendance.filter(a => a.studentId === studentId);
    const grades = sem.grades[studentId] || { daily: [], pts: 0, pas: 0 };
    const materials = sem.config.materials || [];
    const dailyAvg = materials.length > 0 ? grades.daily.reduce((a, b) => a + (b || 0), 0) / materials.length : 0;
    
    const match = className.match(/^(\d+)/);
    const kkm = sem.config.kkm[match ? match[1] : '7'] || 75;
    const raport = Math.round((dailyAvg * 2 + (grades.pts || 0) + (grades.pas || 0)) / 4);

    return { dailyAvg, pts: grades.pts || 0, pas: grades.pas || 0, kkm, attendanceCount: records.length, raport };
  };

  const stats = activeStudent ? getFullStats(activeStudent.id, activeStudent.className, viewSemester) : null;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-[#020617] text-white relative overflow-hidden font-['Plus_Jakarta_Sans']">
      
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full"></div>
      </div>

      <form onSubmit={handleScan} className="absolute opacity-0 pointer-events-none">
        <input ref={inputRef} type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="off" />
      </form>

      {!activeStudent ? (
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500 z-10">
          
          {/* Scan Area Container */}
          <div className="relative mb-12">
            {/* Outer Rotating Ring */}
            <div className="absolute -inset-12 border border-blue-500/10 rounded-full animate-[spin_15s_linear_infinite]"></div>
            <div className="absolute -inset-8 border border-dashed border-blue-500/20 rounded-full animate-[spin_10s_linear_infinite_reverse]"></div>
            
            <div className="w-48 h-48 bg-slate-900/40 backdrop-blur-md rounded-[3rem] border border-white/5 flex flex-col items-center justify-center shadow-[0_0_80px_rgba(37,99,235,0.1)] relative">
               
               {/* Animated Scan Line */}
               <div className="absolute inset-x-0 top-0 h-1 bg-blue-500 shadow-[0_0_15px_#3b82f6] animate-[scan_3s_infinite_ease-in-out]"></div>

               {/* Grid Icon (matching image style) */}
               <div className="grid grid-cols-2 gap-1.5 opacity-60">
                  <div className="w-5 h-5 bg-white/20 rounded-sm"></div>
                  <div className="w-5 h-5 bg-blue-500/40 rounded-sm"></div>
                  <div className="w-5 h-5 bg-blue-500/40 rounded-sm"></div>
                  <div className="w-5 h-5 bg-white/20 rounded-sm"></div>
               </div>

               {/* Ready Pill */}
               <div className="absolute -bottom-4 bg-blue-600 px-6 py-1 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                  <span className="text-[9px] font-black tracking-[0.3em] text-white uppercase">READY</span>
               </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-[0.1em] text-white uppercase">
              TEMPEL <span className="text-blue-500">KARTU</span>
            </h2>
            <p className="text-[10px] md:text-xs font-bold text-white/40 tracking-[0.4em] uppercase">
              SILAKAN TAP KARTU UNTUK CEK NILAI
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-5xl px-6 py-12 z-10 animate-in slide-in-from-bottom-8 duration-500">
          {/* Scanned Header */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
            <div className="flex items-center gap-6">
               <div className="w-20 h-20 bg-blue-600/20 rounded-3xl border border-blue-500/30 flex items-center justify-center text-blue-500">
                  <User className="w-10 h-10" />
               </div>
               <div className="text-center md:text-left">
                  <h1 className="text-4xl font-black text-white uppercase tracking-tight">{activeStudent.name}</h1>
                  <div className="flex items-center gap-3 mt-1 justify-center md:justify-start">
                    <span className="bg-blue-600/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase">KELAS {activeStudent.className}</span>
                    <span className="text-white/30 text-[10px] font-black tracking-widest uppercase">NIS: {activeStudent.nis}</span>
                  </div>
               </div>
            </div>

            <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-white/5">
              {[1, 2].map((s) => (
                <button 
                  key={s} 
                  onClick={() => setViewSemester(s as 1 | 2)} 
                  className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${viewSemester === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-white/40 hover:text-white/60'}`}
                >
                  SEMESTER {s}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-8 rounded-[2.5rem] flex flex-col items-center text-center group hover:border-blue-500/20 transition-all">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <p className="text-[9px] font-black text-white/30 tracking-[0.2em] uppercase mb-1">RATA-RATA NH</p>
              <p className="text-4xl font-black text-white">{stats?.dailyAvg.toFixed(0)}</p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-8 rounded-[2.5rem] flex flex-col items-center text-center group hover:border-blue-500/20 transition-all">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 mb-4 group-hover:scale-110 transition-transform">
                <Target className="w-5 h-5" />
              </div>
              <p className="text-[9px] font-black text-white/30 tracking-[0.2em] uppercase mb-1">NILAI PTS</p>
              <p className="text-4xl font-black text-white">{stats?.pts}</p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-8 rounded-[2.5rem] flex flex-col items-center text-center group hover:border-blue-500/20 transition-all">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition-transform">
                <Award className="w-5 h-5" />
              </div>
              <p className="text-[9px] font-black text-white/30 tracking-[0.2em] uppercase mb-1">NILAI PAS</p>
              <p className="text-4xl font-black text-white">{stats?.pas}</p>
            </div>

            <div className="bg-blue-600 p-8 rounded-[2.5rem] flex flex-col items-center text-center shadow-[0_20px_40px_rgba(37,99,235,0.2)]">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white mb-4">
                <GraduationCap className="w-5 h-5" />
              </div>
              <p className="text-[9px] font-black text-white/60 tracking-[0.2em] uppercase mb-1">NILAI AKHIR</p>
              <p className="text-5xl font-black text-white">{stats?.raport}</p>
              <div className="mt-4 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                 <span className="text-[8px] font-black tracking-widest uppercase">KKM: {stats?.kkm}</span>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mt-12 pt-8 border-t border-white/5">
             <div className="flex items-center gap-6 text-white/30">
                <div className="flex items-center gap-2">
                   <Calendar className="w-4 h-4" />
                   <span className="text-[10px] font-black tracking-widest uppercase">{stats?.attendanceCount} PERTEMUAN TERCATAT</span>
                </div>
                <div className="flex items-center gap-2">
                   <BadgeCheck className={`w-4 h-4 ${stats && stats.raport >= stats.kkm ? 'text-emerald-500' : 'text-rose-500'}`} />
                   <span className="text-[10px] font-black tracking-widest uppercase">{stats && stats.raport >= stats.kkm ? 'TUNTAS' : 'BELUM TUNTAS'}</span>
                </div>
             </div>

             <button 
               onClick={() => setActiveStudent(null)} 
               className="flex items-center gap-2.5 bg-white text-slate-900 px-10 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-50 transition-all active:scale-95"
             >
                <ChevronLeft className="w-4 h-4" /> RESET SCANNER
             </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(192px); }
        }
      `}</style>
    </div>
  );
};

export default GradesPortal;