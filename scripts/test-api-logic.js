import { getAllAggregates, readEvents } from '../src/lib/cqrs/event-store.js';
import { projectState, pageReducer } from '../src/lib/cqrs/projection.js';

async function testApiLogic() {
    console.log('--- Testing API Logic ---');
    try {
        const aggregates = await getAllAggregates();
        console.log(`Found ${aggregates.length} aggregates`);

        const results = await Promise.all(aggregates.map(async (a) => {
            const events = await readEvents(a.type, a.id);
            const state = projectState(events, pageReducer);
            return {
                id: a.id,
                type: a.type,
                state: state,
                eventsCount: events.length
            };
        }));

        console.log('Results:', JSON.stringify(results, null, 2));
    } catch (err) {
        console.error('Error:', err);
    }
}

testApiLogic();
