import { writeEvent } from '../src/lib/cqrs/event-store.js';

const aggregateId = 'da64da60-bd3f-4c29-816e-290f2e650ada';
const aggregateType = 'page';

async function seed() {
    console.log(`Seeding events for ${aggregateId}...`);

    await writeEvent({
        aggregateId,
        aggregateType,
        eventType: 'PAGE_CREATED',
        payload: { title: 'Hello Phase 1', content: 'This is the first event ever!' },
        version: 1
    });

    await writeEvent({
        aggregateId,
        aggregateType,
        eventType: 'PAGE_UPDATED',
        payload: { title: 'Hello Phase 1 (Updated)', content: 'Data is now durable.' },
        version: 2
    });

    console.log('✅ Seeded! Now refresh your browser.');
}

seed();
