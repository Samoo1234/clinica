import { PatientService } from '../services/patients'

describe('Patient Service Unit Tests', () => {
  describe('CPF Validation', () => {
    it('should validate correct CPF', () => {
      expect(PatientService.validateCPF('11144477735')).toBe(true)
    })

    it('should reject invalid CPF', () => {
      expect(PatientService.validateCPF('12345678901')).toBe(false)
    })

    it('should reject CPF with all same digits', () => {
      expect(PatientService.validateCPF('11111111111')).toBe(false)
    })

    it('should reject CPF with wrong length', () => {
      expect(PatientService.validateCPF('123456789')).toBe(false)
    })
  })

  describe('Data Validation', () => {
    it('should validate complete patient data', () => {
      const validData = {
        cpf: '11144477735',
        name: 'João Silva',
        birth_date: '1990-01-01',
        phone: '11999999999',
        email: 'joao@example.com',
        address: {
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234567'
        }
      }

      const errors = PatientService.validatePatientData(validData)
      expect(errors).toEqual([])
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email'
      }

      const errors = PatientService.validatePatientData(invalidData)
      expect(errors).toContain('Email inválido')
    })

    it('should reject invalid phone', () => {
      const invalidData = {
        phone: '123'
      }

      const errors = PatientService.validatePatientData(invalidData)
      expect(errors).toContain('Telefone deve ter 10 ou 11 dígitos')
    })

    it('should reject future birth date', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      
      const invalidData = {
        birth_date: futureDate.toISOString().split('T')[0]
      }

      const errors = PatientService.validatePatientData(invalidData)
      expect(errors).toContain('Data de nascimento não pode ser futura')
    })

    it('should reject incomplete address', () => {
      const invalidData = {
        address: {
          street: 'Rua',
          number: '',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234567'
        }
      }

      const errors = PatientService.validatePatientData(invalidData)
      expect(errors).toContain('Número do endereço é obrigatório')
    })

    it('should reject invalid state format', () => {
      const invalidData = {
        address: {
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SAO',
          zipCode: '01234567'
        }
      }

      const errors = PatientService.validatePatientData(invalidData)
      expect(errors).toContain('Estado deve ter 2 caracteres (UF)')
    })

    it('should reject invalid ZIP code', () => {
      const invalidData = {
        address: {
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '123'
        }
      }

      const errors = PatientService.validatePatientData(invalidData)
      expect(errors).toContain('CEP deve ter 8 dígitos')
    })
  })
})