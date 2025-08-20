import crypto from 'crypto'

/**
 * Encryption service for sensitive data
 * Uses simple AES-256-CTR for encryption
 */
export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-ctr'

  private static getEncryptionKey(): string {
    const key = process.env.ENCRYPTION_KEY
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required')
    }
    
    // Hash the key to get consistent 32 bytes
    return crypto.createHash('sha256').update(key).digest('hex').substring(0, 32)
  }

  /**
   * Encrypt sensitive data
   */
  static encrypt(plaintext: string): string {
    try {
      const key = this.getEncryptionKey()
      const cipher = crypto.createCipher(this.ALGORITHM, key)
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      return encrypted
    } catch (error) {
      console.error('Encryption error:', error)
      throw new Error('Failed to encrypt data')
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedData: string): string {
    try {
      const key = this.getEncryptionKey()
      const decipher = crypto.createDecipher(this.ALGORITHM, key)
      
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      console.error('Decryption error:', error)
      throw new Error('Failed to decrypt data')
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  static hash(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512')
    return `${actualSalt}:${hash.toString('hex')}`
  }

  /**
   * Verify hashed data
   */
  static verifyHash(data: string, hashedData: string): boolean {
    try {
      const [salt, hash] = hashedData.split(':')
      const verifyHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512')
      return hash === verifyHash.toString('hex')
    } catch (error) {
      return false
    }
  }

  /**
   * Generate secure random token
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * Encrypt CPF (specific for Brazilian documents)
   */
  static encryptCPF(cpf: string): string {
    // Remove formatting and encrypt
    const cleanCPF = cpf.replace(/\D/g, '')
    return this.encrypt(cleanCPF)
  }

  /**
   * Decrypt CPF
   */
  static decryptCPF(encryptedCPF: string): string {
    const decrypted = this.decrypt(encryptedCPF)
    // Format CPF: 000.000.000-00
    return decrypted.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  /**
   * Encrypt phone number
   */
  static encryptPhone(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '')
    return this.encrypt(cleanPhone)
  }

  /**
   * Decrypt phone number
   */
  static decryptPhone(encryptedPhone: string): string {
    const decrypted = this.decrypt(encryptedPhone)
    // Format phone: (00) 00000-0000
    if (decrypted.length === 11) {
      return decrypted.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    } else if (decrypted.length === 10) {
      return decrypted.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return decrypted
  }
}