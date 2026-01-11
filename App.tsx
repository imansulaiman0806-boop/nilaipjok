import React, { useState, useEffect } from 'react';
import { UserCog, ChevronLeft, Loader2, GraduationCap, Search, Activity, LayoutGrid, Clock, ShieldCheck, Zap } from 'lucide-react';
import { AppState, Gender } from './types.ts';
import TeacherDashboard from './components/TeacherDashboard.tsx';
import StudentDashboard from './components/StudentDashboard.tsx';
import GradesPortal from './components/GradesPortal.tsx';
import { APP_TITLE, SCHOOL_NAME } from './constants.tsx';
import { supabase } from './supabaseClient.ts';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'teacher' | 'student' | 'grades'>('landing');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [data, setData] = useState<AppState>({
    students: [],
    semesters: {
      1: { semester: 1, config: { kkm: { '7': 75, '8': 75, '9': 75 }, materials: [] }, grades: {}, attendance: [] },
      2: { semester: 2, config: { kkm: { '7': 75, '8': 75, '9': 75 }, materials: [] }, grades: {}, attendance: [] }
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (supabase) {
          const { data: dbData } = await supabase.from('app_storage').select('data').eq('id', 1).single();
          if (dbData?.data) {
            setData(dbData.data);
          } else {
            const local = localStorage.getItem('pgri_data');
            if (local) setData(JSON.parse(local));
          }
        }
      } catch (err) {
        console.error("Fetch failed");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const save = async () => {
      setIsSaving(true);
      localStorage.setItem('pgri_data', JSON.stringify(data));
      if (supabase) {
        await supabase.from('app_storage').update({ data }).eq('id', 1);
      }
      setIsSaving(false);
    };
    const timeout = setTimeout(save, 2000);
    return () => clearTimeout(timeout);
  }, [data, isLoading]);

  if (isLoading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f4f7fa]">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
      <span className="text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">Loading System...</span>
    </div>
  );

  return (
    <div className="h-full w-full bg-[#f4f7fa] overflow-hidden flex flex-col font-['Plus_Jakarta_Sans']">
      <main className="flex-1 relative overflow-hidden">
        {view === 'landing' && (
          <div className="h-full w-full overflow-y-auto flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#f8fbfe] to-[#edf3f9]">
            
            {/* Top Badge */}
            <div className="mb-8 flex items-center gap-2 bg-white border border-slate-200 px-5 py-2 rounded-full shadow-sm">
              <Zap className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">PJOK DIGITAL SMP PGRI</span>
            </div>

            {/* Header Title */}
            <div className="text-center mb-16">
              <h1 className="text-5xl md:text-7xl font-[900] text-[#1e293b] tracking-tight mb-2 uppercase">
                {SCHOOL_NAME}
              </h1>
              <p className="text-[11px] md:text-xs font-bold text-slate-400 tracking-[0.4em] uppercase">
                {APP_TITLE}
              </p>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
              
              {/* Portal Guru */}
              <button 
                onClick={() => setView('teacher')}
                className="group bg-white p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-transparent hover:border-blue-500/20 hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white mb-8 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                  <UserCog className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-extrabold text-[#1e293b] uppercase tracking-wide mb-3">Portal Guru</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-[180px]">
                  Manajemen Absensi, Nilai & Rekapitulasi Data
                </p>
              </button>

              {/* Portal Siswa (Presensi) */}
              <button 
                onClick={() => setView('student')}
                className="group bg-white p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-transparent hover:border-emerald-500/20 hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 bg-emerald-500 rounded-[1.5rem] flex items-center justify-center text-white mb-8 shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-extrabold text-[#1e293b] uppercase tracking-wide mb-3">Portal Siswa</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-[180px]">
                  Dashboard Kehadiran & Absensi Mandiri
                </p>
              </button>

              {/* Portal Nilai */}
              <button 
                onClick={() => setView('grades')}
                className="group bg-white p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-transparent hover:border-indigo-500/20 hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white mb-8 shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                  <Search className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-extrabold text-[#1e293b] uppercase tracking-wide mb-3">Portal Nilai</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-[180px]">
                  Cek Nilai PJOK Cukup Tap Kartu Siswa
                </p>
              </button>

            </div>

            {/* Footer */}
            <div className="mt-24 text-center">
              <div className="w-12 h-[3px] bg-blue-500/30 mx-auto mb-6 rounded-full"></div>
              <p className="text-[10px] font-bold text-slate-400 tracking-[0.4em] uppercase">
                © 2026 DEPARTEMEN IT SMP PGRI JATIUWUNG
              </p>
            </div>
          </div>
        )}

        {view === 'teacher' && (
          <div className="h-full flex flex-col fade-in overflow-hidden">
            <div className="shrink-0 bg-white border-b px-6 py-1 flex items-center gap-4">
              <button onClick={() => setView('landing')} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black text-[9px] tracking-widest uppercase transition-colors py-1.5">
                <ChevronLeft className="w-3.5 h-3.5" /> Kembali
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <TeacherDashboard data={data} updateData={setData} />
            </div>
          </div>
        )}

        {view === 'student' && (
          <div className="h-full flex flex-col fade-in overflow-hidden">
            <div className="shrink-0 bg-[#0F172A] border-b border-white/5 px-6 py-2 flex items-center gap-4">
              <button onClick={() => setView('landing')} className="flex items-center gap-2 text-white/40 hover:text-white font-black text-[10px] tracking-widest uppercase transition-colors py-2">
                <ChevronLeft className="w-4 h-4" /> Kembali
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <StudentDashboard data={data} updateData={setData} />
            </div>
          </div>
        )}

        {view === 'grades' && (
          <div className="h-full flex flex-col fade-in overflow-hidden">
            <div className="shrink-0 bg-[#020617] border-b border-white/5 px-6 py-2 flex items-center gap-4">
              <button onClick={() => setView('landing')} className="flex items-center gap-2 text-white/40 hover:text-white font-black text-[10px] tracking-widest uppercase transition-colors py-2">
                <ChevronLeft className="w-4 h-4" /> Kembali
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <GradesPortal data={data} />
            </div>
          </div>
        )}
      </main>

      {/* Sync Status Overlay */}
      {isSaving && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
          <span className="text-[8px] font-black tracking-widest uppercase">Syncing Cloud</span>
        </div>
      )}
    </div>
  );
};

export default App;