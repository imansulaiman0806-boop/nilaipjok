
import React, { useState } from 'react';
import { AppState, AttendanceStatus, Gender, Student, MaterialInfo } from '../types.ts';
import { 
  Users, Clock, Check, Plus, Search, Pencil, Trash2, 
  Database, X, Save, Award, FileSpreadsheet, Download, RefreshCw, 
  AlertTriangle, Copy, ChevronDown, LogOut, Settings, Calendar, MinusCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { MONTHS_SEM1, MONTHS_SEM2 } from '../constants.tsx';

interface Props {
  data: AppState;
  updateData: (data: AppState) => void;
  forceCloudSave: () => Promise<void>;
  forceCloudLoad: () => Promise<void>;
}

const TeacherDashboard: React.FC<Props> = ({ data, updateData, forceCloudSave, forceCloudLoad }) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'grading' | 'recap' | 'students' | 'cloud'>('attendance');
  const [recapMode, setRecapMode] = useState<'grades' | 'attendance'>('grades');
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(1);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [classFilter, setClassFilter] = useState<string>('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [newStudent, setNewStudent] = useState({ name: '', nis: '', cardId: '', className: '', gender: Gender.L });
  const [toast, setToast] = useState<string | null>(null);

  const semesterData = data.semesters[selectedSemester];
  const classes = ['Semua', ...Array.from(new Set(data.students.map(s => s.className)))].sort();
  
  const filteredStudents = data.students
    .filter(s => (classFilter === 'Semua' || s.className === classFilter))
    .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.nis.includes(searchTerm))
    .sort((a, b) => a.name.localeCompare(b.name));

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  // --- HELPERS ---

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getKKM = (className: string) => {
    const level = className.match(/\d+/)?.[0] || '7';
    return semesterData.config.kkm[level] || 75;
  };

  // --- GRADING LOGIC ---

  const updateGrade = (studentId: string, field: 'pts' | 'pas' | 'daily' | 'ptsRemedial' | 'pasRemedial' | 'dailyRemedial', value: number, dailyIdx?: number) => {
    const newGrades = { ...semesterData.grades };
    if (!newGrades[studentId]) newGrades[studentId] = { daily: [], pts: 0, pas: 0, dailyRemedial: [], ptsRemedial: 0, pasRemedial: 0 };
    
    // Ensure arrays exist
    if (!newGrades[studentId].daily) newGrades[studentId].daily = [];
    if (!newGrades[studentId].dailyRemedial) newGrades[studentId].dailyRemedial = [];

    if ((field === 'daily' || field === 'dailyRemedial') && dailyIdx !== undefined) {
      const arr = [...(newGrades[studentId][field] || [])];
      arr[dailyIdx] = value;
      newGrades[studentId][field] = arr;
    } else if (field !== 'daily' && field !== 'dailyRemedial') {
      (newGrades[studentId] as any)[field] = value;
    }

    updateData({
      ...data,
      semesters: {
        ...data.semesters,
        [selectedSemester]: { ...semesterData, grades: newGrades }
      }
    });
  };

  const calculateStats = (studentId: string) => {
    const g = semesterData.grades[studentId] || { daily: [], pts: 0, pas: 0 };
    const materials = semesterData.config.materials;
    
    // Rata-rata Harian
    let dailySum = 0;
    let dailyCount = 0;
    materials.forEach((_, idx) => {
      dailySum += (g.daily[idx] || 0);
      dailyCount++;
    });
    const avgDaily = dailyCount > 0 ? dailySum / dailyCount : 0;

    // Raport PTS = (Rata2 + PTS) / 2
    const raportPTS = Math.round((avgDaily + (g.pts || 0)) / 2);

    // Raport PAS = (Rata2 + PTS + PAS) / 3 
    const raportPAS = Math.round((avgDaily + (g.pts || 0) + (g.pas || 0)) / 3);

    return { avgDaily: Math.round(avgDaily), raportPTS, raportPAS };
  };

  // --- ATTENDANCE LOGIC ---

  const toggleAttendance = (studentId: string, status: AttendanceStatus) => {
    const newAttendance = [...semesterData.attendance];
    const idx = newAttendance.findIndex(a => a.studentId === studentId && a.date === attendanceDate);
    
    if (idx > -1) {
      if (newAttendance[idx].status === status) {
        newAttendance.splice(idx, 1);
      } else {
        newAttendance[idx].status = status;
        // Reset note if changing status from D to something else (optional, but cleaner)
        if (status !== AttendanceStatus.D) {
             delete newAttendance[idx].notes;
        }
      }
    } else {
      newAttendance.push({ 
        studentId, 
        date: attendanceDate, 
        status, 
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
      });
    }

    updateData({
      ...data,
      semesters: {
        ...data.semesters,
        [selectedSemester]: { ...semesterData, attendance: newAttendance }
      }
    });
  };

  const updateAttendanceNote = (studentId: string, note: string) => {
    const newAttendance = [...semesterData.attendance];
    const idx = newAttendance.findIndex(a => a.studentId === studentId && a.date === attendanceDate);
    
    if (idx > -1) {
      newAttendance[idx].notes = note;
      updateData({
        ...data,
        semesters: {
          ...data.semesters,
          [selectedSemester]: { ...semesterData, attendance: newAttendance }
        }
      });
    }
  };

  const getAttendanceStats = (studentId: string) => {
    const recs = semesterData.attendance.filter(a => a.studentId === studentId);
    const h = recs.filter(a => a.status === AttendanceStatus.H).length;
    const i = recs.filter(a => a.status === AttendanceStatus.I).length;
    const s = recs.filter(a => a.status === AttendanceStatus.S).length;
    const a = recs.filter(a => a.status === AttendanceStatus.A).length;
    const d = recs.filter(a => a.status === AttendanceStatus.D).length;
    
    const total = h + i + s + a + d;
    
    // LOGIKA PERHITUNGAN PERSENTASE (SISTEM POIN 100%)
    let currentPercent = 100;
    currentPercent -= (s * 2);
    currentPercent -= (i * 4);
    currentPercent -= (a * 6);

    const percent = Math.max(0, currentPercent);
    
    return { h, i, s, a, d, total, percent };
  };

  // --- CONFIGURATION LOGIC ---
  const handleConfigUpdate = (newConfig: any) => {
    updateData({
      ...data,
      semesters: {
        ...data.semesters,
        [selectedSemester]: { ...semesterData, config: { ...semesterData.config, ...newConfig } }
      }
    });
  };

  const addMaterial = () => {
    const newMats = [...semesterData.config.materials, { 
      id: `n${semesterData.config.materials.length + 1}`, 
      label: `PH${semesterData.config.materials.length + 1}`, 
      topic: 'Materi Baru' 
    }];
    handleConfigUpdate({ materials: newMats });
  };

  const removeMaterial = (idx: number) => {
    const newMats = [...semesterData.config.materials];
    newMats.splice(idx, 1);
    handleConfigUpdate({ materials: newMats });
  };

  // --- EXPORT ---

  const exportExcel = () => {
    let fileName = `PJOK_Data_${classFilter}_Sem${selectedSemester}`;
    let rows: any[] = [];

    // --- CASE 1: REKAP ABSENSI (MATRIX BULANAN) ---
    if (activeTab === 'recap' && recapMode === 'attendance') {
      fileName = `Absensi_Bulanan_Kls${classFilter}_Sem${selectedSemester}`;
      const months = selectedSemester === 1 ? MONTHS_SEM1 : MONTHS_SEM2;
      
      rows = filteredStudents.map((s, idx) => {
        const attStats = getAttendanceStats(s.id);
        const recs = semesterData.attendance.filter(a => a.studentId === s.id);
        
        // Base Row
        const row: any = {
          'No': idx + 1,
          'NIS': s.nis,
          'Nama Siswa': s.name,
          'L/P': s.gender,
          'Kelas': s.className,
        };

        // Monthly Matrix Columns
        months.forEach((m) => {
          const monthIdx = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].indexOf(m);
          
          [1, 2, 3, 4, 5].forEach(week => {
             const found = recs.find(r => {
                const d = new Date(r.date);
                if (d.getMonth() !== monthIdx) return false;
                const w = Math.ceil(d.getDate() / 7);
                return w === week;
             });
             // Show Status. If Dispensasi, show status + note
             let cellValue = found ? found.status : '-';
             if (found && found.status === AttendanceStatus.D && found.notes) {
                cellValue = `D (${found.notes})`;
             }
             row[`${m} M${week}`] = cellValue;
          });
        });

        // Summary Columns
        row['Sakit (S)'] = attStats.s;
        row['Izin (I)'] = attStats.i;
        row['Alpa (A)'] = attStats.a;
        row['Dispen (D)'] = attStats.d;
        row['Hadir (H)'] = attStats.h;
        row['% Kehadiran'] = `${attStats.percent}%`;

        return row;
      });

    // --- CASE 2: GRADING & GENERAL STUDENT DATA ---
    } else {
      // Default to Grading Export (includes Grades + Students + Stats)
      fileName = `Nilai_Siswa_Kls${classFilter}_Sem${selectedSemester}`;
      
      rows = filteredStudents.map((s, idx) => {
        const stats = calculateStats(s.id);
        const att = getAttendanceStats(s.id);
        const g = semesterData.grades[s.id] || { daily: [], pts: 0, pas: 0 };
        
        const row: any = {
          'No': idx + 1,
          'NIS': s.nis,
          'Nama': s.name,
          'L/P': s.gender,
          'Kelas': s.className,
        };

        // Dynamic Materials
        semesterData.config.materials.forEach((m, i) => {
          row[`${m.label} (${m.topic})`] = g.daily[i] || 0;
        });

        // Fixed Grade Columns
        row['Rata2 Harian'] = stats.avgDaily;
        row['Nilai PTS'] = g.pts || 0;
        row['Nilai PAS'] = g.pas || 0;
        row['R.PTS'] = stats.raportPTS;
        row['R.PAS'] = stats.raportPAS;

        // Remedial Columns (if needed, adds clarity in Excel)
        if (activeTab === 'recap') {
          row['Perbaikan PAS'] = g.pasRemedial || '-';
        }

        // Attendance Summary
        row['Jml Hadir'] = att.h;
        row['Jml Dispen'] = att.d;
        row['Persentase'] = `${att.percent}%`;

        return row;
      });
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Export");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  return (
    <div className="h-full flex flex-col bg-[#020617] text-slate-200 font-['Plus_Jakarta_Sans']">
      
      {/* 1. TOP NAVBAR */}
      <div className="bg-slate-900 border-b border-white/5 shadow-lg z-30">
        <div className="px-4 py-3 flex items-center justify-between overflow-x-auto gap-4 custom-scrollbar">
          <div className="flex items-center gap-1">
            {[
              { id: 'attendance', label: 'Absensi', icon: Clock },
              { id: 'grading', label: 'Input Nilai', icon: Award },
              { id: 'recap', label: 'Rekap & Laporan', icon: FileSpreadsheet },
              { id: 'students', label: 'Data Siswa', icon: Users },
              { id: 'cloud', label: 'Database', icon: Database }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-105' 
                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            ))}
          </div>
          <button onClick={() => window.location.reload()} className="hidden md:flex items-center gap-2 text-rose-500 bg-rose-500/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all ml-4">
            <LogOut className="w-3.5 h-3.5" /> Keluar
          </button>
        </div>
      </div>

      {/* 2. FILTER & TOOLBAR */}
      {activeTab !== 'cloud' && (
        <div className="p-4 md:p-6 bg-[#020617] sticky top-0 z-20">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/50 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
            
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
               <div className="relative w-full md:w-64">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                 <input type="text" placeholder="CARI NAMA / NIS..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase outline-none focus:border-blue-500 placeholder:text-slate-600 transition-all" />
               </div>
               <div className="flex bg-slate-800 p-1 rounded-xl border border-white/5 shrink-0">
                 <button onClick={() => setSelectedSemester(1)} className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${selectedSemester === 1 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Sem 1</button>
                 <button onClick={() => setSelectedSemester(2)} className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${selectedSemester === 2 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Sem 2</button>
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
               <div className="relative">
                 <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="appearance-none bg-slate-800 border border-white/5 text-white pl-4 pr-9 py-2.5 rounded-xl text-[10px] font-bold uppercase outline-none focus:border-blue-500 cursor-pointer shadow-sm">
                    {classes.map(c => <option key={c} value={c}>{c === 'Semua' ? 'Semua Kelas' : `Kelas ${c}`}</option>)}
                 </select>
                 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
               </div>

               {/* SHOW DATE PICKER ON ATTENDANCE OR GRADING TAB */}
               {(activeTab === 'attendance' || activeTab === 'grading') && (
                 <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="bg-slate-800 border border-white/5 px-4 py-2.5 rounded-xl text-[10px] font-black text-blue-400 outline-none uppercase shadow-sm" />
               )}
               
               {(activeTab === 'grading' || activeTab === 'recap') && (
                 <button onClick={exportExcel} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-emerald-500 shadow-lg">
                   <Download className="w-3.5 h-3.5" /> Download Excel
                 </button>
               )}

               {activeTab === 'grading' && (
                 <button onClick={() => setShowConfigModal(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-indigo-500 shadow-lg shadow-indigo-900/20">
                   <Settings className="w-3.5 h-3.5" /> Konfigurasi
                 </button>
               )}

               {activeTab === 'students' && (
                 <>
                   <button onClick={exportExcel} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-emerald-500 shadow-lg">
                     <Download className="w-3.5 h-3.5" /> Excel
                   </button>
                   <button onClick={() => { setEditingStudent(null); setNewStudent({name:'', nis:'', cardId:'', className:'', gender:Gender.L}); setShowAddModal(true); }} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-blue-500 shadow-lg">
                     <Plus className="w-3.5 h-3.5" /> Siswa
                   </button>
                 </>
               )}
            </div>
          </div>
        </div>
      )}

      {/* 3. CONTENT AREA */}
      <div className="flex-1 overflow-auto px-4 md:px-6 pb-6 relative">
        
        {/* RECAP SUB-MENU */}
        {activeTab === 'recap' && (
          <div className="flex justify-center mb-6">
             <div className="bg-slate-900 p-1 rounded-xl border border-white/10 flex">
                <button onClick={() => setRecapMode('grades')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${recapMode === 'grades' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>Rekap Nilai</button>
                <button onClick={() => setRecapMode('attendance')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${recapMode === 'attendance' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>Rekap Absensi</button>
             </div>
          </div>
        )}

        {/* --- MAIN TABLES --- */}
        {activeTab !== 'cloud' && (
          <div className="bg-slate-900 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="overflow-x-auto">
               <table className="w-full border-collapse text-left">
                  <thead className="bg-slate-950 border-b border-white/5">
                    <tr>
                      <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase w-12 text-center sticky left-0 bg-slate-950 z-10">No</th>
                      <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase sticky left-12 bg-slate-950 z-10 w-64">Identitas Siswa</th>
                      
                      {activeTab === 'attendance' && (
                        <>
                          <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase text-center w-24">Gender</th>
                          <th className="px-4 py-4 text-[9px] font-black text-blue-500 uppercase text-center w-64">Input Kehadiran</th>
                          <th className="px-2 py-4 text-[9px] font-black text-emerald-500 uppercase text-center w-12">H</th>
                          <th className="px-2 py-4 text-[9px] font-black text-amber-500 uppercase text-center w-12">S</th>
                          <th className="px-2 py-4 text-[9px] font-black text-blue-400 uppercase text-center w-12">I</th>
                          <th className="px-2 py-4 text-[9px] font-black text-rose-500 uppercase text-center w-12">A</th>
                          <th className="px-2 py-4 text-[9px] font-black text-violet-500 uppercase text-center w-12">D</th>
                          <th className="px-4 py-4 text-[9px] font-black text-white uppercase text-center">% Hadir</th>
                        </>
                      )}

                      {(activeTab === 'grading' || (activeTab === 'recap' && recapMode === 'grades')) && (
                        <>
                          {semesterData.config.materials.map((m) => (
                             <th key={m.id} className="px-2 py-4 text-[9px] font-black text-slate-500 uppercase text-center min-w-[60px]">
                               {m.label}
                               <div className="text-[7px] font-normal text-slate-600 truncate max-w-[50px] mx-auto">{m.topic}</div>
                             </th>
                          ))}
                          <th className="px-2 py-4 text-[9px] font-black text-white uppercase text-center bg-white/5 min-w-[60px]">Rata2</th>
                          <th className="px-2 py-4 text-[9px] font-black text-blue-500 uppercase text-center min-w-[70px]">PTS</th>
                          <th className="px-2 py-4 text-[9px] font-black text-amber-500 uppercase text-center min-w-[70px]">PAS</th>
                          
                          <th className="px-4 py-4 text-[9px] font-black text-emerald-500 uppercase text-center bg-emerald-500/10 min-w-[80px]">R.PTS</th>
                          <th className="px-4 py-4 text-[9px] font-black text-indigo-500 uppercase text-center bg-indigo-500/10 min-w-[80px]">R.PAS</th>

                          {activeTab === 'recap' && recapMode === 'grades' && (
                             <th className="px-4 py-4 text-[9px] font-black text-rose-400 uppercase text-center border-l border-white/10 min-w-[150px]">
                               Perbaikan (Remedial)
                               <div className="text-[7px] font-normal">Edit Nilai Akhir</div>
                             </th>
                          )}
                        </>
                      )}

                      {activeTab === 'recap' && recapMode === 'attendance' && (
                        (() => {
                          const months = selectedSemester === 1 ? MONTHS_SEM1 : MONTHS_SEM2;
                          return months.map(m => (
                            <th key={m} className="px-2 py-4 text-[9px] font-black text-slate-500 uppercase text-center border-l border-white/5 min-w-[120px]">
                              {m}
                              <div className="grid grid-cols-5 gap-0.5 mt-1 text-[7px] text-slate-600">
                                <span>M1</span><span>M2</span><span>M3</span><span>M4</span><span>M5</span>
                              </div>
                            </th>
                          ));
                        })()
                      )}

                      {activeTab === 'students' && <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase text-right">Opsi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredStudents.length > 0 ? filteredStudents.map((s, idx) => {
                      const g = semesterData.grades[s.id] || { daily: [], pts: 0, pas: 0, dailyRemedial: [], ptsRemedial: 0, pasRemedial: 0 };
                      const stats = calculateStats(s.id);
                      const attStats = getAttendanceStats(s.id);
                      
                      // UPDATED LOGIC: CHECK BOTH SEMESTERS FOR ATTENDANCE ON SELECTED DATE
                      const attToday = 
                        data.semesters[1]?.attendance.find(a => a.studentId === s.id && a.date === attendanceDate) || 
                        data.semesters[2]?.attendance.find(a => a.studentId === s.id && a.date === attendanceDate);

                      const todayStatus = attToday?.status;
                      const todayNote = attToday?.notes;
                      const kkm = getKKM(s.className);

                      return (
                        <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-4 py-3 text-[10px] font-bold text-slate-600 text-center sticky left-0 bg-slate-900 group-hover:bg-[#1e293b]">{idx + 1}</td>
                          <td className="px-4 py-3 sticky left-12 bg-slate-900 group-hover:bg-[#1e293b]">
                             <div className="flex items-center gap-3">
                               <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${s.gender === Gender.L ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'}`}>
                                 {getInitials(s.name)}
                               </div>
                               <div>
                                 <div className="text-[11px] font-bold text-slate-200 uppercase">{s.name}</div>
                                 <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                   <span className="text-[9px] text-slate-500">{s.nis}</span>
                                   <span className="text-[9px] bg-white/5 px-1 rounded text-slate-400">{s.className}</span>
                                   
                                   {/* ABSENCE INDICATORS FOR TODAY - VISIBLE IN ALL TABS */}
                                   {todayStatus === AttendanceStatus.D && (
                                     <span className="bg-violet-500/20 text-violet-400 border border-violet-500/50 px-1.5 py-0.5 rounded text-[8px] font-black uppercase animate-pulse">
                                       DISPEN {todayNote ? `(${todayNote})` : ''}
                                     </span>
                                   )}
                                   {todayStatus === AttendanceStatus.S && (
                                     <span className="bg-amber-500/20 text-amber-400 border border-amber-500/50 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">
                                       SAKIT
                                     </span>
                                   )}
                                   {todayStatus === AttendanceStatus.I && (
                                     <span className="bg-blue-500/20 text-blue-400 border border-blue-500/50 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">
                                       IZIN
                                     </span>
                                   )}
                                   {todayStatus === AttendanceStatus.A && (
                                     <span className="bg-rose-500/20 text-rose-400 border border-rose-500/50 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">
                                       ALPA
                                     </span>
                                   )}
                                 </div>
                               </div>
                             </div>
                          </td>

                          {activeTab === 'attendance' && (
                            <>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-1 rounded text-[9px] font-black ${s.gender === Gender.L ? 'bg-blue-900/30 text-blue-400' : 'bg-pink-900/30 text-pink-400'}`}>{s.gender}</span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-2">
                                  <div className="flex justify-center gap-1.5">
                                    {[{s:'H',c:'blue'},{s:'I',c:'blue'},{s:'S',c:'amber'},{s:'A',c:'rose'},{s:'D',c:'violet'}].map(item => (
                                      <button key={item.s} onClick={() => toggleAttendance(s.id, item.s as any)} className={`w-8 h-8 rounded-lg text-[10px] font-black border transition-all ${todayStatus === item.s ? `bg-${item.c}-600 border-${item.c}-500 text-white shadow` : 'bg-slate-800 border-white/5 text-slate-500 hover:bg-white/5'}`}>{item.s}</button>
                                    ))}
                                  </div>
                                  
                                  {/* Input Keterangan Dispensasi */}
                                  {todayStatus === AttendanceStatus.D && (
                                    <div className="animate-in fade-in slide-in-from-top-1">
                                      <input 
                                        type="text" 
                                        value={todayNote || ''} 
                                        onChange={(e) => updateAttendanceNote(s.id, e.target.value)}
                                        className="w-full bg-slate-950 border border-violet-500/30 rounded px-2 py-1.5 text-[9px] text-violet-300 placeholder:text-violet-500/50 outline-none focus:border-violet-500 transition-all uppercase"
                                        placeholder="TULIS KETERANGAN DISPENSASI..."
                                        onClick={e => e.stopPropagation()}
                                      />
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-2 py-3 text-center text-[10px] font-bold text-emerald-400">{attStats.h}</td>
                              <td className="px-2 py-3 text-center text-[10px] font-bold text-amber-400">{attStats.s}</td>
                              <td className="px-2 py-3 text-center text-[10px] font-bold text-blue-400">{attStats.i}</td>
                              <td className="px-2 py-3 text-center text-[10px] font-bold text-rose-400">{attStats.a}</td>
                              <td className="px-2 py-3 text-center text-[10px] font-bold text-violet-400">{attStats.d}</td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <div className="w-8 h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{width: `${attStats.percent}%`}}></div>
                                  </div>
                                  <span className="text-[9px] font-bold text-white">{attStats.percent}%</span>
                                </div>
                              </td>
                            </>
                          )}

                          {(activeTab === 'grading' || (activeTab === 'recap' && recapMode === 'grades')) && (
                            <>
                              {semesterData.config.materials.map((m, i) => (
                                <td key={m.id} className="px-2 py-3 text-center">
                                  <input 
                                    type="number" 
                                    value={g.daily[i] || ''} 
                                    onChange={e => updateGrade(s.id, 'daily', parseInt(e.target.value)||0, i)} 
                                    className={`w-10 h-8 bg-slate-950 border rounded-lg text-center text-[10px] font-bold outline-none focus:border-blue-500 ${ (g.daily[i] || 0) < kkm ? 'text-rose-400 border-rose-500/20' : 'text-white border-white/10' }`} 
                                    placeholder="0" 
                                  />
                                </td>
                              ))}
                              <td className="px-2 py-3 text-center bg-white/5">
                                <span className={`text-[10px] font-black ${stats.avgDaily < kkm ? 'text-rose-400' : 'text-white'}`}>{stats.avgDaily}</span>
                              </td>
                              <td className="px-2 py-3 text-center">
                                <input type="number" value={g.pts || ''} onChange={e => updateGrade(s.id, 'pts', parseInt(e.target.value)||0)} className="w-12 h-8 bg-slate-950 border border-white/10 rounded-lg text-center text-[10px] font-bold text-blue-400 focus:border-blue-500 outline-none" placeholder="0" />
                              </td>
                              <td className="px-2 py-3 text-center">
                                <input type="number" value={g.pas || ''} onChange={e => updateGrade(s.id, 'pas', parseInt(e.target.value)||0)} className="w-12 h-8 bg-slate-950 border border-white/10 rounded-lg text-center text-[10px] font-bold text-amber-400 focus:border-amber-500 outline-none" placeholder="0" />
                              </td>
                              
                              <td className="px-4 py-3 text-center bg-emerald-500/5">
                                <span className={`text-[11px] font-black ${stats.raportPTS < kkm ? 'text-rose-400' : 'text-emerald-400'}`}>{stats.raportPTS}</span>
                              </td>
                              <td className="px-4 py-3 text-center bg-indigo-500/5">
                                <span className={`text-[11px] font-black ${stats.raportPAS < kkm ? 'text-rose-400' : 'text-indigo-400'}`}>{stats.raportPAS}</span>
                              </td>

                              {activeTab === 'recap' && recapMode === 'grades' && (
                                <td className="px-4 py-3 text-center border-l border-white/10">
                                   <div className="flex items-center gap-2 justify-center">
                                      <div className="flex flex-col gap-1">
                                        <label className="text-[7px] text-slate-500 uppercase">Perbaikan PAS</label>
                                        <input type="number" value={g.pasRemedial || ''} onChange={e => updateGrade(s.id, 'pasRemedial', parseInt(e.target.value)||0)} className="w-12 h-7 bg-slate-950 border border-rose-500/20 rounded text-center text-[10px] text-rose-400" placeholder="-" />
                                      </div>
                                   </div>
                                </td>
                              )}
                            </>
                          )}

                          {activeTab === 'recap' && recapMode === 'attendance' && (
                             (() => {
                               const months = selectedSemester === 1 ? MONTHS_SEM1 : MONTHS_SEM2;
                               const recs = semesterData.attendance.filter(a => a.studentId === s.id);
                               
                               const getStatus = (monthName: string, weekNum: number) => {
                                 const monthIdx = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].indexOf(monthName);
                                 if (monthIdx === -1) return null;
                                 
                                 const found = recs.find(r => {
                                   const d = new Date(r.date);
                                   if (d.getMonth() !== monthIdx) return false;
                                   const w = Math.ceil(d.getDate() / 7);
                                   return w === weekNum;
                                 });
                                 return found?.status;
                               };

                               return months.map(m => (
                                 <td key={m} className="px-2 py-3 border-l border-white/5">
                                    <div className="grid grid-cols-5 gap-0.5">
                                      {[1,2,3,4,5].map(w => {
                                        const st = getStatus(m, w);
                                        let bg = 'bg-white/5';
                                        if (st === 'H') bg = 'bg-emerald-500';
                                        if (st === 'S') bg = 'bg-amber-500';
                                        if (st === 'I') bg = 'bg-blue-500';
                                        if (st === 'A') bg = 'bg-rose-500';
                                        if (st === 'D') bg = 'bg-violet-500';
                                        
                                        return <div key={w} className={`h-4 rounded-sm ${bg}`} title={`Minggu ${w}: ${st || '-'}`}></div>
                                      })}
                                    </div>
                                 </td>
                               ));
                             })()
                          )}

                          {activeTab === 'students' && (
                            <td className="px-6 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => { setEditingStudent(s); setNewStudent({...s}); setShowAddModal(true); }} className="p-2 bg-slate-800 hover:text-blue-400 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={() => { if(confirm("Hapus siswa?")) updateData({...data, students: data.students.filter(st => st.id !== s.id)}); }} className="p-2 bg-slate-800 hover:text-rose-400 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={20} className="py-20 text-center text-slate-600 text-[10px] uppercase tracking-widest">Tidak ada data siswa</td></tr>
                    )}
                  </tbody>
               </table>
             </div>
          </div>
        )}

        {/* CLOUD TAB */}
        {activeTab === 'cloud' && (
          <div className="max-w-xl mx-auto mt-10 p-8 bg-slate-900 border border-white/5 rounded-[2rem] text-center">
             <Database className="w-12 h-12 text-blue-500 mx-auto mb-4" />
             <h2 className="text-xl font-black text-white uppercase mb-6">Database Cloud</h2>
             <div className="flex gap-4">
               <button onClick={async () => { await forceCloudSave(); triggerToast("Saved"); }} className="flex-1 bg-blue-600 py-3 rounded-xl text-[10px] font-black uppercase text-white hover:bg-blue-500">Simpan ke Cloud</button>
               <button onClick={async () => { if(confirm("Load data?")) await forceCloudLoad(); triggerToast("Loaded"); }} className="flex-1 bg-slate-800 py-3 rounded-xl text-[10px] font-black uppercase text-white hover:bg-slate-700">Ambil dari Cloud</button>
             </div>
          </div>
        )}

      </div>

      {/* --- CONFIG & STUDENT MODALS OMITTED FOR BREVITY, NO CHANGES THERE --- */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-slate-900 w-full max-w-2xl rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                 <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"><Settings className="w-4 h-4 text-indigo-500" /> Konfigurasi Penilaian</h3>
                 <button onClick={() => setShowConfigModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                 <div className="mb-8">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Target KKM Per Tingkat</h4>
                    <div className="grid grid-cols-3 gap-4">
                       {['7', '8', '9'].map(lvl => (
                         <div key={lvl}>
                            <label className="text-[9px] text-slate-400 block mb-2">KELAS {lvl}</label>
                            <input 
                              type="number" 
                              value={semesterData.config.kkm[lvl] || 75} 
                              onChange={e => handleConfigUpdate({ kkm: { ...semesterData.config.kkm, [lvl]: parseInt(e.target.value) } })}
                              className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-center text-white font-bold focus:border-indigo-500 outline-none" 
                            />
                         </div>
                       ))}
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between items-end mb-4">
                       <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kolom Nilai Harian</h4>
                       <button onClick={addMaterial} className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-1 hover:text-emerald-400"><Plus className="w-3 h-3" /> Tambah Kolom</button>
                    </div>
                    <div className="space-y-3">
                       {semesterData.config.materials.map((m, idx) => (
                          <div key={m.id} className="flex gap-3 items-center bg-white/5 p-3 rounded-xl">
                             <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">{idx+1}</div>
                             <div className="flex-1 grid grid-cols-2 gap-3">
                                <input 
                                  type="text" 
                                  value={m.label} 
                                  onChange={e => {
                                    const newM = [...semesterData.config.materials];
                                    newM[idx].label = e.target.value.toUpperCase();
                                    handleConfigUpdate({ materials: newM });
                                  }}
                                  className="bg-slate-950 border border-white/10 px-3 py-2 rounded-lg text-[10px] text-white font-bold uppercase" 
                                  placeholder="KODE"
                                />
                                <input 
                                  type="text" 
                                  value={m.topic} 
                                  onChange={e => {
                                    const newM = [...semesterData.config.materials];
                                    newM[idx].topic = e.target.value;
                                    handleConfigUpdate({ materials: newM });
                                  }}
                                  className="bg-slate-950 border border-white/10 px-3 py-2 rounded-lg text-[10px] text-white" 
                                  placeholder="Topik"
                                />
                             </div>
                             <button onClick={() => removeMaterial(idx)} className="text-rose-500 hover:text-rose-400 p-2"><Trash2 className="w-4 h-4" /></button>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
              <div className="p-4 border-t border-white/5 bg-slate-950 text-right">
                 <button onClick={() => setShowConfigModal(false)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500">Selesai</button>
              </div>
           </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <div className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-950 p-6 flex justify-between items-center border-b border-white/5">
              <h3 className="text-xs font-black text-white uppercase tracking-widest">{editingStudent ? 'Edit Siswa' : 'Tambah Siswa Baru'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={e => {
              e.preventDefault();
              if (editingStudent) {
                updateData({...data, students: data.students.map(st => st.id === editingStudent.id ? {...st, ...newStudent} : st)});
              } else {
                updateData({...data, students: [...data.students, {id: crypto.randomUUID(), ...newStudent}]});
              }
              setShowAddModal(false);
              triggerToast("Berhasil Disimpan");
            }} className="p-8 space-y-5">
              <div className="space-y-4">
                 <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Nama Lengkap</label>
                    <input required type="text" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value.toUpperCase()})} className="w-full bg-slate-800 border border-white/10 p-4 rounded-xl text-[11px] font-bold text-white uppercase outline-none focus:border-blue-500 transition-all" placeholder="Nama Siswa" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">NIS</label>
                      <input required type="text" value={newStudent.nis} onChange={e => setNewStudent({...newStudent, nis: e.target.value})} className="w-full bg-slate-800 border border-white/10 p-4 rounded-xl text-[11px] font-bold text-white outline-none focus:border-blue-500 transition-all" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">ID Kartu (Opsional)</label>
                      <input type="text" value={newStudent.cardId} onChange={e => setNewStudent({...newStudent, cardId: e.target.value})} className="w-full bg-slate-800 border border-white/10 p-4 rounded-xl text-[11px] font-bold text-white outline-none focus:border-blue-500 transition-all" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Kelas (Manual)</label>
                      <input required type="text" value={newStudent.className} onChange={e => setNewStudent({...newStudent, className: e.target.value.toUpperCase()})} className="w-full bg-slate-800 border border-white/10 p-4 rounded-xl text-[11px] font-bold text-white uppercase outline-none focus:border-blue-500 transition-all" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Jenis Kelamin</label>
                      <div className="grid grid-cols-2 gap-2">
                         <button type="button" onClick={() => setNewStudent({...newStudent, gender: Gender.L})} className={`p-3 rounded-xl text-[10px] font-black uppercase border ${newStudent.gender === Gender.L ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-white/10 text-slate-500'}`}>Laki-laki</button>
                         <button type="button" onClick={() => setNewStudent({...newStudent, gender: Gender.P})} className={`p-3 rounded-xl text-[10px] font-black uppercase border ${newStudent.gender === Gender.P ? 'bg-pink-600 border-pink-500 text-white' : 'bg-slate-800 border-white/10 text-slate-500'}`}>Perempuan</button>
                      </div>
                    </div>
                 </div>
              </div>
              <div className="pt-4">
                 <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg">Simpan Data Siswa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-10 right-10 z-[200] animate-in slide-in-from-bottom-5 fade-in">
          <div className="bg-white text-slate-900 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <div className="bg-emerald-500 text-white p-1 rounded-full"><Check className="w-3 h-3" /></div>
            <span className="text-[10px] font-black uppercase tracking-widest">{toast}</span>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 0px; }
      `}</style>
    </div>
  );
};

export default TeacherDashboard;
