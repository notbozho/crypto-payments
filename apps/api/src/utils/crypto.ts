import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

export class CryptoError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "CryptoError";
    }
}

function deriveKey(masterKey: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, "sha512");
}

export function encryptPrivateKey(privateKey: string): string {
    try {
        const masterKey = process.env.WALLET_ENCRYPTION_KEY;
        if (!masterKey) {
            throw new CryptoError(
                "WALLET_ENCRYPTION_KEY environment variable not set"
            );
        }

        const salt = crypto.randomBytes(SALT_LENGTH);
        const iv = crypto.randomBytes(IV_LENGTH);
        const key = deriveKey(masterKey, salt);

        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        cipher.setAAD(salt);

        let encrypted = cipher.update(privateKey, "utf8", "hex");
        encrypted += cipher.final("hex");

        const authTag = cipher.getAuthTag();

        // Combine salt + iv + authTag + encrypted data
        const combined = Buffer.concat([
            salt,
            iv,
            authTag,
            Buffer.from(encrypted, "hex"),
        ]);

        return combined.toString("base64");
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        throw new CryptoError(`Failed to encrypt private key: ${errMsg}`);
    }
}

export function decryptPrivateKey(encryptedData: string): string {
    try {
        const masterKey = process.env.WALLET_ENCRYPTION_KEY;
        if (!masterKey) {
            throw new CryptoError(
                "WALLET_ENCRYPTION_KEY environment variable not set"
            );
        }

        const combined = Buffer.from(encryptedData, "base64");

        const salt = combined.subarray(0, SALT_LENGTH);
        const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const authTag = combined.subarray(
            SALT_LENGTH + IV_LENGTH,
            SALT_LENGTH + IV_LENGTH + 16
        );
        const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + 16);

        const key = deriveKey(masterKey, salt);

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        decipher.setAAD(salt);

        let decrypted = decipher.update(encrypted, undefined, "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        throw new CryptoError(`Failed to decrypt private key: ${errMsg}`);
    }
}
