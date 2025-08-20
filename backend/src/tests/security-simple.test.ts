import { describe, it, expect } from '@jest/globals'
import { EncryptionService } from '../services/encryption'

describe('Security - Simple Tests', () => {
    beforeAll(() => {
        // Set up test environment
        process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters-long'
    })

    describe('EncryptionService', () => {
        it('should encrypt and decrypt data correctly', () => {
            const originalData = 'sensitive patient information'

            const encrypted = EncryptionService.encrypt(originalData)
            expect(encrypted).toBeDefined()
            expect(encrypted).not.toBe(originalData)

            const decrypted = EncryptionService.decrypt(encrypted)
            expect(decrypted).toBe(originalData)
        })

        it('should encrypt and decrypt CPF correctly', () => {
            const cpf = '123.456.789-01'

            const encrypted = EncryptionService.encryptCPF(cpf)
            expect(encrypted).toBeDefined()
            expect(encrypted).not.toBe(cpf)

            const decrypted = EncryptionService.decryptCPF(encrypted)
            expect(decrypted).toBe(cpf)
        })

        it('should hash and verify passwords correctly', () => {
            const password = 'secure-password-123'

            const hashed = EncryptionService.hash(password)
            expect(hashed).toBeDefined()
            expect(hashed).not.toBe(password)
            expect(hashed).toContain(':')

            const isValid = EncryptionService.verifyHash(password, hashed)
            expect(isValid).toBe(true)

            const isInvalid = EncryptionService.verifyHash('wrong-password', hashed)
            expect(isInvalid).toBe(false)
        })

        it('should generate secure tokens', () => {
            const token1 = EncryptionService.generateToken()
            const token2 = EncryptionService.generateToken()

            expect(token1).toBeDefined()
            expect(token2).toBeDefined()
            expect(token1).not.toBe(token2)
            expect(token1.length).toBe(64) // 32 bytes = 64 hex chars
        })
    })
})