import React, { useState, useEffect, useRef } from 'react';
import { AppState, AttendanceStatus, Student } from '../types.ts';
import { Wifi, Cpu, Bell, CheckCircle2, XCircle, CreditCard, ChevronRight } from 'lucide-react';

interface Props {
  data: AppState;
  updateData: (data: AppState) => void;
}

const StudentDashboard: React.FC<Props> = ({ data, updateData }) => {
  const [identifier, setIdentifier] = useState('');
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const inputRef = useRef<HTMLInputElement>(null);

  const todayStr = currentTime.toISOString().split('T')[0];
  const currentSemester = currentTime.getMonth() >= 6 ? 1 : 2;

  // Fokus input otomatis untuk pemindaian kartu
  useEffect(() => {
    const focusInput = () => { if (inputRef.current) inputRef.current.focus(); };
    focusInput();
    const interval = setInterval(focusInput, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const val = identifier.trim();
    if (!val) return;

    const student = data.students.find(s => s.nis === val || s.cardId === val);
    if (student) {
      const semester = data.semesters[currentSemester as 1 | 2];
      const exists = semester.attendance.some(a => a.studentId === student.id && a.date === todayStr);
      
      if (!exists) {
        const timeString = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const newAttendance = [...semester.attendance, { 
          studentId: student.id, 
          date: todayStr, 
          status: AttendanceStatus.H, 
          timestamp: timeString 
        }];
        updateData({ 
          ...data, 
          semesters: { 
            ...data.semesters, 
            [currentSemester]: { ...semester, attendance: newAttendance } 
          } 
        });
        setFeedback({ type: 'success', message: 'PRESENSI BERHASIL' });
      } else {
        setFeedback({ type: 'error', message: 'SUDAH TERABSEN' });
      }
      setActiveStudent(student);
    } else {
      setFeedback({ type: 'error', message: 'KARTU TIDAK DIKENAL' });
      setActiveStudent(null);
    }

    setIdentifier('');
    setTimeout(() => {
      setActiveStudent(null);
      setFeedback(null);
    }, 3000);
  };

  // Mendapatkan riwayat presensi hari ini untuk marquee
  const todayLogs = data.semesters[currentSemester as 1 | 2].attendance
    .filter(a => a.date === todayStr)
    .map(a => {
      const student = data.students.find(s => s.id === a.studentId);
      return { ...a, studentName: student?.name || 'Unknown', className: student?.className || '' };
    })
    .reverse()
    .slice(0, 10);

  return (
    <div className="h-full w-full bg-[#020617] flex flex-col relative overflow-hidden text-slate-300 font-['Plus_Jakarta_Sans']">
      
      {/* Top Header Status */}
      <div className="shrink-0 w-full px-6 py-4 flex justify-between items-center z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            <span className="text-[8px] font-black tracking-[0.2em] text-white/60 uppercase flex items-center gap-2">
              <Wifi className="w-3 h-3 text-emerald-500" /> LIVE NETWORK ACTIVE
            </span>
          </div>
          <div className="flex items-center gap-2 text-white/40">
            <Cpu className="w-3 h-3" />
            <span className="text-[8px] font-black tracking-[0.2em] uppercase">CORE PROCESSOR V4.2</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[12px] font-black text-white tracking-widest">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
            <div className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em]">
              {currentTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' }).toUpperCase()}
            </div>
          </div>
          <button className="text-white/40 hover:text-white transition-colors">
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hidden Scanner Input */}
      <form onSubmit={handleAttendance} className="absolute opacity-0 pointer-events-none">
        <input ref={inputRef} type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="off" />
      </form>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-6">
        
        {/* Background Decorative Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-[400px] h-[400px] border border-blue-500/30 rounded-full animate-[spin_20s_linear_infinite]"></div>
          <div className="absolute w-[500px] h-[500px] border border-blue-500/10 rounded-full animate-[spin_35s_linear_infinite_reverse]"></div>
          <div className="absolute w-[300px] h-[300px] border border-blue-500/50 rounded-full"></div>
        </div>

        {!activeStudent && !feedback ? (
          <div className="flex flex-col items-center gap-10 fade-in z-10">
            {/* Center Scanner Area */}
            <div className="relative group">
              <div className="w-48 h-48 bg-slate-900/50 rounded-[3rem] border border-white/10 flex flex-col items-center justify-center shadow-[0_0_80px_rgba(37,99,235,0.15)] relative overflow-hidden backdrop-blur-md">
                {/* Scanner Line Animation */}
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_15px_#3b82f6] animate-[scan_3s_infinite_ease-in-out]"></div>
                
                <div className="bg-blue-600/10 p-4 rounded-2xl mb-4">
                  <CreditCard className="w-12 h-12 text-blue-500 opacity-80" />
                </div>
                
                <div className="space-y-1">
                  <div className="text-[9px] font-black tracking-[0.3em] text-blue-400 uppercase">PLACE CARD HERE</div>
                  <div className="w-full h-[1px] bg-blue-500/40"></div>
                </div>
              </div>
              
              {/* Outer Decorative Corner Brackets */}
              <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-blue-500 rounded-tl-xl"></div>
              <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-blue-500 rounded-tr-xl"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-blue-500 rounded-bl-xl"></div>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-blue-500 rounded-br-xl"></div>
            </div>

            {/* Status Pill */}
            <div className="bg-blue-600/10 border border-blue-500/20 px-5 py-1.5 rounded-full flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <span className="text-[9px] font-black tracking-[0.2em] text-blue-400 uppercase">SYSTEM STANDBY</span>
            </div>

            {/* Main Title */}
            <div className="text-center space-y-4">
               <h1 className="text-4xl md:text-5xl font-black text-white tracking-[0.2em] uppercase">
                 VERIFIKASI <span className="text-blue-500">PRESENSI</span>
               </h1>
               <div className="max-w-xs mx-auto">
                 <p className="text-[9px] font-bold text-white/40 leading-relaxed tracking-[0.3em] uppercase">
                   SISTEM CERDAS PEMINDAIAN KARTU OLAHRAGA SMP PGRI JATIUWUNG
                 </p>
               </div>
            </div>
          </div>
        ) : (
          <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[4rem] p-12 shadow-2xl fade-in text-center relative overflow-hidden z-10">
            {feedback?.type === 'success' ? (
              <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
            ) : (
              <div className="absolute top-0 left-0 w-full h-2 bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]"></div>
            )}

            <div className={`w-32 h-32 mx-auto rounded-[3rem] flex items-center justify-center mb-8 shadow-inner ${feedback?.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              {feedback?.type === 'success' ? <CheckCircle2 className="w-16 h-16" /> : <XCircle className="w-16 h-16" />}
            </div>

            {activeStudent ? (
              <div className="space-y-4">
                <h1 className="text-4xl font-black text-white uppercase tracking-tight">{activeStudent.name}</h1>
                <p className="text-lg font-bold text-blue-400 tracking-[0.4em] uppercase">{activeStudent.className}</p>
                <div className="pt-8 border-t border-white/5 mt-8">
                  <p className={`font-black text-xs tracking-[0.5em] uppercase ${feedback?.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {feedback?.message}
                  </p>
                  <p className="text-[9px] text-white/30 font-bold uppercase mt-3 tracking-[0.2em]">PADA PUKUL {currentTime.toLocaleTimeString('id-ID')} WIB</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                 <h1 className="text-2xl font-black text-white uppercase tracking-widest">ACCESS DENIED</h1>
                 <p className="text-rose-500 font-bold uppercase tracking-[0.2em]">{feedback?.message}</p>
                 <p className="text-[9px] text-white/20 uppercase tracking-widest mt-4">SILAHKAN HUBUNGI GURU PIKET</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Marquee / Recent History */}
      <div className="shrink-0 w-full bg-[#020617]/80 backdrop-blur-md border-t border-white/5 px-6 py-4 z-20 overflow-hidden">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 shrink-0 bg-white/5 px-4 py-2 rounded-xl">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
             <span className="text-[9px] font-black tracking-widest uppercase text-emerald-500">SISTEM ONLINE</span>
          </div>
          
          <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
          
          <div className="flex-1 overflow-hidden relative">
            <div className={`flex items-center gap-8 ${todayLogs.length > 3 ? 'animate-[marquee_30s_linear_infinite]' : ''}`}>
               {todayLogs.length > 0 ? todayLogs.map((log, idx) => (
                 <div key={idx} className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-black text-white uppercase tracking-wide whitespace-nowrap">{log.studentName}</span>
                    <span className="text-[8px] font-bold text-white/30 tracking-widest uppercase">{log.className}</span>
                    <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                       <span className="text-[8px] font-black text-emerald-500 tracking-tighter">{log.timestamp}</span>
                       <span className="text-[7px] font-bold text-emerald-400/80 uppercase">HADIR</span>
                    </div>
                    {idx !== todayLogs.length - 1 && <div className="w-1.5 h-1.5 rounded-full bg-white/10 mx-2"></div>}
                 </div>
               )) : (
                 <div className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em]">MENUNGGU PEMINDAIAN DATA BARU...</div>
               )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(192px); }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;