/// <reference lib="dom" />
import { webcrypto } from 'node:crypto';
import { TextEncoder, TextDecoder } from 'util';
const { subtle } = webcrypto;

// Add type imports from lib.dom.d.ts
type CryptoKey = webcrypto.CryptoKey;
type JsonWebKey = webcrypto.JsonWebKey;

export class EncryptionService {
  private keyCache: Map<string, CryptoKey>;
  private encoder: TextEncoder;
  private decoder: TextDecoder;
  private readonly IV_LENGTH = 12;

  constructor() {
    this.keyCache = new Map();
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
  }

  private async generateKey(method: string, keyRef: string, isTest: boolean = false): Promise<CryptoKey> {
    if (method !== 'AES-GCM') {
      throw new Error('Unsupported encryption method: ' + method);
    }

    // Generate a 32-byte key (256 bits)
    const seed = new Uint8Array(32);
    if (isTest) {
      // In test mode, use a deterministic seed based on keyRef and timestamp
      const timestamp = Date.now().toString();
      const keyBytes = this.encoder.encode(keyRef + timestamp);
      const hash = new Uint32Array(8); // 32 bytes / 4 bytes per uint32
      
      // Simple hash function to distribute keyRef bytes across the seed
      for (let i = 0; i < keyBytes.length; i++) {
        const pos = i % 8;
        hash[pos] = ((hash[pos] << 5) - hash[pos]) + keyBytes[i];
      }
      
      // Fill seed with hash values
      const hashBytes = new Uint8Array(hash.buffer);
      for (let i = 0; i < 32; i++) {
        seed[i] = hashBytes[i % hashBytes.length];
      }
    } else {
      // In production, use random values
      webcrypto.getRandomValues(seed);
    }
    
    return subtle.importKey(
      'raw',
      seed,
      {
        name: method,
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  private async getKey(method: string, keyRef: string, isTest: boolean = false): Promise<CryptoKey> {
    const keyId = `${method}:${keyRef}`;
    let key = this.keyCache.get(keyId);
    
    if (!key) {
      key = await this.generateKey(method, keyRef, isTest);
      this.keyCache.set(keyId, key);
    }
    
    return key;
  }

  async encrypt(plaintext: string, method: string = 'AES-GCM', keyRef: string = 'defaultKey', isTest: boolean = false): Promise<string> {
    try {
      const key = await this.getKey(method, keyRef, isTest);
      let iv: Uint8Array;
      
      if (isTest) {
        // In test mode, use a deterministic IV based on both keyRef and plaintext
        const keyBytes = this.encoder.encode(keyRef);
        const textBytes = this.encoder.encode(plaintext);
        iv = new Uint8Array(this.IV_LENGTH);
        
        // Mix keyRef and plaintext bytes to create IV
        for (let i = 0; i < this.IV_LENGTH; i++) {
          iv[i] = (
            (i < keyBytes.length ? keyBytes[i] : 0) ^
            (i < textBytes.length ? textBytes[i] : 0)
          ) % 256;
        }
      } else {
        iv = webcrypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
      }

      const algorithm = {
        name: method,
        iv
      };
      const encodedData = this.encoder.encode(plaintext);
      
      const encryptedData = await subtle.encrypt(
        algorithm,
        key,
        encodedData
      );

      // Convert ArrayBuffer to Uint8Array for manipulation
      const encryptedArray = new Uint8Array(encryptedData);
      
      // Create combined array with space for both IV and encrypted data
      const combined = new Uint8Array(this.IV_LENGTH + encryptedArray.byteLength);
      
      // Copy IV and encrypted data into combined array
      combined.set(iv, 0);
      combined.set(encryptedArray, this.IV_LENGTH);
      
      // Convert to base64 for storage/transmission
      return Buffer.from(combined).toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  async decrypt(
    ciphertext: string,
    method: string = 'AES-GCM',
    keyRef: string = 'defaultKey',
    isTest: boolean = false
  ): Promise<string> {
    try {
      const key = await this.getKey(method, keyRef, isTest);
      if (!key) {
        throw new Error('No key available for decryption');
      }

      const data = Buffer.from(ciphertext, 'base64');
      const iv = data.subarray(0, this.IV_LENGTH);
      const encryptedData = data.subarray(this.IV_LENGTH);

      const decryptedData = await subtle.decrypt(
        {
          name: method,
          iv
        },
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
    const keyId = `${method}:${keyRef}`;
    const key = this.keyCache.get(keyId);
    if (!key) {
      throw new Error(`Key not found: ${keyRef}`);
    }
    return subtle.exportKey('jwk', key);
  }

  async importKey(jwk: JsonWebKey, method: string = 'AES-GCM', keyRef: string = 'defaultKey'): Promise<void> {
    try {
      const key = await subtle.importKey(
        'jwk',
        jwk,
        { name: method },
        true,
        ['encrypt', 'decrypt']
      );
      this.keyCache.set(`${method}:${keyRef}`, key);
    } catch (error) {
      throw new Error('Failed to import key');
    }
  }

  clearKeys(): void {
    this.keyCache.clear();
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