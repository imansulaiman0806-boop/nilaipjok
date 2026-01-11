
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://clltvnwqtdylfblkngpc.supabase.co';
const supabaseAnonKey = 'sb_publishable_RDqzQikGFfuixIPeqg-4gw_8YR7kGw4';

export const supabase = (supabaseUrl && supabaseAnonKey && !supabaseAnonKey.includes('MASUKKAN')) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
