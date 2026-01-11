
import React, { useState, useEffect } from 'react';
import { UserCog, ChevronLeft, Loader2, GraduationCap, Search, Activity, LayoutGrid, Clock, ShieldCheck, Zap, Scan, FileText, Info as InfoIcon, DownloadCloud, Smartphone, Download } from 'lucide-react';
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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  
  const [data, setData] = useState<AppState>({
    students: [],
    semesters: {
      1: { semester: 1, config: { kkm: { '7': 75, '8': 75, '9': 75 }, materials: [] }, grades: {}, attendance: [] },
      2: { semester: 2, config: { kkm: { '7': 75, '8': 75, '9': 75 }, materials: [] }, grades: {}, attendance: [] }
    }
  });

  useEffect(() => {
    // Logika Pendeteksi Tombol Instal Android
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    });

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

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

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
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#020617]">
      <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
      <span className="text-[10px] font-black tracking-[0.4em] text-white/40 uppercase">SINKRONISASI DATA...</span>
    </div>
  );

  return (
    <div className="h-full w-full bg-[#020617] overflow-hidden flex flex-col font-['Plus_Jakarta_Sans']">
      <main className="flex-1 relative overflow-hidden">
        {view === 'landing' && (
          <div className="h-full w-full overflow-y-auto flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#020617] to-[#0f172a]">
            
            {/* Top Badge */}
            <div className="mb-8 flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-2 rounded-full shadow-2xl backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
              <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">PJOK DIGITAL SMP PGRI</span>
            </div>

            {/* Header Title */}
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

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-8">
              
              {/* Portal Guru */}
              <button 
                onClick={() => setView('teacher')}
                className="group bg-slate-900/40 p-8 rounded-[3rem] shadow-2xl border border-white/5 hover:border-blue-500/30 hover:bg-slate-900/60 transition-all duration-500 flex flex-col items-center text-center relative overflow-hidden"
              >
                <div className="w-20 h-20 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white mb-6 shadow-xl group-hover:scale-110 transition-transform">
                  <UserCog className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">Portal Guru</h3>
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Absensi & Nilai</p>
              </button>

              {/* Portal Siswa */}
              <button 
                onClick={() => { setView('student_portal'); setStudentTab('presence'); }}
                className="group bg-slate-900/40 p-8 rounded-[3rem] shadow-2xl border border-white/5 hover:border-emerald-500/30 hover:bg-slate-900/60 transition-all duration-500 flex flex-col items-center text-center relative overflow-hidden"
              >
                <div className="w-20 h-20 bg-emerald-500 rounded-[1.5rem] flex items-center justify-center text-white mb-6 shadow-xl group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">Portal Siswa</h3>
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Cek Nilai Mandiri</p>
              </button>

            </div>

            {/* Tombol Instal Pintar */}
            {showInstallBtn ? (
              <button 
                onClick={handleInstallClick}
                className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-5 rounded-[2rem] transition-all shadow-2xl animate-bounce"
              >
                <Download className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">PASANG APLIKASI DI HP</span>
              </button>
            ) : (
              <button 
                onClick={() => setView('guide')}
                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-3xl transition-all group"
              >
                <Smartphone className="w-5 h-5 text-blue-400 group-hover:animate-bounce" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">PANDUAN INSTALASI</span>
              </button>
            )}

            {/* Footer */}
            <div className="mt-12 text-center">
              <p className="text-[8px] font-black text-white/20 tracking-[0.5em] uppercase">
                © 2026 PJOK DIGITAL PGRI
              </p>
            </div>
          </div>
        )}

        {view === 'guide' && (
          <div className="h-full w-full overflow-y-auto flex flex-col items-center p-8 bg-[#020617] fade-in">
             <div className="w-full max-w-2xl">
               <button onClick={() => setView('landing')} className="flex items-center gap-2 text-blue-400 font-black text-[10px] tracking-widest uppercase mb-12">
                 <ChevronLeft className="w-4 h-4" /> Kembali
               </button>

               <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">CARA JADI <span className="text-blue-500">APLIKASI</span></h2>
                    <p className="text-white/40 text-[9px] font-bold tracking-[0.2em] uppercase">IKUTI 3 LANGKAH MUDAH INI</p>
                  </div>

                  <div className="grid gap-4">
                    <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 flex gap-4 items-center">
                       <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shrink-0">1</div>
                       <p className="text-white/60 text-[11px] leading-relaxed font-bold uppercase tracking-wider">Buka Link ini di Google Chrome HP</p>
                    </div>

                    <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 flex gap-4 items-center">
                       <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shrink-0">2</div>
                       <p className="text-white/60 text-[11px] leading-relaxed font-bold uppercase tracking-wider">Klik Titik Tiga (⋮) di Kanan Atas Chrome</p>
                    </div>

                    <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 flex gap-4 items-center">
                       <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shrink-0">3</div>
                       <p className="text-white/60 text-[11px] leading-relaxed font-bold uppercase tracking-wider">Pilih "Instal Aplikasi" atau "Tambah ke Layar Utama"</p>
                    </div>
                  </div>

                  <div className="bg-blue-600/10 p-8 rounded-[2rem] border border-blue-500/20 text-center">
                    <Smartphone className="w-8 h-8 text-blue-400 mx-auto mb-4" />
                    <p className="text-white/60 text-[9px] font-black tracking-[0.2em] uppercase leading-loose">
                      Setelah selesai, ikon aplikasi akan muncul di menu HP Anda seperti aplikasi Play Store.
                    </p>
                  </div>
               </div>
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

        {view === 'student_portal' && (
          <div className="h-full flex flex-col fade-in overflow-hidden relative bg-[#020617]">
            <div className="shrink-0 bg-[#020617] border-b border-white/5 px-6 py-3 flex items-center justify-between z-50">
              <button onClick={() => setView('landing')} className="flex items-center gap-2 text-white/30 hover:text-white font-black text-[9px] tracking-[0.3em] uppercase transition-all active:scale-95">
                <ChevronLeft className="w-4 h-4" /> KELUAR
              </button>
              <span className="text-[9px] font-black tracking-widest text-emerald-500 uppercase">PORTAL SISWA AKTIF</span>
            </div>
            <div className="flex-1 overflow-hidden relative">
              {studentTab === 'presence' && <StudentDashboard data={data} updateData={setData} />}
              {studentTab === 'grades' && <GradesPortal data={data} />}
              {studentTab === 'info' && (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500">
                   <InfoIcon className="w-12 h-12 text-blue-500 mb-6" />
                   <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-4">PENGUMUMAN</h2>
                   <p className="text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase leading-loose max-w-lg">
                     Aplikasi ini digunakan untuk memantau kehadiran dan nilai PJOK secara transparan.
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

      {isSaving && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl shadow-2xl animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span className="text-[8px] font-black tracking-[0.2em] uppercase">SYNC</span>
        </div>
      )}
    </div>
  );
};

export default App;
