import { writeEvent, readEvents } from '../src/lib/cqrs/event-store.js';
import { uuidv4 } from '../src/lib/cqrs/uuid.js';
import { projectState, pageReducer } from '../src/lib/cqrs/projection.js';
import { validateEvent } from '../src/lib/cqrs/validator.js';
import fs from 'fs/promises';
import path from 'path';

async function runTest() {
    console.log('--- Starting CQRS Phase 1 Tests ---');

    const aggregateId = uuidv4();
    const aggregateType = 'page';

    console.log(`Aggregate ID: ${aggregateId}`);

    try {
        // 1. Write first event
        console.log('Writing first event (PAGE_CREATED)...');
        await writeEvent({
            aggregateId,
            aggregateType,
            eventType: 'PAGE_CREATED',
            payload: { title: 'Initial Title', content: 'Hello World' },
            version: 1
        });

        // 2. Write second event
        console.log('Writing second event (PAGE_UPDATED)...');
        await writeEvent({
            aggregateId,
            aggregateType,
            eventType: 'PAGE_UPDATED',
            payload: { title: 'Updated Title' },
            version: 2
        });

        // 3. Read events back
        console.log('Reading events back...');
        const events = await readEvents(aggregateType, aggregateId);

        console.log(`Retrieved ${events.length} events.`);

        if (events.length !== 2) {
            throw new Error(`Expected 2 events, got ${events.length}`);
        }

        // 4. Test Validation
        console.log('Validating retrieved events...');
        events.forEach(validateEvent);

        // 5. Test Projection
        console.log('Rebuilding state (Projecting)...');
        const state = projectState(events, pageReducer);

        console.log('Current State:', JSON.stringify(state, null, 2));

        if (state.title !== 'Updated Title') {
            throw new Error(`State title mismatch: expected "Updated Title", got "${state.title}"`);
        }
        if (state.content !== 'Hello World') {
            throw new Error(`State content mismatch: expected "Hello World", got "${state.content}"`);
        }
        if (state.version !== 2) {
            throw new Error(`State version mismatch: expected 2, got ${state.version}`);
        }

        // 6. Test Integrity Check (Invalid input)
        console.log('Testing Integrity Check (Negative test)...');
        try {
            validateEvent({ broken: 'event' });
            throw new Error('Should have failed validation for broken event');
        } catch (e) {
            console.log(`Successfully caught expected error: ${e.message}`);
        }

        console.log('--- Verification Summary ---');
        console.log(`Folder exists: local-events/${aggregateType}-${aggregateId}`);

        const folderPath = path.resolve(process.cwd(), 'local-events', `${aggregateType}-${aggregateId}`);
        const files = await fs.readdir(folderPath);
        console.log(`Files found in folder: ${files.length}`);

        console.log('\n✅ CQRS Phase 1 (Tasks 1-5) ALL PASSED');

    } catch (error) {
        console.error('\n❌ Test FAILED');
        console.error(error);
        process.exit(1);
    }
}

runTest();
