import { writeEvent, getAllAggregates } from '../src/lib/cqrs/event-store.js';
import { uuidv4 } from '../src/lib/cqrs/uuid.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@email.com';
const ADMIN_NAME = 'Initial Admin';
const ADMIN_ROLE = 'admin';

async function seedAdmin() {
    console.log('--- Seeding Admin User ---');
    try {
        const aggregates = await getAllAggregates();
        const adminExists = aggregates.some(a => a.type === 'user'); // Simple check for any user

        if (adminExists) {
            console.log('User(s) already exist. Skipping seed.');
            return;
        }

        console.log(`Seeding admin: ${ADMIN_EMAIL}`);
        const id = uuidv4();
        await writeEvent({
            aggregateId: id,
            aggregateType: 'user',
            eventType: 'USER_CREATED',
            version: 1,
            payload: {
                email: ADMIN_EMAIL,
                name: ADMIN_NAME,
                role: ADMIN_ROLE,
                status: 'active'
            }
        });
        console.log('✅ Admin user seeded successfully.');
    } catch (err) {
        console.error('Error seeding admin:', err);
    }
}

seedAdmin();
