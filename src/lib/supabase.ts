import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rwgnmnukzwiiqicaiubf.supabase.co/rest/v1/'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z25tbnVrendpaXFpY2FpdWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MjUzOTYsImV4cCI6MjA5NDMwMTM5Nn0.GiexKferU25UT_lKpfsZ6Vxw933Rf86UWE2DhfQNsYA'

export const supabase = createClient(supabaseUrl, supabaseKey)