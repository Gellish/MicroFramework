/**
 * Generates an RFC 4122 compliant UUIDv4.
 * Works in both Node.js and Modern Browsers.
 * @returns {string} UUIDv4
 */
export function uuidv4() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments if necessary, but randomUUID is widely supported now
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
