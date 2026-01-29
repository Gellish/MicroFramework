require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function createAdmin() {
    console.log('🚀 Starting Admin Seeding Process...');

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
        console.error('   Please ensure you have added your Service Role Key to .env');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    const email = process.env.ADMIN_EMAIL || 'admin@email.com';
    const password = process.env.ADMIN_PASSWORD || 'test1234';

    console.log(`👤 Creating/Verifying Admin User: ${email}`);

    try {
        // 1. Check if user exists (by trying to get their ID via listUsers or just try creating)
        // Note: listUsers requires special permissions or iterating.
        // Simplest strategy: Try to create. If fails because "User already registered", we assume success.

        const { data, error } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { full_name: 'Super Admin', role: 'superadmin' }
        });

        if (error) {
            // Check for duplicate error
            if (error.status === 400 || error.message.includes('registered')) {
                console.log('⚠️  User already exists. Updating metadata/role...');

                // We need to find the user first to get their ID if we want to update by ID
                // Or we can use listUsers to find by email
                const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
                if (listError) throw listError;

                const existingUser = listData.users.find(u => u.email === email);
                if (existingUser) {
                    const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
                        user_metadata: { full_name: 'Super Admin', role: 'superadmin' }
                    });
                    if (updateError) throw updateError;

                    // Sync to profiles table
                    // We use 'username' based on the confirmed schema
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .update({ username: 'Super Admin', role: 'superadmin' })
                        .eq('id', existingUser.id);

                    if (profileError) {
                        if (profileError.message.includes('column "role"')) {
                            console.warn('\n❌ DATABASE ERROR: The "profiles" table is missing a "role" column.');
                            console.warn('👉 FIX: Open d:\\singlepageapplication\\supabase_setup.sql and run the command in Supabase SQL Editor.');
                            console.warn('   Command: ALTER TABLE profiles ADD COLUMN role text DEFAULT \'user\';\n');
                        } else {
                            console.warn('⚠️  Could not update profiles table:', profileError.message);
                        }
                    } else {
                        // Verify what was actually saved
                        const { data: verifyData } = await supabase.from('profiles').select('*').eq('id', existingUser.id).single();
                        console.log('📊 Current Profile in DB:', JSON.stringify(verifyData, null, 2));
                        console.log('✅ Profiles table synced.');
                    }

                    console.log('✅ Admin Metadata Updated to Super Admin.');
                }
            } else {
                throw error;
            }
        } else {
            console.log('✅ Admin User Created Successfully!');

            // Sync to profiles table for new user too (in case trigger is missing)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ username: 'Super Admin', role: 'superadmin' })
                .eq('id', data.user.id);

            if (profileError) console.warn('⚠️  Profiles sync skipped:', profileError.message);

            console.log(`   ID: ${data.user.id}`);
            console.log(`   Email: ${data.user.email}`);
            console.log(`   Password: ${password}`);
        }

    } catch (err) {
        console.error('❌ Unexpected Error:', err.message);
        process.exit(1);
    }
}

createAdmin();
