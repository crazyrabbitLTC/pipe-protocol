"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSummary = generateSummary;
exports.isValidScope = isValidScope;
exports.deepClone = deepClone;
exports.generateTimestamp = generateTimestamp;
exports.isValidCID = isValidCID;
exports.formatError = formatError;
/**
 * Generates a summary of the provided data
 * @param data Any data to be summarized
 * @returns A string summary of the data
 */
async function generateSummary(data) {
    try {
        // Convert data to string if it's not already
        const stringData = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        // For now, return a simple summary
        // In a production environment, this could use an LLM or other summarization technique
        const summary = `Data of type ${typeof data}, length: ${stringData.length} characters`;
        return summary;
    }
    catch (error) {
        console.error('Error generating summary:', error);
        return 'Error generating summary';
    }
}
/**
 * Validates a scope value
 * @param scope The scope to validate
 * @returns boolean indicating if the scope is valid
 */
function isValidScope(scope) {
    return ['private', 'public', 'machine', 'user'].includes(scope);
}
/**
 * Deep clones an object
 * @param obj The object to clone
 * @returns A deep clone of the object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
/**
 * Generates a timestamp in ISO format
 * @returns Current timestamp in ISO format
 */
function generateTimestamp() {
    return new Date().toISOString();
}
/**
 * Validates a CID string
 * @param cid The CID to validate
 * @returns boolean indicating if the CID is valid
 */
function isValidCID(cid) {
    // Basic validation - could be enhanced with actual CID validation logic
    return typeof cid === 'string' && cid.length > 0;
}
/**
 * Formats error messages
 * @param message The error message
 * @param code Optional error code
 * @returns Formatted error message
 */
function formatError(message, code) {
    return code ? `[${code}] ${message}` : message;
}
//# sourceMappingURL=index.js.map