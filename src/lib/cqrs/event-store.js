import fs from 'fs/promises';
import path from 'path';
import { uuidv4 } from './uuid.js';

const EVENTS_DIR = path.resolve(process.cwd(), 'local-events');

/**
 * Ensures the aggregate folder exists and writes an event JSON file.
 * @param {Object} eventData 
 * @param {string} eventData.aggregateId
 * @param {string} eventData.aggregateType
 * @param {string} eventData.eventType
 * @param {Object} eventData.payload
 * @param {number} eventData.version
 */
export async function writeEvent(eventData) {
    const { aggregateId, aggregateType, eventType, payload, version } = eventData;

    if (!aggregateId || !aggregateType || !eventType || !payload || version === undefined) {
        throw new Error('Missing required event fields');
    }

    const eventId = uuidv4();
    const timestamp = new Date().toISOString();

    const event = {
        eventId,
        aggregateId,
        aggregateType,
        eventType,
        payload,
        version,
        timestamp
    };

    const aggregateFolderName = `${aggregateType}-${aggregateId}`;
    const aggregatePath = path.join(EVENTS_DIR, aggregateFolderName);

    // Ensure the base events directory exists
    await fs.mkdir(EVENTS_DIR, { recursive: true });
    // Ensure the aggregate directory exists
    await fs.mkdir(aggregatePath, { recursive: true });

    const fileName = `event-uuid-${eventId}.json`;
    const filePath = path.join(aggregatePath, fileName);

    // Use 'wx' flag to fail if file exists (never overwrite)
    await fs.writeFile(filePath, JSON.stringify(event, null, 2), { flag: 'wx' });

    return event;
}

/**
 * Reads all events for a given aggregate.
 * @param {string} aggregateType 
 * @param {string} aggregateId 
 * @returns {Promise<Array>} Sorted events list
 */
export async function readEvents(aggregateType, aggregateId) {
    const aggregateFolderName = `${aggregateType}-${aggregateId}`;
    const aggregatePath = path.join(EVENTS_DIR, aggregateFolderName);

    try {
        const files = await fs.readdir(aggregatePath);
        const eventFiles = files.filter(f => f.startsWith('event-uuid-') && f.endsWith('.json'));

        const events = await Promise.all(
            eventFiles.map(async (file) => {
                const content = await fs.readFile(path.join(aggregatePath, file), 'utf-8');
                return JSON.parse(content);
            })
        );

        // Sort by timestamp
        return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } catch (error) {
        if (error.code === 'ENOENT') {
            return []; // Return empty if directory not found
        }
        throw error;
    }
}

/**
 * Lists all aggregates in the event store.
 * @returns {Promise<Array<{type: string, id: string}>>}
 */
export async function getAllAggregates() {
    try {
        const entries = await fs.readdir(EVENTS_DIR, { withFileTypes: true });
        return entries
            .filter(entry => entry.isDirectory())
            .map(entry => {
                const name = entry.name;
                const firstDashIndex = name.indexOf('-');
                if (firstDashIndex === -1) return null;
                return {
                    type: name.substring(0, firstDashIndex),
                    id: name.substring(firstDashIndex + 1)
                };
            })
            .filter(Boolean);
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
}

/**
 * Deletes an entire aggregate (folder and all events).
 * @param {string} aggregateType
 * @param {string} aggregateId
 */
export async function deleteAggregate(aggregateType, aggregateId) {
    const dirPath = path.join(EVENTS_DIR, `${aggregateType}-${aggregateId}`);
    try {
        await fs.rm(dirPath, { recursive: true, force: true });
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }
}
