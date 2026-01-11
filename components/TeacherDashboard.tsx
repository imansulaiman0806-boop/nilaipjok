import React, { useState, useEffect, useRef } from 'react';
import { AppState, AttendanceStatus, Gender, Student, Grades, MaterialInfo } from '../types.ts';
import { Save, ChevronDown, ClipboardList, GraduationCap, FileText, Users, Clock, Check, Plus, Minus, Download, FileSpreadsheet, X, Award, CheckCircle2, AlertCircle, CalendarRange, Zap, UserPlus, Trash2, Search, Pencil, FileUp, FileDown, Trash } from 'lucide-react';
import { MONTHS_SEM1, MONTHS_SEM2 } from '../constants.tsx';
import * as XLSX from 'xlsx';

interface Props {
  data: AppState;
  updateData: (data: AppState) => void;
}

const TeacherDashboard: React.FC<Props> = ({ data, updateData }) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'grading' | 'recap' | 'students'>('attendance');
  const [recapSubTab, setRecapSubTab] = useState<'attendance' | 'grading'>('attendance');
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(1);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [classFilter, setClassFilter] = useState<string>('Semua');
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('DATA TERSIMPAN');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State untuk form tambah/edit siswa
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [newStudent, setNewStudent] = useState({
    name: '',
    nis: '',
    cardId: '',
    className: '',
    gender: Gender.L
  });
  
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const classes = ['Semua', ...Array.from(new Set(data.students.map(s => s.className)))].sort();
  
  const filteredStudents = [...(classFilter === 'Semua' 
    ? data.students 
    : data.students.filter(s => s.className === classFilter))
  ].filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.nis.includes(searchTerm))
   .sort((a, b) => a.name.localeCompare(b.name, 'id'));

  const semesterData = data.semesters[selectedSemester];
  const config = semesterData.config;
  const materials = config.materials || [];
  const currentMonths = selectedSemester === 1 ? MONTHS_SEM1 : MONTHS_SEM2;

  const monthToNumber: Record<string, number> = {
    "Januari": 0, "Februari": 1, "Maret": 2, "April": 3, "Mei": 4, "Juni": 5,
    "Juli": 6, "Agustus": 7, "September": 8, "Oktober": 9, "November": 10, "Desember": 11
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // --- STUDENT MANAGEMENT LOGIC ---
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.nis || !newStudent.className) return;

    if (editingStudentId) {
      const updatedStudents = data.students.map(s => 
        s.id === editingStudentId ? { ...s, ...newStudent } : s
      );
      updateData({ ...data, students: updatedStudents });
      setToastMessage('DATA SISWA DIPERBARUI');
    } else {
      const student: Student = {
        id: crypto.randomUUID(),
        ...newStudent
      };
      updateData({
        ...data,
        students: [...data.students, student]
      });
      setToastMessage('SISWA BERHASIL DITAMBAHKAN');
    }

    setNewStudent({ name: '', nis: '', cardId: '', className: '', gender: Gender.L });
    setEditingStudentId(null);
    setShowAddModal(false);
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2000);
  };

  const openEditModal = (student: Student) => {
    setNewStudent({
      name: student.name,
      nis: student.nis,
      cardId: student.cardId,
      className: student.className,
      gender: student.gender
    });
    setEditingStudentId(student.id);
    setShowAddModal(true);
  };

  const deleteStudent = (id: string) => {
    if (!window.confirm("Hapus data siswa ini? Semua data nilai dan absensi terkait akan hilang.")) return;
    
    const updatedSemesters = { ...data.semesters };
    [1, 2].forEach(semNum => {
      const s = semNum as 1 | 2;
      const newGrades = { ...updatedSemesters[s].grades };
      delete newGrades[id];
      updatedSemesters[s] = {
        ...updatedSemesters[s],
        grades: newGrades,
        attendance: updatedSemesters[s].attendance.filter(a => a.studentId !== id)
      };
    });

    updateData({
      ...data,
      students: data.students.filter(s => s.id !== id),
      semesters: updatedSemesters
    });
  };

  // --- EXCEL IMPORT/EXPORT SISWA ---
  const downloadStudentTemplate = () => {
    const template = [
      { 'NAMA': 'AHMAD JANI', 'NIS': '2024001', 'KELAS': '7A', 'GENDER (L/P)': 'L', 'ID KARTU': '12345678' },
      { 'NAMA': 'SITI AMINAH', 'NIS': '2024002', 'KELAS': '7A', 'GENDER (L/P)': 'P', 'ID KARTU': '87654321' },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Import_Siswa_PJOK.xlsx");
  };

  const exportStudentsToExcel = () => {
    const rows = filteredStudents.map((s, i) => ({
      'NO': i + 1,
      'NAMA': s.name,
      'NIS': s.nis,
      'KELAS': s.className,
      'GENDER': s.gender,
      'ID KARTU': s.cardId || '-'
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Siswa");
    XLSX.writeFile(wb, `Data_Siswa_PJOK_${classFilter}.xlsx`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      const importedStudents: Student[] = json.map((row: any) => ({
        id: crypto.randomUUID(),
        name: String(row['NAMA'] || row['Nama'] || '').toUpperCase(),
        nis: String(row['NIS'] || row['Nis'] || ''),
        className: String(row['KELAS'] || row['Kelas'] || '').toUpperCase(),
        gender: (String(row['GENDER (L/P)'] || row['GENDER'] || row['Gender'] || '').toUpperCase().startsWith('P')) ? Gender.P : Gender.L,
        cardId: String(row['ID KARTU'] || row['ID Kartu'] || row['Card Id'] || '')
      })).filter(s => s.name && s.nis && s.className);

      if (importedStudents.length > 0) {
        updateData({
          ...data,
          students: [...data.students, ...importedStudents]
        });
        setToastMessage(`${importedStudents.length} SISWA BERHASIL DIIMPORT`);
        setShowSaveToast(true);
        setTimeout(() => setShowSaveToast(false), 2000);
      } else {
        alert("Format file tidak sesuai atau tidak ada data valid!");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- ATTENDANCE LOGIC ---
  const toggleStatus = (studentId: string, status: AttendanceStatus) => {
    const existingIndex = semesterData.attendance.findIndex(a => a.studentId === studentId && a.date === attendanceDate);
    let newAttendance = [...semesterData.attendance];
    if (existingIndex > -1) {
      if (newAttendance[existingIndex].status === status) return;
      newAttendance[existingIndex] = { ...newAttendance[existingIndex], status };
    } else {
      const timeString = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      newAttendance.push({ studentId, date: attendanceDate, status, timestamp: timeString });
    }
    updateData({ ...data, semesters: { ...data.semesters, [selectedSemester]: { ...semesterData, attendance: newAttendance } } });
  };

  const updateAttendanceNote = (studentId: string, note: string) => {
    const existingIndex = semesterData.attendance.findIndex(a => a.studentId === studentId && a.date === attendanceDate);
    if (existingIndex > -1) {
      const newAttendance = [...semesterData.attendance];
      newAttendance[existingIndex] = { ...newAttendance[existingIndex], notes: note };
      updateData({ ...data, semesters: { ...data.semesters, [selectedSemester]: { ...semesterData, attendance: newAttendance } } });
    }
  };

  const getTotalMeetingDays = () => {
    const classSpecificStudents = data.students
      .filter(s => classFilter === 'Semua' || s.className === classFilter)
      .map(s => s.id);
    const uniqueDates = new Set(
      semesterData.attendance
        .filter(a => classSpecificStudents.includes(a.studentId))
        .map(a => a.date)
    );
    return Math.max(1, uniqueDates.size);
  };

  const getAttendanceSummary = (studentId: string) => {
    const attendance = semesterData.attendance.filter(a => a.studentId === studentId);
    const h = attendance.filter(a => a.status === AttendanceStatus.H).length;
    const s = attendance.filter(a => a.status === AttendanceStatus.S).length;
    const i = attendance.filter(a => a.status === AttendanceStatus.I).length;
    const a = attendance.filter(a => a.status === AttendanceStatus.A).length;
    const d = attendance.filter(a => a.status === AttendanceStatus.D).length;
    
    const totalRecorded = h + s + i + a + d;
    const totalEffectiveDays = getTotalMeetingDays();
    
    // Penyesuaian Bobot: Alpa (A) tidak lagi 0, melainkan 0.75 (sesuai permintaan user agar tidak terlalu besar pengurangannya)
    // Sakit dan Izin juga diberikan bobot yang sangat mendekati Hadir.
    const weightedScore = h + d + (s * 0.98) + (i * 0.95) + (a * 0.75);
    const unrecordedDays = Math.max(0, totalEffectiveDays - totalRecorded);
    const finalScore = weightedScore + unrecordedDays;
    const percentage = Math.round((finalScore / totalEffectiveDays) * 100);
    
    return { percentage, h, s, i, a, d, totalRecorded, totalEffectiveDays };
  };

  const getRecordForMonthWeek = (studentId: string, monthName: string, weekNum: number) => {
    const targetMonth = monthToNumber[monthName];
    return semesterData.attendance.find(a => {
      const d = new Date(a.date);
      if (d.getUTCMonth() !== targetMonth) return false;
      const day = d.getUTCDate();
      const w = Math.ceil(day / 7);
      return w === weekNum && a.studentId === studentId;
    });
  };

  // --- GRADING LOGIC ---
  const updateKKM = (grade: string, val: string) => {
    const newKKM = { ...config.kkm, [grade]: parseInt(val) || 0 };
    updateData({ ...data, semesters: { ...data.semesters, [selectedSemester]: { ...semesterData, config: { ...config, kkm: newKKM } } } });
  };

  const addMaterial = () => {
    const newIdx = materials.length + 1;
    const newMaterial: MaterialInfo = { id: `m${newIdx}`, label: `NH${newIdx}`, topic: 'TOPIK BARU' };
    updateData({ ...data, semesters: { ...data.semesters, [selectedSemester]: { ...semesterData, config: { ...config, materials: [...materials, newMaterial] } } } });
  };

  const deleteMaterial = (materialId: string, index: number) => {
    // Menghapus material tanpa dialog konfirmasi agar "otomatis" saat diklik
    const label = materials[index].label;
    
    // Remove from materials list
    const newMaterials = materials.filter(m => m.id !== materialId);
    
    // Sync all students' daily grades array by removing the index
    const newGradesRecord = { ...semesterData.grades };
    Object.keys(newGradesRecord).forEach(studentId => {
      const g = { ...newGradesRecord[studentId] };
      const newDaily = [...g.daily];
      newDaily.splice(index, 1);
      g.daily = newDaily;
      newGradesRecord[studentId] = g;
    });

    updateData({ 
      ...data, 
      semesters: { 
        ...data.semesters, 
        [selectedSemester]: { 
          ...semesterData, 
          config: { ...config, materials: newMaterials },
          grades: newGradesRecord
        } 
      } 
    });

    setToastMessage(`KOLOM ${label} BERHASIL DIHAPUS`);
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2000);
  };

  const removeMaterial = () => {
    if (materials.length === 0) return;
    deleteMaterial(materials[materials.length - 1].id, materials.length - 1);
  };

  const updateMaterialTopic = (id: string, topic: string) => {
    const newMaterials = materials.map(m => m.id === id ? { ...m, topic: topic.toUpperCase() } : m);
    updateData({ ...data, semesters: { ...data.semesters, [selectedSemester]: { ...semesterData, config: { ...config, materials: newMaterials } } } });
  };

  const updateGradeValue = (studentId: string, type: 'daily' | 'pts' | 'pas', val: string, dailyIndex?: number) => {
    const numeric = Math.min(100, Math.max(0, parseInt(val) || 0));
    const existingGrades = semesterData.grades[studentId] || { daily: [], pts: 0, pas: 0 };
    let newGrades = { ...existingGrades };
    
    if (type === 'daily' && dailyIndex !== undefined) {
      const newDaily = [...existingGrades.daily];
      while (newDaily.length <= dailyIndex) newDaily.push(0);
      newDaily[dailyIndex] = numeric;
      newGrades.daily = newDaily;
    } else if (type === 'pts') {
      newGrades.pts = numeric;
    } else if (type === 'pas') {
      newGrades.pas = numeric;
    }

    updateData({ ...data, semesters: { ...data.semesters, [selectedSemester]: { ...semesterData, grades: { ...semesterData.grades, [studentId]: newGrades } } } });
  };

  const calculateResults = (studentId: string, className: string) => {
    const g = semesterData.grades[studentId] || { daily: [], pts: 0, pas: 0 };
    const avgNH = materials.length > 0 ? g.daily.slice(0, materials.length).reduce((a, b) => a + (b || 0), 0) / materials.length : 0;
    const raport = Math.round((avgNH * 2 + g.pts + g.pas) / 4);
    
    const match = className.match(/^(\d+)/);
    const kkm = config.kkm[match ? match[1] : '7'] || 75;
    const isTuntas = raport >= kkm;

    return { avgNH: Math.round(avgNH), raport, kkm, isTuntas };
  };

  // --- AUTO KATROL LOGIC ---
  const handleAutoKatrol = () => {
    const scope = classFilter === 'Semua' ? 'SEMUA KELAS' : `KELAS ${classFilter}`;
    if (!window.confirm(`Gunakan fitur katrol nilai untuk ${scope}? Sistem akan menaikkan nilai siswa yang belum tuntas agar mencapai batas minimal KKM.`)) return;

    let updatedGrades = { ...semesterData.grades };
    let count = 0;

    filteredStudents.forEach(s => {
      const { raport, kkm, isTuntas } = calculateResults(s.id, s.className);
      if (!isTuntas) {
        const currentGrades = { ...(updatedGrades[s.id] || { daily: [], pts: 0, pas: 0 }) };
        let avgNH = materials.length > 0 ? currentGrades.daily.slice(0, materials.length).reduce((a, b) => a + (b || 0), 0) / materials.length : 0;
        const targetSum = kkm * 4;
        let currentPointsWithoutPAS = (avgNH * 2) + currentGrades.pts;
        let neededPAS = Math.ceil(targetSum - currentPointsWithoutPAS);

        if (neededPAS <= 100) {
          currentGrades.pas = Math.max(currentGrades.pas, neededPAS);
        } else {
          currentGrades.pas = 100;
          let currentPointsWithoutPTS = (avgNH * 2) + currentGrades.pas;
          let neededPTS = Math.ceil(targetSum - currentPointsWithoutPTS);
          if (neededPTS <= 100) {
            currentGrades.pts = Math.max(currentGrades.pts, neededPTS);
          } else {
            currentGrades.pts = 100;
            let neededAvgNH = (targetSum - 200) / 2;
            const boostedDaily = [...currentGrades.daily];
            for (let j = 0; j < materials.length; j++) {
              boostedDaily[j] = Math.max(boostedDaily[j] || 0, Math.ceil(neededAvgNH));
            }
            currentGrades.daily = boostedDaily;
          }
        }
        updatedGrades[s.id] = currentGrades;
        count++;
      }
    });

    if (count > 0) {
      updateData({ ...data, semesters: { ...data.semesters, [selectedSemester]: { ...semesterData, grades: updatedGrades } } });
      setToastMessage(`${count} SISWA ${scope} BERHASIL DIKATROL`);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 2000);
    } else {
      alert(`Semua siswa di ${scope} sudah tuntas!`);
    }
  };

  const exportToExcel = () => {
    const rows = filteredStudents.map((s, i) => {
      const { avgNH, raport, kkm, isTuntas } = calculateResults(s.id, s.className);
      const g = semesterData.grades[s.id] || { daily: [], pts: 0, pas: 0 };
      const att = getAttendanceSummary(s.id);
      
      let row: any = { 'NO': i + 1, 'NAMA SISWA': s.name, 'NIS': s.nis, 'L/P': s.gender };
      if (activeTab === 'recap' && recapSubTab === 'attendance') {
        currentMonths.forEach(m => {
          for(let w=1; w<=5; w++) {
            const rec = getRecordForMonthWeek(s.id, m, w);
            row[`${m}_M${w}`] = rec ? (rec.status === 'H' ? '✓' : rec.status) : '-';
          }
        });
        row['KEHADIRAN (%)'] = att.percentage + '%';
      } else {
        materials.forEach((m, idx) => { row[`${m.label} (${m.topic})`] = g.daily[idx] || 0; });
        row['AVG NH'] = avgNH;
        row['PTS'] = g.pts;
        row['PAS'] = g.pas;
        row['NILAI AKHIR'] = raport;
        row['KKM'] = kkm;
        row['STATUS'] = isTuntas ? 'TUNTAS' : 'TIDAK TUNTAS';
      }
      return row;
    });

    const filename = activeTab === 'recap' ? `Rekap_${recapSubTab === 'attendance' ? 'Absensi' : 'Nilai'}_PJOK_${classFilter}_Smt${selectedSemester}` : `Data_PJOK_${classFilter}`;
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const handleSave = () => {
    setToastMessage('DATA TERSIMPAN');
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2000);
  };

  return (
    <div className="h-full w-full max-w-[1400px] mx-auto flex flex-col p-2 md:p-3 font-['Plus_Jakarta_Sans'] text-[#1e293b]">
      {/* Hidden File Input for Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportExcel} 
        className="hidden" 
        accept=".xlsx, .xls" 
      />

      {/* Top Navbar */}
      <div className="shrink-0 flex flex-col lg:flex-row justify-between items-center gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-[#020617] text-white px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[9px] font-black tracking-widest uppercase">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long' }).toUpperCase()} {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            </span>
          </div>
          <div className="bg-[#eef2f6] p-0.5 rounded-xl flex gap-0.5 border border-slate-200 shadow-sm">
            {[1, 2].map(s => (
              <button key={s} onClick={() => setSelectedSemester(s as 1 | 2)} className={`px-3 py-1.5 rounded-lg font-black text-[9px] tracking-widest transition-all ${selectedSemester === s ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                SMT {s}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white p-0.5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-0.5">
          {[
            { id: 'attendance', label: 'ABSENSI', icon: ClipboardList },
            { id: 'grading', label: 'NILAI', icon: GraduationCap },
            { id: 'recap', label: 'REKAP', icon: FileText },
            { id: 'students', label: 'SISWA', icon: Users }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-black text-[10px] tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#1e293b] text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
              <tab.icon className="w-3 h-3" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-[1.5rem] shadow-xl border border-slate-100 flex flex-col overflow-hidden">
        
        {/* Module Header Area */}
        <div className="shrink-0 px-5 py-3 border-b border-slate-50 bg-[#fcfdfe] flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex gap-3 items-center">
             <div className="bg-blue-50 p-2 rounded-xl text-blue-600 shadow-sm">
               {activeTab === 'grading' ? <GraduationCap className="w-4 h-4" /> : activeTab === 'recap' ? <FileText className="w-4 h-4" /> : activeTab === 'students' ? <Users className="w-4 h-4" /> : <ClipboardList className="w-4 h-4" />}
             </div>
             <div>
                <h2 className="text-[11px] font-[900] text-[#1e293b] tracking-wider uppercase leading-none">
                  {activeTab === 'grading' ? 'MANAJEMEN PENILAIAN' : activeTab === 'recap' ? 'REKAPITULASI AKHIR' : activeTab === 'students' ? 'DATABASE SISWA' : 'ABSENSI HARIAN'}
                </h2>
                <p className="text-[8px] font-bold text-slate-400 tracking-widest uppercase leading-none mt-1">
                  {activeTab === 'grading' ? 'ATUR KKM DAN INPUT NILAI SISWA' : activeTab === 'recap' ? 'LAPORAN AKHIR KEHADIRAN & NILAI' : activeTab === 'students' ? 'PENGELOLAAN DATA PESERTA DIDIK' : 'MATA PELAJARAN PJOK'}
                </p>
             </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            {activeTab === 'students' && (
              <div className="relative mr-2">
                 <input 
                  type="text" 
                  placeholder="CARI NAMA / NIS..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-9 py-1.5 text-[9px] font-black tracking-widest w-48 outline-none focus:border-blue-400 transition-all uppercase"
                 />
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              </div>
            )}

            {activeTab === 'recap' && (
              <div className="bg-slate-100 p-0.5 rounded-xl flex gap-0.5 border border-slate-200">
                <button onClick={() => setRecapSubTab('attendance')} className={`px-3 py-1.5 rounded-lg font-black text-[9px] tracking-widest transition-all flex items-center gap-1.5 ${recapSubTab === 'attendance' ? 'bg-[#1e293b] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                  <CalendarRange className="w-3 h-3" /> REKAP ABSEN
                </button>
                <button onClick={() => setRecapSubTab('grading')} className={`px-3 py-1.5 rounded-lg font-black text-[9px] tracking-widest transition-all flex items-center gap-1.5 ${recapSubTab === 'grading' ? 'bg-[#1e293b] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                  <Award className="w-3 h-3" /> REKAP NILAI
                </button>
              </div>
            )}

            {(activeTab === 'grading' || (activeTab === 'recap' && recapSubTab === 'grading')) && (
              <div className="flex items-center bg-white border border-slate-200 px-3 py-1.5 rounded-xl gap-3 shadow-sm">
                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">KKM:</span>
                 {['7', '8', '9'].map(grade => (
                    <div key={grade} className="flex items-center gap-1.5">
                       <span className="text-[9px] font-bold text-slate-400">KLS {grade}</span>
                       <input type="text" value={config.kkm[grade] || 75} onChange={(e) => updateKKM(grade, e.target.value)} className="w-8 h-6 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black text-center outline-none focus:border-blue-400 focus:bg-white" />
                    </div>
                 ))}
              </div>
            )}

            <div className="relative">
              <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="appearance-none bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-black text-slate-500 outline-none text-[10px] tracking-widest uppercase cursor-pointer min-w-[110px] shadow-sm">
                {classes.map(c => <option key={c} value={c}>{c === 'Semua' ? 'SEMUA KELAS' : `KELAS ${c}`}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>

            {activeTab === 'attendance' && (
              <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-black text-slate-500 outline-none text-[10px] tracking-widest cursor-pointer shadow-sm" />
            )}

            {(activeTab === 'grading' || (activeTab === 'recap' && recapSubTab === 'grading') || activeTab === 'students') && (
              <div className="flex gap-1.5">
                {(activeTab === 'grading' || (activeTab === 'recap' && recapSubTab === 'grading')) && (
                  <>
                    <button onClick={removeMaterial} className="bg-rose-50 text-rose-500 p-1.5 rounded-lg hover:bg-rose-100 transition-colors shadow-sm"><Minus className="w-3.5 h-3.5" /></button>
                    <button onClick={addMaterial} className="bg-blue-50 text-blue-500 p-1.5 rounded-lg hover:bg-blue-100 transition-colors shadow-sm"><Plus className="w-3.5 h-3.5" /></button>
                  </>
                )}
                
                {activeTab === 'recap' && recapSubTab === 'grading' && (
                   <button onClick={handleAutoKatrol} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-xl font-black text-[9px] tracking-widest uppercase flex items-center gap-1.5 transition-all shadow-md active:scale-95">
                    <Zap className="w-3.5 h-3.5 fill-current" /> KATROL
                  </button>
                )}

                {activeTab === 'students' && (
                  <div className="flex gap-1.5 items-center bg-slate-50 border border-slate-200 px-2 py-1 rounded-2xl">
                    <button onClick={downloadStudentTemplate} title="Download Template Excel" className="text-slate-400 hover:text-emerald-500 p-1.5 rounded-lg transition-all active:scale-90">
                      <FileDown className="w-4 h-4" />
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} title="Import dari Excel" className="text-slate-400 hover:text-blue-500 p-1.5 rounded-lg transition-all active:scale-90">
                      <FileUp className="w-4 h-4" />
                    </button>
                    <div className="w-[1px] h-4 bg-slate-200"></div>
                    <button onClick={exportStudentsToExcel} title="Export ke Excel" className="text-slate-400 hover:text-emerald-600 p-1.5 rounded-lg transition-all active:scale-90">
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {activeTab === 'students' && (
                  <button onClick={() => { setEditingStudentId(null); setNewStudent({ name: '', nis: '', cardId: '', className: '', gender: Gender.L }); setShowAddModal(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-xl font-black text-[9px] tracking-widest uppercase flex items-center gap-1.5 transition-all shadow-md active:scale-95">
                    <UserPlus className="w-3.5 h-3.5" /> TAMBAH
                  </button>
                )}

                {activeTab !== 'students' && (
                   <button onClick={exportToExcel} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-xl font-black text-[9px] tracking-widest uppercase flex items-center gap-1.5 transition-all shadow-md active:scale-95">
                    <FileSpreadsheet className="w-3.5 h-3.5" /> EXCEL
                  </button>
                )}
              </div>
            )}
            
            <button onClick={handleSave} className="bg-[#0f172a] hover:bg-slate-800 text-white px-5 py-1.5 rounded-xl font-black text-[9px] tracking-widest uppercase flex items-center gap-1.5 transition-all active:scale-95 shadow-md">
              <Save className="w-3.5 h-3.5" /> SIMPAN
            </button>
          </div>
        </div>

        {/* Scrollable Table Content */}
        <div className="flex-1 overflow-auto min-h-0 bg-white">
          {activeTab === 'attendance' ? (
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="sticky top-0 z-30">
                <tr className="bg-[#1e293b] text-white/40 text-[9px] font-black uppercase tracking-widest shadow-sm">
                  <th className="px-4 py-2.5 w-10 text-center">NO</th>
                  <th className="px-4 py-2.5">NAMA SISWA</th>
                  <th className="px-4 py-2.5 w-12 text-center">L/P</th>
                  <th className="px-4 py-2.5 text-center">STATUS</th>
                  <th className="px-4 py-2.5">KETERANGAN</th>
                  <th className="px-4 py-2.5 text-center bg-[#242f3f] w-48 border-l border-white/5">REKAP & PERSEN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStudents.map((s, i) => {
                  const current = semesterData.attendance.find(a => a.studentId === s.id && a.date === attendanceDate);
                  const stats = getAttendanceSummary(s.id);
                  const isFemale = s.gender === Gender.P;
                  return (
                    <tr key={s.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-2 text-center text-slate-300 font-bold text-[10px]">{i + 1}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center font-black text-[9px] shadow-sm ${isFemale ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}`}>
                            {getInitials(s.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-black text-[#1e293b] text-[10px] uppercase tracking-wide leading-tight truncate max-w-[180px]">{s.name}</div>
                            <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5">NIS: {s.nis}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded-lg text-[8px] font-black border shadow-sm ${isFemale ? 'bg-pink-50 border-pink-100 text-pink-500' : 'bg-blue-50 border-blue-100 text-blue-500'}`}>
                          {s.gender}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-center items-center gap-1">
                          {[AttendanceStatus.H, AttendanceStatus.S, AttendanceStatus.I, AttendanceStatus.A, AttendanceStatus.D].map(st => (
                            <button key={st} onClick={() => toggleStatus(s.id, st)} className={`w-6 h-6 rounded-full flex items-center justify-center border font-black text-[9px] transition-all shadow-sm ${current?.status === st ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200'}`}>{st}</button>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" placeholder="..." value={current?.notes || ''} onChange={(e) => updateAttendanceNote(s.id, e.target.value)} className="w-full bg-[#f8fafc] border border-transparent rounded-lg px-2 py-1 outline-none text-[9px] font-bold text-slate-600 focus:bg-white focus:border-blue-300 transition-all uppercase placeholder:text-slate-300" />
                      </td>
                      <td className="px-4 py-2 bg-slate-50/40 border-l border-slate-100">
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex justify-between items-end">
                            <span className={`text-[10px] font-black leading-none ${stats.percentage < 80 ? 'text-rose-500' : 'text-emerald-500'}`}>{stats.percentage}%</span>
                            <span className="text-[7px] font-bold text-slate-400 uppercase leading-none">{stats.h+stats.d}/{stats.totalEffectiveDays}</span>
                          </div>
                          <div className="flex justify-between gap-0.5 mt-0.5">
                            {[
                              { l: 'H', v: stats.h, c: 'text-emerald-500' },
                              { l: 'S', v: stats.s, c: 'text-amber-500' },
                              { l: 'I', v: stats.i, c: 'text-blue-500' },
                              { l: 'A', v: stats.a, c: 'text-rose-500' },
                              { l: 'D', v: stats.d, c: 'text-violet-500' }
                            ].map(x => (
                              <div key={x.l} className="flex-1 bg-white/80 border border-slate-100 rounded p-0.5 text-center shadow-xs">
                                <p className={`text-[8px] font-black leading-none ${x.c}`}>{x.v}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : activeTab === 'grading' ? (
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead className="sticky top-0 z-30">
                <tr className="bg-[#1e293b] text-white/40 text-[9px] font-black uppercase tracking-widest shadow-sm">
                  <th rowSpan={2} className="px-5 py-3 w-12 text-center">NO</th>
                  <th rowSpan={2} className="px-5 py-3">NAMA SISWA</th>
                  <th rowSpan={2} className="px-5 py-3 w-24 text-center">NIS</th>
                  {materials.map((m, idx) => (
                    <th key={m.id} className="px-2 py-1.5 text-center border-l border-white/5 bg-[#252f3f] text-blue-400 group/th relative">
                       <div className="flex flex-col items-center">
                         <div className="flex items-center gap-1">
                           <p className="text-[8px] mb-0.5">{m.label}</p>
                           <button onClick={() => deleteMaterial(m.id, idx)} className="opacity-0 group-hover/th:opacity-100 transition-opacity bg-rose-500 hover:bg-rose-600 text-white p-0.5 rounded-full shadow-lg" title={`Hapus ${m.label}`}>
                             <X className="w-2 h-2" />
                           </button>
                         </div>
                         <input 
                          type="text" 
                          value={m.topic} 
                          onChange={(e) => updateMaterialTopic(m.id, e.target.value)}
                          className="bg-transparent border-none text-[7px] text-white font-black text-center w-full focus:outline-none uppercase" 
                          placeholder="TOPIK"
                         />
                       </div>
                    </th>
                  ))}
                  <th className="px-5 py-3 text-center bg-[#242f3f] border-l border-white/5">AVG</th>
                  <th className="px-5 py-3 text-center bg-[#242f3f] border-l border-white/5">PTS</th>
                  <th className="px-5 py-3 text-center bg-amber-500/10 text-amber-500 border-l border-white/5">R.PTS</th>
                  <th className="px-5 py-3 text-center bg-[#242f3f] border-l border-white/5">PAS</th>
                  <th className="px-5 py-3 text-center bg-blue-600 text-white border-l border-white/5">RAPORT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s, i) => {
                  const g = semesterData.grades[s.id] || { daily: [], pts: 0, pas: 0 };
                  const { avgNH, raport } = calculateResults(s.id, s.className);
                  return (
                    <tr key={s.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-2.5 text-center text-slate-300 font-bold text-[11px]">{i + 1}</td>
                      <td className="px-5 py-2.5">
                        <div className="font-black text-[#1e293b] text-[11px] uppercase tracking-wide truncate max-w-[200px]">{s.name}</div>
                      </td>
                      <td className="px-5 py-2.5 text-center text-slate-400 font-bold text-[10px]">{s.nis}</td>
                      {materials.map((m, idx) => (
                        <td key={m.id} className="px-1 py-2.5 text-center border-l border-slate-100">
                          <input type="text" value={g.daily[idx] || 0} onChange={(e) => updateGradeValue(s.id, 'daily', e.target.value, idx)} className={`w-full bg-transparent text-center font-black text-[12px] outline-none ${!g.daily[idx] ? 'text-rose-500 opacity-30' : 'text-slate-600'}`} />
                        </td>
                      ))}
                      <td className="px-5 py-2.5 text-center font-black text-[12px] text-slate-400 bg-slate-50/30 border-l border-slate-100">{avgNH}</td>
                      <td className="px-5 py-2.5 text-center border-l border-slate-100">
                        <input type="text" value={g.pts} onChange={(e) => updateGradeValue(s.id, 'pts', e.target.value)} className={`w-full bg-transparent text-center font-black text-[12px] outline-none ${!g.pts ? 'text-rose-500 opacity-30' : 'text-slate-600'}`} />
                      </td>
                      <td className="px-5 py-2.5 text-center font-black text-[12px] text-rose-400 bg-amber-50/30 border-l border-slate-100">{g.pts}</td>
                      <td className="px-5 py-2.5 text-center border-l border-slate-100">
                        <input type="text" value={g.pas} onChange={(e) => updateGradeValue(s.id, 'pas', e.target.value)} className={`w-full bg-transparent text-center font-black text-[12px] outline-none ${!g.pas ? 'text-rose-500 opacity-30' : 'text-slate-600'}`} />
                      </td>
                      <td className="px-5 py-2.5 text-center font-black text-[13px] bg-blue-50/50 text-blue-700 border-l border-slate-100">{raport}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : activeTab === 'recap' ? (
            recapSubTab === 'attendance' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1200px] table-fixed">
                  <thead className="sticky top-0 z-30">
                    <tr className="bg-[#1e293b] text-white/40 text-[8px] font-black uppercase tracking-widest border-b border-white/5">
                      <th rowSpan={2} className="px-2 py-2 w-8 text-center border-r border-white/5">NO</th>
                      <th rowSpan={2} className="px-3 py-2 w-48 border-r border-white/5">NAMA SISWA</th>
                      <th rowSpan={2} className="px-2 py-2 w-20 text-center border-r border-white/5">NIS</th>
                      <th rowSpan={2} className="px-1 py-2 w-10 text-center border-r border-white/5">L/P</th>
                      {currentMonths.map(m => (
                        <th key={m} colSpan={5} className="px-1 py-1 text-center border-r border-white/5 bg-[#242f3f] text-white/80 border-b border-white/5 text-[7px]">
                          {m.toUpperCase()}
                        </th>
                      ))}
                      <th rowSpan={2} className="px-2 py-2 w-12 text-center bg-emerald-600 text-white border-l border-white/5">%</th>
                    </tr>
                    <tr className="bg-[#1e293b] text-white/40 text-[6px] font-black uppercase tracking-widest">
                      {currentMonths.map(m => (
                        [1, 2, 3, 4, 5].map(w => (
                          <th key={`${m}-${w}`} className="px-0.5 py-1 text-center border-r border-white/5 w-6">M{w}</th>
                        ))
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((s, i) => {
                      const att = getAttendanceSummary(s.id);
                      return (
                        <tr key={s.id} className="group hover:bg-slate-50 transition-colors">
                          <td className="px-2 py-1 text-center text-slate-300 font-bold text-[9px] border-r border-slate-50">{i + 1}</td>
                          <td className="px-3 py-1 border-r border-slate-50">
                            <div className="font-black text-[#1e293b] text-[9px] uppercase tracking-wide truncate">{s.name}</div>
                          </td>
                          <td className="px-2 py-1 text-center text-slate-400 font-bold text-[9px] border-r border-slate-50">{s.nis}</td>
                          <td className="px-1 py-1 text-center text-slate-400 font-black text-[9px] border-r border-slate-50">{s.gender}</td>
                          {currentMonths.map(m => (
                            [1, 2, 3, 4, 5].map(w => {
                              const rec = getRecordForMonthWeek(s.id, m, w);
                              let cellContent = '-';
                              let cellClass = 'text-slate-200';
                              if (rec) {
                                switch(rec.status) {
                                  case AttendanceStatus.H: cellContent = '✓'; cellClass = 'text-emerald-500 font-black'; break;
                                  case AttendanceStatus.S: cellContent = 'S'; cellClass = 'text-amber-500 font-black'; break;
                                  case AttendanceStatus.I: cellContent = 'I'; cellClass = 'text-blue-500 font-black'; break;
                                  case AttendanceStatus.A: cellContent = 'A'; cellClass = 'text-rose-500 font-black'; break;
                                  case AttendanceStatus.D: cellContent = 'D'; cellClass = 'text-violet-500 font-black'; break;
                                }
                              }
                              return (
                                <td key={`${m}-${w}`} className="px-0.5 py-1 text-center border-r border-slate-50 text-[9px]">
                                  <span className={cellClass}>{cellContent}</span>
                                </td>
                              );
                            })
                          ))}
                          <td className="px-1 py-1 text-center font-black text-[9px] bg-emerald-50/20 text-emerald-600 border-l border-slate-100">{att.percentage}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-[#1e293b] text-white/40 text-[9px] font-black uppercase tracking-widest shadow-sm">
                    <th rowSpan={2} className="px-5 py-3 w-12 text-center">NO</th>
                    <th rowSpan={2} className="px-5 py-3">NAMA SISWA</th>
                    <th rowSpan={2} className="px-5 py-3 w-24 text-center">NIS</th>
                    <th rowSpan={2} className="px-5 py-3 w-14 text-center">L/P</th>
                    {materials.map(m => (
                      <th key={m.id} className="px-2 py-1 text-center border-l border-white/5 bg-[#252f3f] text-blue-400">
                         <p className="text-[7px] opacity-60">{m.label}</p>
                         <p className="text-[7px] font-black uppercase">{m.topic}</p>
                      </th>
                    ))}
                    <th rowSpan={2} className="px-5 py-3 text-center bg-[#242f3f] border-l border-white/5">AVG NH</th>
                    <th rowSpan={2} className="px-5 py-3 text-center bg-[#242f3f] border-l border-white/5">PTS</th>
                    <th rowSpan={2} className="px-5 py-3 text-center bg-[#242f3f] border-l border-white/5">PAS</th>
                    <th rowSpan={2} className="px-5 py-3 text-center bg-blue-600 text-white">RAPORT</th>
                    <th rowSpan={2} className="px-5 py-3 text-center">KKM</th>
                    <th rowSpan={2} className="px-5 py-3 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((s, i) => {
                    const { avgNH, raport, kkm, isTuntas } = calculateResults(s.id, s.className);
                    const g = semesterData.grades[s.id] || { daily: [], pts: 0, pas: 0 };
                    return (
                      <tr key={s.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-2.5 text-center text-slate-300 font-bold text-[11px]">{i + 1}</td>
                        <td className="px-5 py-2.5">
                          <div className="font-black text-[#1e293b] text-[11px] uppercase tracking-wide truncate max-w-[180px]">{s.name}</div>
                        </td>
                        <td className="px-5 py-2.5 text-center text-slate-400 font-bold text-[10px]">{s.nis}</td>
                        <td className="px-5 py-2.5 text-center text-slate-400 font-black text-[10px]">{s.gender}</td>
                        {materials.map((m, idx) => (
                          <td key={m.id} className="px-2 py-2.5 text-center border-l border-slate-50 text-[11px] font-bold text-slate-500">
                             {g.daily[idx] || 0}
                          </td>
                        ))}
                        <td className="px-5 py-2.5 text-center text-slate-500 font-bold text-[11px]">{avgNH}</td>
                        <td className="px-5 py-2.5 text-center text-slate-500 font-bold text-[11px]">{g.pts}</td>
                        <td className="px-5 py-2.5 text-center text-slate-500 font-bold text-[11px]">{g.pas}</td>
                        <td className="px-5 py-2.5 text-center font-black text-[13px] bg-blue-50/30 text-blue-600 border-l border-white/5">{raport}</td>
                        <td className="px-5 py-2.5 text-center text-slate-300 font-black text-[10px]">{kkm}</td>
                        <td className="px-5 py-2.5 text-center">
                           <div className="flex items-center justify-center gap-1.5">
                              {isTuntas ? (
                                <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-xl flex items-center gap-1.5 border border-emerald-100 shadow-sm">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span className="text-[9px] font-black uppercase tracking-widest">TUNTAS</span>
                                </div>
                              ) : (
                                <div className="bg-rose-50 text-rose-600 px-3 py-1 rounded-xl flex items-center gap-1.5 border border-rose-100 shadow-sm">
                                  <AlertCircle className="w-3 h-3" />
                                  <span className="text-[9px] font-black uppercase tracking-widest">BELUM TUNTAS</span>
                                </div>
                              )}
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          ) : activeTab === 'students' ? (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-30">
                <tr className="bg-[#1e293b] text-white/40 text-[9px] font-black uppercase tracking-widest shadow-sm">
                  <th className="px-5 py-3 w-12 text-center">NO</th>
                  <th className="px-5 py-3">NAMA SISWA</th>
                  <th className="px-5 py-3 w-28 text-center">NIS</th>
                  <th className="px-5 py-3 w-32 text-center">ID KARTU</th>
                  <th className="px-5 py-3 w-24 text-center">KELAS</th>
                  <th className="px-5 py-3 w-16 text-center">L/P</th>
                  <th className="px-5 py-3 w-24 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s, i) => {
                   const isFemale = s.gender === Gender.P;
                   return (
                    <tr key={s.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-2.5 text-center text-slate-300 font-bold text-[11px]">{i + 1}</td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-black text-[10px] shadow-sm ${isFemale ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}`}>
                            {getInitials(s.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-black text-[#1e293b] text-[11px] uppercase tracking-wide truncate">{s.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-center text-slate-500 font-bold text-[10px]">{s.nis}</td>
                      <td className="px-5 py-2.5 text-center text-slate-400 font-bold text-[10px]">{s.cardId || '-'}</td>
                      <td className="px-5 py-2.5 text-center">
                         <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-black">{s.className}</span>
                      </td>
                      <td className="px-5 py-2.5 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${isFemale ? 'text-pink-500' : 'text-blue-500'}`}>{s.gender}</span>
                      </td>
                      <td className="px-5 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-3">
                           <button onClick={() => openEditModal(s)} className="text-blue-400 hover:text-blue-600 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteStudent(s.id)} className="text-rose-300 hover:text-rose-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
          ) : (
            <div className="h-full flex items-center justify-center opacity-5">
               <p className="font-black text-2xl tracking-[0.5em] uppercase text-slate-400 text-center">SISTEM INFORMASI<br/>OLAHRAGA DIGITAL</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-[#1e293b] p-6 flex justify-between items-center text-white">
                 <div className="flex items-center gap-3">
                    <UserPlus className="w-5 h-5 text-blue-400" />
                    <h3 className="text-[12px] font-black tracking-widest uppercase">{editingStudentId ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</h3>
                 </div>
                 <button onClick={() => { setShowAddModal(false); setEditingStudentId(null); }} className="text-white/40 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              <form onSubmit={handleSaveStudent} className="p-8 space-y-5">
                 <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                    <input type="text" value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[11px] font-bold text-slate-700 outline-none focus:border-blue-400 transition-all" placeholder="E.G. AHMAD JANI" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">NIS / Induk</label>
                       <input type="text" value={newStudent.nis} onChange={(e) => setNewStudent({...newStudent, nis: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[11px] font-bold text-slate-700 outline-none focus:border-blue-400 transition-all" placeholder="2024001" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Kartu (Opsional)</label>
                       <input type="text" value={newStudent.cardId} onChange={(e) => setNewStudent({...newStudent, cardId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[11px] font-bold text-slate-700 outline-none focus:border-blue-400 transition-all" placeholder="TAP DISINI" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Kelas</label>
                       <input type="text" value={newStudent.className} onChange={(e) => setNewStudent({...newStudent, className: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[11px] font-bold text-slate-700 outline-none focus:border-blue-400 transition-all" placeholder="E.G. 7A" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                       <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                          <button type="button" onClick={() => setNewStudent({...newStudent, gender: Gender.L})} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black transition-all ${newStudent.gender === Gender.L ? 'bg-[#1e293b] text-white shadow-md' : 'text-slate-400'}`}>LAKI-LAKI</button>
                          <button type="button" onClick={() => setNewStudent({...newStudent, gender: Gender.P})} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black transition-all ${newStudent.gender === Gender.P ? 'bg-pink-500 text-white shadow-md' : 'text-slate-400'}`}>PEREMPUAN</button>
                       </div>
                    </div>
                 </div>
                 <button type="submit" className="w-full bg-[#1e293b] hover:bg-[#0f172a] text-white py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase transition-all shadow-xl active:scale-95 mt-4">
                    {editingStudentId ? 'Simpan Perubahan' : 'Simpan Data Siswa'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {showSaveToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#1e293b] text-white px-6 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 border border-white/10">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;