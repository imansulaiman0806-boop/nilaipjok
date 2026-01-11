
import React, { useState, useEffect, useCallback } from 'react';
import { UserCog, ChevronLeft, Loader2, GraduationCap, Search, Activity, LayoutGrid, Clock, ShieldCheck, Zap, Scan, FileText, Info as InfoIcon, DownloadCloud, Smartphone, Download, RefreshCw, AlertTriangle, Cloud } from 'lucide-react';
import { AppState, Gender } from './types.ts';
import TeacherDashboard from './components/TeacherDashboard.tsx';
import StudentDashboard from './components/StudentDashboard.tsx';
import GradesPortal from './components/GradesPortal.tsx';
import { APP_TITLE, SCHOOL_NAME } from './constants.tsx';
import { supabase } from './supabaseClient.ts';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'teacher' | 'student_portal' | 'guide'>('landing');
  const [studentTab, setStudentTab] = useState<'presence' | 'grades' | 'info'>('presence');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  
  const [data, setData] = useState<AppState>({
    students: [],
    semesters: {
      1: { semester: 1, config: { kkm: { '7': 75, '8': 75, '9': 75 }, materials: [] }, grades: {}, attendance: [] },
      2: { semester: 2, config: { kkm: { '7': 75, '8': 75, '9': 75 }, materials: [] }, grades: {}, attendance: [] }
    }
  });

  const loadData = useCallback(async (forceCloud = false) => {
    setIsLoading(true);
    setDbError(null);
    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      const { data: dbData, error } = await supabase
        .from('app_storage')
        .select('data, updated_at')
        .eq('id', 1)
        .maybeSingle();

      if (error) throw error;

      if (dbData?.data) {
        // Jika ada data di cloud, gunakan itu
        setData(dbData.data);
        setLastSync(new Date(dbData.updated_at).toLocaleTimeString());
        localStorage.setItem('pgri_data', JSON.stringify(dbData.data));
        console.log("Data loaded from Cloud");
      } else {
        // Jika cloud kosong, coba ambil dari lokal
        const local = localStorage.getItem('pgri_data');
        if (local) {
          const parsed = JSON.parse(local);
          setData(parsed);
          console.log("Cloud empty, loaded from Local Storage");
        }
      }
    } catch (err: any) {
      setDbError(err.message);
      const local = localStorage.getItem('pgri_data');
      if (local) setData(JSON.parse(local));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveData = async (manualData?: AppState) => {
    const dataToSave = manualData || data;
    // Jangan simpan jika data benar-benar kosong (proteksi)
    if (dataToSave.students.length === 0 && !manualData) {
        console.warn("Prevented saving empty data to cloud");
        localStorage.setItem('pgri_data', JSON.stringify(dataToSave));
        return;
    }

    setIsSaving(true);
    try {
      localStorage.setItem('pgri_data', JSON.stringify(dataToSave));
      if (supabase) {
        const { error } = await supabase
          .from('app_storage')
          .upsert({ id: 1, data: dataToSave, updated_at: new Date().toISOString() });
        if (error) throw error;
        setLastSync(new Date().toLocaleTimeString());
        setDbError(null);
      }
    } catch (err: any) {
      setDbError("Gagal sinkron: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Fix: Added handleInstallClick to resolve missing function error for PWA installation
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    });
    loadData();
  }, [loadData]);

  // Auto-save debounced
  useEffect(() => {
    if (isLoading) return;
    const timeout = setTimeout(() => saveData(), 3000);
    return () => clearTimeout(timeout);
  }, [data]);

  if (isLoading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#020617]">
      <div className="relative mb-6">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-500" />
      </div>
      <span className="text-[10px] font-black tracking-[0.4em] text-white/40 uppercase animate-pulse">Sinkronisasi Cloud...</span>
    </div>
  );

  return (
    <div className="h-full w-full bg-[#020617] overflow-hidden flex flex-col font-['Plus_Jakarta_Sans']">
      {dbError && (
        <div className="bg-rose-600 text-white px-4 py-2 flex items-center justify-between shadow-lg z-[200]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-[9px] font-black tracking-widest uppercase">ERROR: {dbError}</span>
          </div>
          <button onClick={() => loadData()} className="bg-white/20 px-3 py-1 rounded-lg text-[8px] font-black uppercase">RETRY</button>
        </div>
      )}

      <main className="flex-1 relative overflow-hidden">
        {view === 'landing' && (
          <div className="h-full w-full overflow-y-auto flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#020617] to-[#0f172a]">
            
            <div className="mb-8 flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-2 rounded-full shadow-2xl backdrop-blur-md">
              <Cloud className={`w-3.5 h-3.5 ${dbError ? 'text-rose-500' : 'text-emerald-500'}`} />
              <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">
                {lastSync ? `SINKRON: ${lastSync}` : 'MODE LOKAL'}
              </span>
            </div>

            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-8xl font-[900] text-white tracking-tighter mb-2 uppercase">
                {SCHOOL_NAME}
              </h1>
              <div className="flex items-center justify-center gap-4">
                <div className="h-[1px] w-8 bg-blue-500/50"></div>
                <p className="text-[9px] md:text-xs font-bold text-blue-400 tracking-[0.4em] uppercase">
                  {APP_TITLE}
                </p>
                <div className="h-[1px] w-8 bg-blue-500/50"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-8">
              <button 
                onClick={() => setView('teacher')}
                className="group bg-slate-900/40 p-8 rounded-[3rem] shadow-2xl border border-white/5 hover:border-blue-500/30 hover:bg-slate-900/60 transition-all duration-500 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white mb-6 shadow-xl group-hover:scale-110 transition-transform">
                  <UserCog className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">Portal Guru</h3>
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Absensi & Nilai</p>
              </button>

              <button 
                onClick={() => { setView('student_portal'); setStudentTab('presence'); }}
                className="group bg-slate-900/40 p-8 rounded-[3rem] shadow-2xl border border-white/5 hover:border-emerald-500/30 hover:bg-slate-900/60 transition-all duration-500 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 bg-emerald-500 rounded-[1.5rem] flex items-center justify-center text-white mb-6 shadow-xl group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">Portal Siswa</h3>
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Cek Nilai Mandiri</p>
              </button>
            </div>

            <div className="flex flex-col items-center gap-4">
              {showInstallBtn && (
                <button 
                  onClick={handleInstallClick}
                  className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-5 rounded-[2rem] transition-all shadow-2xl animate-bounce"
                >
                  <Download className="w-5 h-5" />
                  <span className="text-xs font-black uppercase tracking-widest">PASANG APLIKASI DI HP</span>
                </button>
              )}
            </div>
          </div>
        )}

        {view === 'teacher' && (
          <div className="h-full flex flex-col fade-in overflow-hidden">
            <div className="shrink-0 bg-white border-b px-6 py-1 flex items-center justify-between">
              <button onClick={() => setView('landing')} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black text-[9px] tracking-widest uppercase transition-colors py-1.5">
                <ChevronLeft className="w-3.5 h-3.5" /> Kembali
              </button>
              <div className="flex items-center gap-2">
                {isSaving && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  {lastSync ? `Sync Terakhir: ${lastSync}` : 'Offline'}
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <TeacherDashboard data={data} updateData={setData} forceCloudSave={() => saveData()} forceCloudLoad={() => loadData(true)} />
            </div>
          </div>
        )}

        {view === 'student_portal' && (
          <div className="h-full flex flex-col fade-in overflow-hidden relative bg-[#020617]">
             {/* Portal Siswa View - Tetap Sama */}
             <div className="shrink-0 bg-[#020617] border-b border-white/5 px-6 py-3 flex items-center justify-between z-50">
              <button onClick={() => setView('landing')} className="flex items-center gap-2 text-white/30 hover:text-white font-black text-[9px] tracking-[0.3em] uppercase transition-all">
                <ChevronLeft className="w-4 h-4" /> KELUAR
              </button>
              <span className="text-[9px] font-black tracking-widest text-emerald-500 uppercase">SINKRON: {lastSync || 'LOKAL'}</span>
            </div>
            <div className="flex-1 overflow-hidden relative">
              {studentTab === 'presence' && <StudentDashboard data={data} updateData={setData} />}
              {studentTab === 'grades' && <GradesPortal data={data} />}
              {studentTab === 'info' && (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                   <InfoIcon className="w-12 h-12 text-blue-500 mb-6" />
                   <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-4">INFO SISTEM</h2>
                   <p className="text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase leading-loose max-w-lg">
                     Data diperbarui secara otomatis setiap ada koneksi internet. Jika nilai tidak muncul, pastikan guru sudah menekan tombol 'SYNC' di Portal Guru.
                   </p>
                </div>
              )}
            </div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[100] w-auto">
               <div className="bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 p-2 rounded-[2rem] flex items-center gap-1 shadow-2xl">
                  <button onClick={() => setStudentTab('presence')} className={`px-5 py-3 rounded-2xl text-[9px] font-black tracking-widest uppercase transition-all ${studentTab === 'presence' ? 'bg-blue-600 text-white' : 'text-white/30'}`}>ABSEN</button>
                  <button onClick={() => setStudentTab('grades')} className={`px-5 py-3 rounded-2xl text-[9px] font-black tracking-widest uppercase transition-all ${studentTab === 'grades' ? 'bg-blue-600 text-white' : 'text-white/30'}`}>NILAI</button>
                  <button onClick={() => setStudentTab('info')} className={`px-5 py-3 rounded-2xl text-[9px] font-black tracking-widest uppercase transition-all ${studentTab === 'info' ? 'bg-blue-600 text-white' : 'text-white/30'}`}>INFO</button>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
