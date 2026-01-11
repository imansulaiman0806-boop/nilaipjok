
import { createClient } from '@supabase/supabase-js';

/**
 * KONFIGURASI SUPABASE - SMP PGRI JATIUWUNG
 * Data ini digunakan untuk mensinkronkan data antar perangkat melalui Cloud.
 */

const supabaseUrl = 'https://clltvnwqtdylfblkngpc.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbHR2bndxdGR5bGZibGtuZ3BjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NzE4NzEsImV4cCI6MjA4MzQ0Nzg3MX0.PsebKSLcH60KlZ2g_1M2O3-APKION5OcNsIz_sslbKc'; 

// Inisialisasi client Supabase
export const supabase = (supabaseUrl && supabaseAnonKey && supabaseAnonKey.startsWith('eyJ')) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
