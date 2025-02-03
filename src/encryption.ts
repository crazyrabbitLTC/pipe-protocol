/// <reference lib="dom" />
import { webcrypto } from 'node:crypto';
import { TextEncoder, TextDecoder } from 'util';
const { subtle } = webcrypto;

// Add type imports from lib.dom.d.ts
type CryptoKey = webcrypto.CryptoKey;
type JsonWebKey = webcrypto.JsonWebKey;
type AesGcmParams = webcrypto.AesGcmParams;

export class EncryptionService {
  private keys: Map<string, CryptoKey>;
  private encoder: TextEncoder;
  private decoder: TextDecoder;
  private readonly IV_LENGTH = 12;

  constructor() {
    this.keys = new Map();
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
  }

  private async generateKey(method: string): Promise<CryptoKey> {
    switch (method) {
      case 'AES-GCM':
        return await subtle.generateKey(
          {
            name: 'AES-GCM',
            length: 256
          },
          true,
          ['encrypt', 'decrypt']
        );
      default:
        throw new Error(`Unsupported encryption method: ${method}`);
    }
  }

  private async getKey(method: string, keyRef: string): Promise<CryptoKey> {
    const keyId = `${method}:${keyRef}`;
    let key = this.keys.get(keyId);
    
    if (!key) {
      key = await this.generateKey(method);
      this.keys.set(keyId, key);
    }
    
    return key;
  }

  private async getAlgorithm(method: string): Promise<AesGcmParams> {
    switch (method) {
      case 'AES-GCM':
        const iv = webcrypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
        return {
          name: 'AES-GCM',
          iv
        };
      default:
        throw new Error(`Unsupported encryption method: ${method}`);
    }
  }

  private getUint8Array(data: ArrayBuffer | Uint8Array | BufferSource): Uint8Array {
    if (data instanceof Uint8Array) return data;
    if (data instanceof ArrayBuffer) return new Uint8Array(data);
    if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer);
    throw new Error('Invalid data type');
  }

  async encrypt(plaintext: string, method: string = 'AES-GCM', keyRef: string = 'defaultKey'): Promise<string> {
    try {
      const key = await this.getKey(method, keyRef);
      const algorithm = await this.getAlgorithm(method);
      const encodedData = this.encoder.encode(plaintext);
      
      const encryptedData = await subtle.encrypt(
        algorithm,
        key,
        encodedData
      );

      // Convert ArrayBuffer to Uint8Array for manipulation
      const encryptedArray = this.getUint8Array(encryptedData);
      const ivArray = this.getUint8Array(algorithm.iv);
      
      // Create combined array with space for both IV and encrypted data
      const combined = new Uint8Array(this.IV_LENGTH + encryptedArray.length);
      
      // Copy IV and encrypted data into combined array
      combined.set(ivArray, 0);
      combined.set(encryptedArray, this.IV_LENGTH);
      
      // Convert to base64 for storage/transmission
      return Buffer.from(combined).toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  async decrypt(ciphertext: string, method: string = 'AES-GCM', keyRef: string = 'defaultKey'): Promise<string> {
    try {
      const key = await this.getKey(method, keyRef);
      
      // Convert from base64 and separate IV and data
      const combined = new Uint8Array(Buffer.from(ciphertext, 'base64'));
      const iv = combined.slice(0, this.IV_LENGTH);
      const encryptedData = combined.slice(this.IV_LENGTH);
      
      const algorithm = {
        name: method,
        iv
      };
      
      const decryptedData = await subtle.decrypt(
        algorithm,
        key,
        encryptedData
      );
      
      return this.decoder.decode(new Uint8Array(decryptedData));
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  async exportKey(keyRef: string, method: string = 'AES-GCM'): Promise<JsonWebKey> {
    const key = await this.getKey(method, keyRef);
    return subtle.exportKey('jwk', key);
  }

  async importKey(jwk: JsonWebKey, method: string = 'AES-GCM', keyRef: string = 'defaultKey'): Promise<void> {
    const key = await subtle.importKey(
      'jwk',
      jwk,
      { name: method },
      true,
      ['encrypt', 'decrypt']
    );
    this.keys.set(`${method}:${keyRef}`, key);
  }

  clearKeys(): void {
    this.keys.clear();
  }

  getEncryptionInfo(ciphertext: string): { method: string; keyRef: string } | null {
    if (!ciphertext.startsWith('encrypted:')) {
      return null;
    }
    
    try {
      const base64Data = ciphertext.slice(10); // Remove 'encrypted:' prefix
      const decryptedJson = Buffer.from(base64Data, 'base64').toString();
      const { method, keyRef } = JSON.parse(decryptedJson);
      return { method, keyRef };
    } catch (error) {
      console.warn('Failed to extract encryption info:', error);
      return null;
    }
  }
} 
} 