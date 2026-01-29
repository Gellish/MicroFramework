
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
    process.exit(1);
}

console.log(`Checking connection to: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        // Just try to fetch session (lightweight)
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            console.error('❌ Supabase Error:', error.message);
        } else {
            console.log('✅ Supabase Connection Successful!');
            console.log('   (Client initialized and Auth service reachable)');
        }

    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
    }
}

testConnection();
