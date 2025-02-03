import { EncryptionService } from '../encryption';

describe('EncryptionService', () => {
  let encryption: EncryptionService;

  beforeEach(() => {
    encryption = new EncryptionService();
  });

  describe('encrypt and decrypt', () => {
    it('should successfully encrypt and decrypt data', async () => {
      const plaintext = 'Hello, World!';
      const encrypted = await encryption.encrypt(plaintext);
      const decrypted = await encryption.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty strings', async () => {
      const plaintext = '';
      const encrypted = await encryption.encrypt(plaintext);
      const decrypted = await encryption.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle long strings', async () => {
      const plaintext = 'a'.repeat(1000);
      const encrypted = await encryption.encrypt(plaintext);
      const decrypted = await encryption.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters', async () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = await encryption.encrypt(plaintext);
      const decrypted = await encryption.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', async () => {
      const plaintext = '你好，世界！🌍';
      const encrypted = await encryption.encrypt(plaintext);
      const decrypted = await encryption.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle JSON strings', async () => {
      const data = { hello: 'world', num: 42, arr: [1, 2, 3] };
      const plaintext = JSON.stringify(data);
      const encrypted = await encryption.encrypt(plaintext);
      const decrypted = await encryption.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle different encryption methods', async () => {
      const plaintext = 'Test different methods';
      const encrypted = await encryption.encrypt(plaintext, 'AES-GCM');
      const decrypted = await encryption.decrypt(encrypted, 'AES-GCM');
      expect(decrypted).toBe(plaintext);
    });

    it('should handle different key references', async () => {
      const plaintext = 'Test different keys';
      const keyRef = 'customKey';
      const encrypted = await encryption.encrypt(plaintext, 'AES-GCM', keyRef);
      const decrypted = await encryption.decrypt(encrypted, 'AES-GCM', keyRef);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('key management', () => {
    it('should export and import keys', async () => {
      const keyRef = 'testKey';
      const plaintext = 'Test export/import';
      
      // Encrypt with original key
      const encrypted = await encryption.encrypt(plaintext, 'AES-GCM', keyRef);
      
      // Export the key
      const exportedKey = await encryption.exportKey(keyRef);
      
      // Create new encryption service
      const newEncryption = new EncryptionService();
      
      // Import the key
      await newEncryption.importKey(exportedKey, 'AES-GCM', keyRef);
      
      // Decrypt with imported key
      const decrypted = await newEncryption.decrypt(encrypted, 'AES-GCM', keyRef);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle multiple keys', async () => {
      const plaintext = 'test';
      const encrypted1 = await encryption.encrypt(plaintext, 'AES-GCM', 'key1', true);
      const encrypted2 = await encryption.encrypt(plaintext, 'AES-GCM', 'key2', true);
      
      const decrypted1 = await encryption.decrypt(encrypted1, 'AES-GCM', 'key1');
      const decrypted2 = await encryption.decrypt(encrypted2, 'AES-GCM', 'key2');
      
      expect(decrypted1).toBe(plaintext);
      expect(decrypted2).toBe(plaintext);
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should clear keys correctly', async () => {
      const plaintext = 'test';
      const keyRef = 'testKey';
      
      const encrypted = await encryption.encrypt(plaintext, 'AES-GCM', keyRef, true);
      encryption.clearKeys();
      const encrypted2 = await encryption.encrypt(plaintext, 'AES-GCM', keyRef, true);
      
      expect(encrypted).not.toBe(encrypted2);
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid encryption method', async () => {
      await expect(encryption.encrypt('test', 'INVALID')).rejects.toThrow();
    });

    it('should throw error for invalid ciphertext', async () => {
      await expect(encryption.decrypt('invalid-base64!')).rejects.toThrow();
    });

    it('should throw error for tampered ciphertext', async () => {
      const encrypted = await encryption.encrypt('test');
      const tampered = encrypted.slice(0, -5) + 'XXXXX'; // Modify the end
      await expect(encryption.decrypt(tampered)).rejects.toThrow();
    });

    it('should throw error for wrong key', async () => {
      const encrypted = await encryption.encrypt('test', 'AES-GCM', 'key1');
      await expect(encryption.decrypt(encrypted, 'AES-GCM', 'key2')).rejects.toThrow();
    });

    it('should throw error for invalid key export reference', async () => {
      await expect(encryption.exportKey('nonexistent-key')).rejects.toThrow();
    });

    it('should throw error for invalid key import data', async () => {
      const invalidKey = { k: 'invalid-key-data' };
      await expect(encryption.importKey(invalidKey)).rejects.toThrow();
    });

    it('should handle encryption info extraction errors', () => {
      const result = encryption.getEncryptionInfo('not-encrypted-data');
      expect(result).toBeNull();
    });

    it('should handle malformed encryption info', () => {
      const malformed = Buffer.from('{"invalid":"json').toString('base64');
      const result = encryption.getEncryptionInfo(`encrypted:${malformed}`);
      expect(result).toBeNull();
    });
  });
}); 
