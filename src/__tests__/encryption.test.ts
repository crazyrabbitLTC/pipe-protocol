import { EncryptionService } from '../encryption';

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;

  beforeEach(() => {
    encryptionService = new EncryptionService();
  });

  afterEach(() => {
    encryptionService.clearKeys();
  });

  describe('encrypt and decrypt', () => {
    it('should successfully encrypt and decrypt data', async () => {
      const plaintext = 'Hello, World!';
      const encrypted = await encryptionService.encrypt(plaintext);
      const decrypted = await encryptionService.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty strings', async () => {
      const plaintext = '';
      const encrypted = await encryptionService.encrypt(plaintext);
      const decrypted = await encryptionService.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle long strings', async () => {
      const plaintext = 'a'.repeat(1000);
      const encrypted = await encryptionService.encrypt(plaintext);
      const decrypted = await encryptionService.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters', async () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:,.<>?`~';
      const encrypted = await encryptionService.encrypt(plaintext);
      const decrypted = await encryptionService.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', async () => {
      const plaintext = '你好，世界！🌍';
      const encrypted = await encryptionService.encrypt(plaintext);
      const decrypted = await encryptionService.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle JSON strings', async () => {
      const data = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com'
      };
      const plaintext = JSON.stringify(data);
      const encrypted = await encryptionService.encrypt(plaintext);
      const decrypted = await encryptionService.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
      expect(JSON.parse(decrypted)).toEqual(data);
    });
  });

  describe('key management', () => {
    it('should export and import keys', async () => {
      const plaintext = 'Hello, World!';
      const keyRef = 'testKey';
      
      // Encrypt with original key
      const encrypted = await encryptionService.encrypt(plaintext, 'AES-GCM', keyRef);
      
      // Export the key
      const exportedKey = await encryptionService.exportKey(keyRef);
      
      // Create new encryption service
      const newService = new EncryptionService();
      
      // Import the key
      await newService.importKey(exportedKey, 'AES-GCM', keyRef);
      
      // Decrypt with imported key
      const decrypted = await newService.decrypt(encrypted, 'AES-GCM', keyRef);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle multiple keys', async () => {
      const plaintext = 'Hello, World!';
      const keyRef1 = 'key1';
      const keyRef2 = 'key2';
      
      const encrypted1 = await encryptionService.encrypt(plaintext, 'AES-GCM', keyRef1);
      const encrypted2 = await encryptionService.encrypt(plaintext, 'AES-GCM', keyRef2);
      
      expect(encrypted1).not.toBe(encrypted2);
      
      const decrypted1 = await encryptionService.decrypt(encrypted1, 'AES-GCM', keyRef1);
      const decrypted2 = await encryptionService.decrypt(encrypted2, 'AES-GCM', keyRef2);
      
      expect(decrypted1).toBe(plaintext);
      expect(decrypted2).toBe(plaintext);
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid encryption method', async () => {
      const plaintext = 'Hello, World!';
      await expect(encryptionService.encrypt(plaintext, 'INVALID')).rejects.toThrow();
    });

    it('should throw error for invalid ciphertext', async () => {
      await expect(encryptionService.decrypt('invalid-base64')).rejects.toThrow();
    });

    it('should throw error for tampered ciphertext', async () => {
      const plaintext = 'Hello, World!';
      const encrypted = await encryptionService.encrypt(plaintext);
      const tampered = encrypted.slice(0, -1) + 'X'; // Change last character
      await expect(encryptionService.decrypt(tampered)).rejects.toThrow();
    });

    it('should throw error for wrong key', async () => {
      const plaintext = 'Hello, World!';
      const encrypted = await encryptionService.encrypt(plaintext, 'AES-GCM', 'key1');
      await expect(encryptionService.decrypt(encrypted, 'AES-GCM', 'key2')).rejects.toThrow();
    });
  });
}); 