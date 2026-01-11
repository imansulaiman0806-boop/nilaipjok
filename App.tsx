
import React, { useState, useEffect } from 'react';
import { UserCog, ChevronLeft, Loader2, GraduationCap, Search, Activity, LayoutGrid, Clock, ShieldCheck, Zap, Scan, FileText, Info as InfoIcon, DownloadCloud, Smartphone } from 'lucide-react';
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
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#020617]">
      <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
      <span className="text-[10px] font-black tracking-[0.4em] text-white/40 uppercase">Initializing Systems...</span>
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
            <div className="text-center mb-16">
              <h1 className="text-5xl md:text-8xl font-[900] text-white tracking-tighter mb-2 uppercase">
                {SCHOOL_NAME}
              </h1>
              <div className="flex items-center justify-center gap-4">
                <div className="h-[1px] w-12 bg-blue-500/50"></div>
                <p className="text-[10px] md:text-xs font-bold text-blue-400 tracking-[0.5em] uppercase">
                  {APP_TITLE}
                </p>
                <div className="h-[1px] w-12 bg-blue-500/50"></div>
              </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
              
              {/* Portal Guru */}
              <button 
                onClick={() => setView('teacher')}
                className="group bg-slate-900/40 p-12 rounded-[4rem] shadow-2xl border border-white/5 hover:border-blue-500/30 hover:bg-slate-900/60 transition-all duration-500 flex flex-col items-center text-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white mb-8 shadow-[0_20px_40px_rgba(37,99,235,0.3)] group-hover:scale-110 transition-transform duration-500">
                  <UserCog className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-widest mb-3">Portal Pengajar</h3>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] leading-relaxed max-w-[220px]">
                  Pusat Kendali Absensi, Penilaian & Rekapitulasi Digital
                </p>
              </button>

              {/* Portal Siswa (Unified) */}
              <button 
                onClick={() => { setView('student_portal'); setStudentTab('presence'); }}
                className="group bg-slate-900/40 p-12 rounded-[4rem] shadow-2xl border border-white/5 hover:border-emerald-500/30 hover:bg-slate-900/60 transition-all duration-500 flex flex-col items-center text-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white mb-8 shadow-[0_20px_40px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform duration-500">
                  <GraduationCap className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-widest mb-3">Portal Siswa</h3>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] leading-relaxed max-w-[220px]">
                  Akses Mandiri Presensi & Cek Nilai Secara Real-time
                </p>
              </button>

            </div>

            {/* Android Guide Button */}
            <button 
              onClick={() => setView('guide')}
              className="mt-12 flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-3xl transition-all group"
            >
              <Smartphone className="w-5 h-5 text-blue-400 group-hover:animate-bounce" />
              <span className="text-[11px] font-black text-white uppercase tracking-widest">PANDUAN INSTALASI ANDROID</span>
            </button>

            {/* Footer */}
            <div className="mt-24 text-center">
              <p className="text-[9px] font-black text-white/20 tracking-[0.5em] uppercase">
                © 2026 DEPARTEMEN IT SMP PGRI JATIUWUNG
              </p>
            </div>
          </div>
        )}

        {view === 'guide' && (
          <div className="h-full w-full overflow-y-auto flex flex-col items-center p-8 bg-[#020617] fade-in">
             <div className="w-full max-w-2xl">
               <button onClick={() => setView('landing')} className="flex items-center gap-2 text-blue-400 font-black text-[10px] tracking-widest uppercase mb-12">
                 <ChevronLeft className="w-4 h-4" /> Kembali ke Menu Utama
               </button>

               <div className="space-y-12">
                  <div className="text-center">
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">PANDUAN <span className="text-blue-500">ANDROID</span></h2>
                    <p className="text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase">IKUTI LANGKAH INI AGAR APLIKASI MUNCUL DI HP ANDA</p>
                  </div>

                  <div className="grid gap-6">
                    <div className="bg-slate-900/40 p-8 rounded-[2rem] border border-white/5 flex gap-6 items-start">
                       <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black shrink-0 shadow-lg">1</div>
                       <div>
                         <h4 className="text-white font-black uppercase tracking-widest mb-2">Buka Google Chrome</h4>
                         <p className="text-white/40 text-xs leading-relaxed">Buka browser Chrome di HP Anda dan masukkan alamat website aplikasi ini.</p>
                       </div>
                    </div>

                    <div className="bg-slate-900/40 p-8 rounded-[2rem] border border-white/5 flex gap-6 items-start">
                       <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black shrink-0 shadow-lg">2</div>
                       <div>
                         <h4 className="text-white font-black uppercase tracking-widest mb-2">Klik Titik Tiga (⋮)</h4>
                         <p className="text-white/40 text-xs leading-relaxed">Klik ikon titik tiga di pojok kanan atas browser Chrome Anda.</p>
                       </div>
                    </div>

                    <div className="bg-slate-900/40 p-8 rounded-[2rem] border border-white/5 flex gap-6 items-start">
                       <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black shrink-0 shadow-lg">3</div>
                       <div>
                         <h4 className="text-white font-black uppercase tracking-widest mb-2">Pilih "Instal Aplikasi"</h4>
                         <p className="text-white/40 text-xs leading-relaxed">Pilih menu <b>"Instal Aplikasi"</b> atau <b>"Tambahkan ke Layar Utama"</b>.</p>
                       </div>
                    </div>

                    <div className="bg-emerald-500/10 p-8 rounded-[2rem] border border-emerald-500/20 flex gap-6 items-start">
                       <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black shrink-0 shadow-lg">4</div>
                       <div>
                         <h4 className="text-emerald-400 font-black uppercase tracking-widest mb-2">Selesai!</h4>
                         <p className="text-emerald-400/60 text-xs leading-relaxed">Ikon aplikasi akan muncul di layar utama HP Anda seperti aplikasi Play Store.</p>
                       </div>
                    </div>
                  </div>

                  <div className="bg-blue-600/10 p-8 rounded-[2rem] border border-blue-500/20 text-center">
                    <DownloadCloud className="w-8 h-8 text-blue-400 mx-auto mb-4" />
                    <p className="text-white/60 text-[10px] font-bold tracking-[0.2em] uppercase leading-relaxed">
                      APLIKASI INI SUDAH MENDUKUNG TEKNOLOGI PWA (PROGRESSIVE WEB APP) SEHINGGA TIDAK PERLU DOWNLOAD APK MANUAL.
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
            
            {/* Unified Top Bar */}
            <div className="shrink-0 bg-[#020617] border-b border-white/5 px-6 py-3 flex items-center justify-between z-50">
              <button onClick={() => setView('landing')} className="flex items-center gap-2 text-white/30 hover:text-white font-black text-[9px] tracking-[0.3em] uppercase transition-all active:scale-95">
                <ChevronLeft className="w-4 h-4" /> KELUAR PORTAL
              </button>
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[9px] font-black tracking-widest text-white/40 uppercase">STUDENT IDENTITY SECURED</span>
              </div>
            </div>

            {/* View Container */}
            <div className="flex-1 overflow-hidden relative">
              {studentTab === 'presence' && <StudentDashboard data={data} updateData={setData} />}
              {studentTab === 'grades' && <GradesPortal data={data} />}
              {studentTab === 'info' && (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500">
                   <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-500 mb-8 border border-blue-500/20">
                      <InfoIcon className="w-10 h-10" />
                   </div>
                   <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-4">Informasi Akademik</h2>
                   <p className="text-white/40 text-xs font-bold tracking-[0.2em] uppercase leading-loose max-w-lg">
                     Jadwal Olahraga Semester ini tersedia setiap hari Selasa dan Kamis.<br/>
                     Pastikan membawa kartu identitas digital untuk setiap sesi presensi.<br/>
                     Hubungi guru PJOK jika ada kendala data nilai.
                   </p>
                   <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-md">
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                         <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-2">Total Siswa Aktif</p>
                         <p className="text-2xl font-black text-white">{data.students.length}</p>
                      </div>
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                         <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-2">Semester Aktif</p>
                         <p className="text-2xl font-black text-blue-500">{new Date().getMonth() >= 6 ? 'GANJIL' : 'GENAP'}</p>
                      </div>
                   </div>
                </div>
              )}
            </div>

            {/* MODERN FLOATING NAVIGATION DOCK */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[100] w-auto">
               <div className="bg-[#0f172a]/80 backdrop-blur-2xl border border-white/10 p-2 rounded-[2.5rem] flex items-center gap-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <button 
                    onClick={() => setStudentTab('presence')}
                    className={`flex items-center gap-3 px-6 py-3.5 rounded-[2rem] transition-all duration-300 ${studentTab === 'presence' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-white/30 hover:text-white/60'}`}
                  >
                    <Scan className="w-4 h-4" />
                    <span className="text-[10px] font-[900] tracking-[0.2em] uppercase">PRESENSI</span>
                  </button>

                  <button 
                    onClick={() => setStudentTab('grades')}
                    className={`flex items-center gap-3 px-6 py-3.5 rounded-[2rem] transition-all duration-300 ${studentTab === 'grades' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-white/30 hover:text-white/60'}`}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="text-[10px] font-[900] tracking-[0.2em] uppercase">CEK NILAI</span>
                  </button>

                  <div className="w-[1px] h-6 bg-white/5 mx-1"></div>

                  <button 
                    onClick={() => setStudentTab('info')}
                    className={`flex items-center gap-3 px-6 py-3.5 rounded-[2rem] transition-all duration-300 ${studentTab === 'info' ? 'bg-slate-700 text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                  >
                    <InfoIcon className="w-4 h-4" />
                    <span className="text-[10px] font-[900] tracking-[0.2em] uppercase">INFO</span>
                  </button>
               </div>
            </div>

          </div>
        )}
      </main>

      {/* Sync Status Overlay */}
      {isSaving && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 border border-white/10">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
          <span className="text-[9px] font-black tracking-[0.3em] uppercase">Cloud Syncing</span>
        </div>
      )}
    </div>
  );
};

export default App;
