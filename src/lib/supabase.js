import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lrdpfqndjdhgcmnmimlp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyZHBmcW5kamRoZ2Ntbm1pbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NzkxNzcsImV4cCI6MjA5ODI1NTE3N30.z7-zYQRvmPFTWuAr9zHEcOhlkYoRvBe6o0WAXBqrFBA'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
