const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface Doctor {
  id: string
  name: string
  email: string
  role: string
}

class UserService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = localStorage.getItem('token')
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  async getDoctors(): Promise<Doctor[]> {
    return this.request<Doctor[]>('/api/users/doctors')
  }

  async getUsers(role?: string): Promise<Doctor[]> {
    const params = new URLSearchParams()
    if (role) params.append('role', role)
    
    const queryString = params.toString()
    const endpoint = `/api/users${queryString ? `?${queryString}` : ''}`
    
    return this.request<Doctor[]>(endpoint)
  }
}

export const userService = new UserService()