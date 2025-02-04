/**
 * @file Tool Type Definitions
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2024-02-04
 * 
 * Core type definitions for tools and their parameters
 */

export interface ToolParameters {
  type: 'object';
  properties: {
    [key: string]: any;
  };
  required?: string[];
}

export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameters;
  returns?: any;
  call: (params: any) => Promise<any>;
} 