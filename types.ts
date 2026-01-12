
export enum Gender {
  L = 'L',
  P = 'P'
}

export enum AttendanceStatus {
  H = 'H', // Hadir
  I = 'I', // Izin
  S = 'S', // Sakit
  A = 'A', // Alpa
  D = 'D'  // Dispensasi
}

export interface Student {
  id: string;
  nis: string;
  cardId: string;
  name: string;
  className: string;
  gender: Gender;
}

export interface AttendanceRecord {
  studentId: string;
  date: string; // ISO string YYYY-MM-DD
  timestamp?: string; // HH:MM
  status: AttendanceStatus;
  notes?: string;
}

export interface Grades {
  daily: number[]; // N1, N2, N3...
  pts: number;
  pas: number;
  // Nilai Perbaikan (Remedial)
  dailyRemedial?: number[]; 
  ptsRemedial?: number;
  pasRemedial?: number;
}

export interface MaterialInfo {
  id: string;
  label: string; // e.g. "NH1"
  topic: string; // e.g. "Bola Voli"
}

export interface KKMConfig {
  '7': number;
  '8': number;
  '9': number;
  [key: string]: number; // Fallback index signature
}

export interface SemesterConfig {
  kkm: KKMConfig;
  materials: MaterialInfo[];
}

export interface SemesterData {
  semester: 1 | 2;
  config: SemesterConfig; // Added config for KKM and Materials
  grades: Record<string, Grades>; // studentId -> Grades
  attendance: AttendanceRecord[];
}

export interface AppState {
  students: Student[];
  semesters: {
    1: SemesterData;
    2: SemesterData;
  };
}
