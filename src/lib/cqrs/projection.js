import { validateEvent } from './validator.js';

/**
 * Rebuilds the state of an aggregate by replaying its events.
 * @param {Array} events 
 * @param {Function} reducer (state, event) => newState
 * @param {Object} initialState 
 * @returns {Object} Final state
 */
export function projectState(events, reducer, initialState = {}) {
    let state = { ...initialState };

    for (const event of events) {
        // Validate each event before projecting it
        validateEvent(event);

        // Apply the reducer
        state = reducer(state, event);
    }

    return state;
}

/**
 * Example Page Reducer
 */
export function pageReducer(state, event) {
    switch (event.eventType) {
        case 'PAGE_CREATED':
            return {
                ...state,
                id: event.aggregateId,
                title: event.payload.title,
                content: event.payload.content,
                createdAt: event.timestamp,
                updatedAt: event.timestamp,
                version: event.version
            };
        case 'PAGE_UPDATED':
            return {
                ...state,
                title: event.payload.title ?? state.title,
                content: event.payload.content ?? state.content,
                updatedAt: event.timestamp,
                version: event.version
            };
        default:
            return state;
    }
}

/**
 * User Reducer
 */
export function userReducer(state, event) {
    switch (event.eventType) {
        case 'USER_CREATED':
            return {
                ...state,
                id: event.aggregateId,
                email: event.payload.email,
                name: event.payload.name,
                role: event.payload.role || 'user',
                status: event.payload.status || 'active',
                createdAt: event.timestamp,
                updatedAt: event.timestamp,
                version: event.version
            };
        case 'USER_UPDATED':
            return {
                ...state,
                email: event.payload.email ?? state.email,
                name: event.payload.name ?? state.name,
                role: event.payload.role ?? state.role,
                status: event.payload.status ?? state.status,
                updatedAt: event.timestamp,
                version: event.version
            };
        default:
            return state;
    }
}
