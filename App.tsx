
import React, { useState, useEffect, useCallback } from 'react';
import { UserCog, ChevronLeft, GraduationCap, Cloud, RefreshCw, ShieldCheck, Database } from 'lucide-react';
import { AppState } from './types.ts';
import TeacherDashboard from './components/TeacherDashboard.tsx';
import StudentDashboard from './components/StudentDashboard.tsx';
import GradesPortal from './components/GradesPortal.tsx';
import { APP_TITLE, SCHOOL_NAME } from './constants.tsx';
import { supabase } from './supabaseClient.ts';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'teacher' | 'student_portal'>('landing');
  const [studentTab, setStudentTab] = useState<'presence' | 'grades'>('presence');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'loading'>('loading');
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);
  
  const [data, setData] = useState<AppState>({
    students: [],
    semesters: {
      1: { semester: 1, config: { kkm: { '7': 75, '8': 75, '9': 75 }, materials: [
        {id: 'n1', label: 'N1', topic: 'Materi 1'},
        {id: 'n2', label: 'N2', topic: 'Materi 2'},
        {id: 'n3', label: 'N3', topic: 'Materi 3'}
      ] }, grades: {}, attendance: [] },
      2: { semester: 2, config: { kkm: { '7': 75, '8': 75, '9': 75 }, materials: [
        {id: 'n1', label: 'N1', topic: 'Materi 1'},
        {id: 'n2', label: 'N2', topic: 'Materi 2'},
        {id: 'n3', label: 'N3', topic: 'Materi 3'}
      ] }, grades: {}, attendance: [] }
    }
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setDbStatus('loading');
    try {
      let foundData: any = null;
      let source = '';

      // 1. Prioritas Utama: Supabase Cloud (Data Real-time)
      if (supabase) {
        const { data: dbData, error } = await supabase
          .from('app_storage')
          .select('data, updated_at')
          .eq('id', 1)
          .maybeSingle();

        if (error) throw error;

        if (dbData?.data && dbData.data.students) {
          foundData = dbData.data;
          setLastSync(new Date(dbData.updated_at).toLocaleTimeString('id-ID'));
          setDbStatus('online');
          source = 'Supabase Cloud';
        }
      }

      // 2. Fallback: Local Storage (Jika Cloud gagal/kosong)
      if (!foundData) {
        const local = localStorage.getItem('pgri_final_data');
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.students && parsed.students.length > 0) {
            foundData = parsed;
            source = 'Memori Perangkat';
            setDbStatus('offline');
          }
        }
      }

      if (foundData) {
        setData(foundData);
        setRecoveryNotice(`Berhasil Sinkron: ${source}`);
        localStorage.setItem('pgri_final_data', JSON.stringify(foundData));
      } else {
        setDbStatus('online'); // Database terhubung tapi masih kosong
      }
    } catch (err) {
      console.error("Gagal sinkron database:", err);
      setDbStatus('offline');
      setRecoveryNotice("Mode Offline: Gagal ambil data Cloud");
    } finally {
      setIsLoading(false);
      setTimeout(() => setRecoveryNotice(null), 3000);
    }
  }, []);

  const saveData = async (manualData?: AppState) => {
    const dataToSave = manualData || data;
    if (!dataToSave || (dataToSave.students.length === 0 && data.students.length > 0)) return;

    setIsSaving(true);
    try {
      // Simpan Lokal
      localStorage.setItem('pgri_final_data', JSON.stringify(dataToSave));
      
      // Simpan Cloud
      if (supabase) {
        const { error } = await supabase
          .from('app_storage')
          .upsert({ 
            id: 1, 
            data: dataToSave, 
            updated_at: new Date().toISOString() 
          });
        
        if (error) throw error;
        setLastSync(new Date().toLocaleTimeString('id-ID'));
        setDbStatus('online');
      }
    } catch (err) {
      console.error("Gagal simpan ke Cloud:", err);
      setDbStatus('offline');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => { loadData(); }, [loadData]);

  if (isLoading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#020617] text-white">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-500 animate-pulse" />
      </div>
      <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 animate-pulse">Menghubungkan Supabase...</p>
    </div>
  );

  return (
    <div className="h-screen w-full bg-[#020617] overflow-hidden flex flex-col font-['Plus_Jakarta_Sans'] text-slate-200">
      
      {recoveryNotice && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-6 py-3 rounded-full shadow-[0_0_40px_rgba(37,99,235,0.4)] flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">{recoveryNotice}</span>
        </div>
      )}

      {view === 'landing' ? (
        <div className="h-full w-full flex flex-col items-center justify-center p-8 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20"></div>
          
          <div className="mb-16 text-center z-10 scale-in animate-in fade-in duration-700">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight drop-shadow-2xl">{SCHOOL_NAME}</h1>
            <div className="bg-blue-600/10 border border-blue-500/20 px-6 py-2 rounded-full inline-block backdrop-blur-sm">
              <p className="text-blue-400 font-bold tracking-[0.4em] uppercase text-[10px]">{APP_TITLE}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl z-10">
            <button onClick={() => setView('teacher')} className="group bg-slate-900 border border-white/10 p-10 rounded-[2.5rem] hover:border-blue-500/50 hover:bg-slate-800 transition-all flex flex-col items-center text-center relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <UserCog className="w-14 h-14 text-blue-500 mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-black text-white uppercase tracking-wide">Portal Guru</h3>
              <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest">Input Nilai & Absensi</p>
            </button>

            <button onClick={() => setView('student_portal')} className="group bg-blue-600 p-10 rounded-[2.5rem] shadow-[0_0_60px_rgba(37,99,235,0.2)] hover:scale-[1.02] transition-all flex flex-col items-center text-center text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 blur-[50px] rounded-full"></div>
              <GraduationCap className="w-14 h-14 mb-6 group-hover:rotate-12 transition-transform" />
              <h3 className="text-2xl font-black uppercase tracking-wide">Portal Siswa</h3>
              <p className="text-[10px] font-bold text-blue-100 mt-2 uppercase tracking-widest">Cek Nilai Mandiri</p>
            </button>
          </div>

          <div className="mt-16 flex items-center gap-4 bg-white/5 border border-white/5 px-6 py-3 rounded-full backdrop-blur-md z-10 shadow-xl">
            <div className={`w-2 h-2 rounded-full animate-pulse ${dbStatus === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {dbStatus === 'online' ? `DATABASE TERHUBUNG: ${lastSync || 'READY'}` : 'DATABASE OFFLINE / DISCONNECTED'}
            </span>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col bg-[#020617]">
          {/* Top Navbar */}
          <div className="shrink-0 border-b border-white/5 px-6 py-4 flex items-center justify-between bg-slate-950/80 backdrop-blur-md z-50">
            <button onClick={() => setView('landing')} className="group flex items-center gap-3 text-slate-400 hover:text-white font-black text-[10px] uppercase transition-all">
              <div className="bg-white/5 p-1.5 rounded-lg group-hover:bg-blue-600 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </div>
              Menu Utama
            </button>
            <div className="flex items-center gap-6">
              {isSaving && (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  <span className="text-[9px] font-black text-blue-500 uppercase">Saving...</span>
                </div>
              )}
              <div className="text-right border-l border-white/10 pl-6">
                <p className="text-[8px] font-bold text-slate-500 uppercase leading-none mb-1 tracking-widest">Siswa Terdaftar</p>
                <p className="text-[11px] font-black text-blue-500 uppercase tracking-wider">{data.students.length} Orang</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden relative">
            {view === 'teacher' ? (
              <TeacherDashboard data={data} updateData={setData} forceCloudSave={() => saveData()} forceCloudLoad={() => loadData()} />
            ) : (
              <div className="h-full flex flex-col">
                <div className="flex bg-slate-900/80 p-1.5 mx-auto mt-6 rounded-2xl border border-white/5 backdrop-blur-md relative z-10 shadow-2xl">
                  <button onClick={() => setStudentTab('presence')} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${studentTab === 'presence' ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/50' : 'text-slate-500 hover:text-slate-300'}`}>Absensi</button>
                  <button onClick={() => setStudentTab('grades')} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${studentTab === 'grades' ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/50' : 'text-slate-500 hover:text-slate-300'}`}>Cek Nilai</button>
                </div>
                <div className="flex-1 overflow-hidden">
                  {studentTab === 'presence' ? <StudentDashboard data={data} updateData={setData} /> : <GradesPortal data={data} />}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .scale-in { animation: scaleIn 0.5s ease-out forwards; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};

export default App;
