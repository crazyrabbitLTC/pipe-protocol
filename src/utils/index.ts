/**
 * Generates a summary of the provided data
 * @param data Any data to be summarized
 * @returns A string summary of the data
 */
export async function generateSummary(data: any): Promise<string> {
  try {
    // Convert data to string if it's not already
    const stringData = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    
    // For now, return a simple summary
    // In a production environment, this could use an LLM or other summarization technique
    const summary = `Data of type ${typeof data}, length: ${stringData.length} characters`;
    
    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Error generating summary';
  }
}

/**
 * Validates a scope value
 * @param scope The scope to validate
 * @returns boolean indicating if the scope is valid
 */
export function isValidScope(scope: any): boolean {
  return ['private', 'public', 'machine', 'user'].includes(scope);
}

/**
 * Deep clones an object
 * @param obj The object to clone
 * @returns A deep clone of the object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Generates a timestamp in ISO format
 * @returns Current timestamp in ISO format
 */
export function generateTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Validates a CID string
 * @param cid The CID to validate
 * @returns boolean indicating if the CID is valid
 */
export function isValidCID(cid: string): boolean {
  // Basic validation - could be enhanced with actual CID validation logic
  return typeof cid === 'string' && cid.length > 0;
}

/**
 * Formats error messages
 * @param message The error message
 * @param code Optional error code
 * @returns Formatted error message
 */
export function formatError(message: string, code?: string): string {
  return code ? `[${code}] ${message}` : message;
} 