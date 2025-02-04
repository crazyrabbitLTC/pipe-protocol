import { webcrypto } from 'node:crypto';
type JsonWebKey = webcrypto.JsonWebKey;
export declare class EncryptionService {
    private keyCache;
    private encoder;
    private decoder;
    private readonly IV_LENGTH;
    constructor();
    private generateKey;
    private getKey;
    encrypt(plaintext: string, method?: string, keyRef?: string, isTest?: boolean): Promise<string>;
    decrypt(ciphertext: string, method?: string, keyRef?: string, isTest?: boolean): Promise<string>;
    exportKey(keyRef: string, method?: string): Promise<JsonWebKey>;
    importKey(jwk: JsonWebKey, method?: string, keyRef?: string): Promise<void>;
    clearKeys(): void;
    getEncryptionInfo(ciphertext: string): {
        method: string;
        keyRef: string;
    } | null;
}
export {};
//# sourceMappingURL=encryption.d.ts.map