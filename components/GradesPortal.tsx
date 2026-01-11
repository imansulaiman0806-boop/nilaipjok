import React, { useState, useEffect, useRef } from 'react';
import { AppState, AttendanceStatus, Student } from '../types.ts';
import { Activity, Target, Calendar, BadgeCheck, BarChart3, User, GraduationCap, Award, ChevronLeft, Clock, CheckCircle2, XCircle } from 'lucide-react';
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

  const monthToNumber: Record<string, number> = {
    "Januari": 0, "Februari": 1, "Maret": 2, "April": 3, "Mei": 4, "Juni": 5,
    "Juli": 6, "Agustus": 7, "September": 8, "Oktober": 9, "November": 10, "Desember": 11
  };

  const getFullStats = (studentId: string, className: string, targetSem: 1 | 2) => {
    const sem = data.semesters[targetSem];
    const attendanceRecords = sem.attendance.filter(a => a.studentId === studentId);
    const grades = sem.grades[studentId] || { daily: [], pts: 0, pas: 0 };
    const materials = sem.config.materials || [];
    
    const dailyGrades = materials.map((m, idx) => ({
      label: m.label,
      topic: m.topic,
      value: grades.daily[idx] || 0
    }));

    const dailyAvg = materials.length > 0 ? grades.daily.reduce((a, b) => a + (b || 0), 0) / materials.length : 0;
    const match = className.match(/^(\d+)/);
    const kkm = sem.config.kkm[match ? match[1] : '7'] || 75;
    const raportPTS = Math.round((dailyAvg + (grades.pts || 0)) / 2);
    const raportFinal = Math.round((dailyAvg * 2 + (grades.pts || 0) + (grades.pas || 0)) / 4);

    const currentMonths = targetSem === 1 ? MONTHS_SEM1 : MONTHS_SEM2;
    const attendanceGrid = currentMonths.map(month => {
      const targetMonthNum = monthToNumber[month];
      const weeks = [1, 2, 3, 4, 5].map(weekNum => {
        const record = attendanceRecords.find(a => {
          const d = new Date(a.date);
          if (d.getUTCMonth() !== targetMonthNum) return false;
          const week = Math.ceil(d.getUTCDate() / 7);
          return week === weekNum;
        });
        return { week: weekNum, status: record?.status || null };
      });
      return { month, weeks };
    });

    const uniqueDatesInSystem = new Set(sem.attendance.map(a => a.date)).size || 1;
    
    // Penyesuaian Bobot yang sama dengan Dashboard Guru
    const h = attendanceRecords.filter(a => a.status === AttendanceStatus.H).length;
    const d = attendanceRecords.filter(a => a.status === AttendanceStatus.D).length;
    const s = attendanceRecords.filter(a => a.status === AttendanceStatus.S).length;
    const i = attendanceRecords.filter(a => a.status === AttendanceStatus.I).length;
    const a = attendanceRecords.filter(a => a.status === AttendanceStatus.A).length;
    
    const weightedSum = h + d + (s * 0.98) + (i * 0.95) + (a * 0.75);
    const totalRecordedCount = h + d + s + i + a;
    const unrecordedCount = Math.max(0, uniqueDatesInSystem - totalRecordedCount);
    
    const finalScore = weightedSum + unrecordedCount;
    const attendancePercentage = Math.round((finalScore / uniqueDatesInSystem) * 100);

    return { 
      dailyGrades, 
      dailyAvg: Math.round(dailyAvg), 
      pts: grades.pts || 0, 
      pas: grades.pas || 0, 
      raportPTS, 
      raportFinal, 
      kkm, 
      attendanceGrid, 
      attendancePercentage,
      hadirCount: h + d,
      totalMeetings: uniqueDatesInSystem
    };
  };

  const stats = activeStudent ? getFullStats(activeStudent.id, activeStudent.className, viewSemester) : null;

  return (
    <div className="h-full w-full flex flex-col items-center bg-transparent text-white relative overflow-hidden">
      
      <form onSubmit={handleScan} className="absolute opacity-0 pointer-events-none">
        <input ref={inputRef} type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="off" />
      </form>

      {!activeStudent ? (
        <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500 z-10 pb-20">
          <div className="relative mb-12">
            <div className="absolute -inset-12 border border-blue-500/10 rounded-full animate-[spin_15s_linear_infinite]"></div>
            <div className="w-48 h-48 bg-slate-900/40 backdrop-blur-md rounded-[3rem] border border-white/5 flex flex-col items-center justify-center shadow-[0_0_80px_rgba(37,99,235,0.1)] relative">
               <div className="absolute inset-x-0 top-0 h-1 bg-blue-500 shadow-[0_0_15px_#3b82f6] animate-[scan_3s_infinite_ease-in-out]"></div>
               <div className="grid grid-cols-2 gap-1.5 opacity-60">
                  <div className="w-5 h-5 bg-white/20 rounded-sm"></div>
                  <div className="w-5 h-5 bg-blue-500/40 rounded-sm"></div>
                  <div className="w-5 h-5 bg-blue-500/40 rounded-sm"></div>
                  <div className="w-5 h-5 bg-white/20 rounded-sm"></div>
               </div>
               <div className="absolute -bottom-4 bg-blue-600 px-6 py-1 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                  <span className="text-[9px] font-black tracking-[0.3em] text-white uppercase">READY</span>
               </div>
            </div>
          </div>
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-[0.1em] text-white uppercase">CEK <span className="text-blue-500">NILAI</span></h2>
            <p className="text-[10px] md:text-xs font-bold text-white/40 tracking-[0.4em] uppercase">TEMPEL KARTU UNTUK MELIHAT LAPORAN DIGITAL</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full flex flex-col p-4 md:p-6 z-10 animate-in slide-in-from-bottom-8 duration-500 overflow-hidden pb-32">
          
          {/* Compact Profile Header */}
          <div className="shrink-0 flex flex-col md:flex-row items-center justify-between gap-4 mb-4 bg-white/5 backdrop-blur-md p-4 rounded-[2rem] border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-600/20 rounded-2xl border border-blue-500/30 flex items-center justify-center text-blue-500">
                <User className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white uppercase tracking-tight leading-none">{activeStudent.name}</h1>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="bg-blue-600/20 text-blue-400 px-2.5 py-0.5 rounded-lg text-[9px] font-black tracking-widest uppercase border border-blue-500/20">KELAS {activeStudent.className}</span>
                  <span className="text-white/30 text-[9px] font-black tracking-widest uppercase">NIS: {activeStudent.nis}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex bg-slate-950/50 p-1 rounded-xl border border-white/5">
                {[1, 2].map((s) => (
                  <button key={s} onClick={() => setViewSemester(s as 1 | 2)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all ${viewSemester === s ? 'bg-blue-600 text-white shadow-lg' : 'text-white/30 hover:text-white/50'}`}>SEMESTER {s}</button>
                ))}
              </div>
              <button onClick={() => setActiveStudent(null)} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-xl transition-all border border-white/5 text-[9px] font-black tracking-widest text-white/40 uppercase">
                <ChevronLeft className="w-3.5 h-3.5" /> RESET
              </button>
            </div>
          </div>

          {/* Main Content Bento Grid */}
          <div className="flex-1 grid grid-cols-12 grid-rows-6 gap-4 min-0">
            
            <div className="col-span-12 lg:col-span-4 row-span-6 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-6 flex flex-col overflow-hidden">
              <div className="shrink-0 flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-white/60">Detail Nilai Harian</h3>
                </div>
                <div className="bg-blue-600/10 px-3 py-1 rounded-lg border border-blue-500/20">
                  <span className="text-[9px] font-black text-blue-400 uppercase">AVG: {stats?.dailyAvg}</span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {stats?.dailyGrades.length ? stats.dailyGrades.map((g, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center font-black text-[9px] text-blue-400 border border-white/5 shrink-0">{g.label}</div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase text-white/80 truncate leading-none mb-1">{g.topic || 'No Topic'}</p>
                        <p className="text-[7px] font-bold text-white/20 uppercase tracking-widest">PJOK Penilaian</p>
                      </div>
                    </div>
                    <div className={`text-lg font-black shrink-0 ${g.value >= (stats?.kkm || 75) ? 'text-emerald-400' : 'text-rose-400'}`}>{g.value}</div>
                  </div>
                )) : (
                  <div className="h-full flex items-center justify-center text-[9px] font-black text-white/10 uppercase tracking-[0.3em]">Belum ada data nilai</div>
                )}
              </div>
            </div>

            <div className="col-span-12 lg:col-span-8 row-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { label: 'KKM', val: stats?.kkm, icon: Target, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                 { label: 'PTS', val: stats?.pts, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                 { label: 'PAS', val: stats?.pas, icon: Award, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                 { label: 'ABSENSI', val: `${stats?.hadirCount}/${stats?.totalMeetings}`, icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
               ].map((item, i) => (
                 <div key={i} className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-4 rounded-[2rem] flex flex-col items-center justify-center transition-all hover:scale-[1.02]">
                    <div className={`w-8 h-8 ${item.bg} rounded-xl flex items-center justify-center ${item.color} mb-2`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <p className="text-[8px] font-black text-white/20 tracking-[0.2em] uppercase mb-0.5">{item.label}</p>
                    <p className="text-2xl font-black text-white">{item.val}</p>
                 </div>
               ))}
            </div>

            <div className="col-span-12 md:col-span-6 lg:col-span-4 row-span-4 bg-gradient-to-br from-blue-600 to-blue-800 rounded-[3rem] p-6 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 blur-[60px] rounded-full"></div>
               <GraduationCap className="w-12 h-12 text-white/60 mb-4" />
               <p className="text-[10px] font-black text-white/60 tracking-[0.3em] uppercase mb-1">RAPORT AKHIR</p>
               <p className="text-7xl font-black text-white leading-none mb-2">{stats?.raportFinal}</p>
               <div className="flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-sm">
                 <div className={`w-2 h-2 rounded-full ${stats && stats.raportFinal >= stats.kkm ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></div>
                 <span className="text-[9px] font-black tracking-widest uppercase">{stats && stats.raportFinal >= stats.kkm ? 'TUNTAS' : 'BELUM TUNTAS'}</span>
               </div>
            </div>

            <div className="col-span-12 md:col-span-6 lg:col-span-4 row-span-4 flex flex-col gap-4">
               <div className="flex-1 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-5 flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mb-2">
                    <Target className="w-4 h-4" />
                  </div>
                  <p className="text-[8px] font-black text-white/30 tracking-[0.2em] uppercase">RAPORT PTS</p>
                  <p className="text-4xl font-black text-indigo-400">{stats?.raportPTS}</p>
               </div>

               <div className="flex-[2] bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-5 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                       <Calendar className="w-4 h-4 text-emerald-500" />
                       <h3 className="text-[9px] font-black tracking-[0.2em] uppercase text-white/60">Kehadiran</h3>
                    </div>
                    <span className="text-[10px] font-black text-emerald-400">{stats?.attendancePercentage}%</span>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                     {stats?.attendanceGrid.map((m, i) => (
                        <div key={i} className="flex items-center gap-4">
                           <span className="w-14 text-[8px] font-black text-white/30 uppercase tracking-widest shrink-0">{m.month}</span>
                           <div className="flex-1 flex gap-1.5 h-2">
                              {m.weeks.map((w, j) => (
                                <div key={j} className={`flex-1 rounded-full border border-white/5 transition-all ${
                                    w.status === 'H' ? 'bg-emerald-500' : 
                                    w.status === 'S' ? 'bg-amber-500' :
                                    w.status === 'I' ? 'bg-blue-500' :
                                    w.status === 'A' ? 'bg-rose-500' :
                                    w.status === 'D' ? 'bg-violet-500' : 'bg-white/5'
                                }`}></div>
                              ))}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

          </div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(192px); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default GradesPortal;