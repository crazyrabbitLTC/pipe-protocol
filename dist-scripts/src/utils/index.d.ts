/**
 * Generates a summary of the provided data
 * @param data Any data to be summarized
 * @returns A string summary of the data
 */
export declare function generateSummary(data: any): Promise<string>;
/**
 * Validates a scope value
 * @param scope The scope to validate
 * @returns boolean indicating if the scope is valid
 */
export declare function isValidScope(scope: any): boolean;
/**
 * Deep clones an object
 * @param obj The object to clone
 * @returns A deep clone of the object
 */
export declare function deepClone<T>(obj: T): T;
/**
 * Generates a timestamp in ISO format
 * @returns Current timestamp in ISO format
 */
export declare function generateTimestamp(): string;
/**
 * Validates a CID string
 * @param cid The CID to validate
 * @returns boolean indicating if the CID is valid
 */
export declare function isValidCID(cid: string): boolean;
/**
 * Formats error messages
 * @param message The error message
 * @param code Optional error code
 * @returns Formatted error message
 */
export declare function formatError(message: string, code?: string): string;
//# sourceMappingURL=index.d.ts.map