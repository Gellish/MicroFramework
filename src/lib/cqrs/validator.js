/**
 * Validates an event object against the required schema.
 * @param {Object} event 
 * @returns {boolean}
 * @throws {Error} if validation fails
 */
export function validateEvent(event) {
    if (!event || typeof event !== 'object') {
        throw new Error('Event must be an object');
    }

    const requiredFields = [
        'eventId',
        'aggregateId',
        'aggregateType',
        'eventType',
        'payload',
        'version',
        'timestamp'
    ];

    for (const field of requiredFields) {
        if (event[field] === undefined || event[field] === null) {
            throw new Error(`Missing required field: ${field}`);
        }
    }

    // UUIDv4 format check (basic regex)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(event.eventId)) {
        throw new Error(`Invalid eventId format (expected UUIDv4): ${event.eventId}`);
    }

    if (!uuidRegex.test(event.aggregateId)) {
        throw new Error(`Invalid aggregateId format (expected UUIDv4): ${event.aggregateId}`);
    }

    if (typeof event.version !== 'number' || event.version < 1) {
        throw new Error(`Invalid version: ${event.version}`);
    }

    if (isNaN(Date.parse(event.timestamp))) {
        throw new Error(`Invalid timestamp: ${event.timestamp}`);
    }

    return true;
}
