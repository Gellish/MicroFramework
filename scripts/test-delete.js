import { deleteAggregate, getAllAggregates } from '../src/lib/cqrs/event-store.js';

async function testDelete() {
    console.log('--- Testing Delete Logic ---');
    try {
        const aggregates = await getAllAggregates();
        if (aggregates.length === 0) {
            console.log('No aggregates to delete.');
            return;
        }

        const target = aggregates[0];
        console.log(`Deleting aggregate: ${target.type}-${target.id}`);

        await deleteAggregate(target.type, target.id);

        const remaining = await getAllAggregates();
        const stillExists = remaining.some(a => a.id === target.id);

        if (!stillExists) {
            console.log('✅ Success: Aggregate deleted.');
        } else {
            console.log('❌ Failure: Aggregate still exists.');
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

testDelete();
