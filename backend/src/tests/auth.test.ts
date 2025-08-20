import { AuthService } from '../services/auth'

// Test script for authentication system
async function testAuthSystem() {
  console.log('🧪 Testing VisionCare Authentication System\n')

  try {
    // Test 1: Create a test user
    console.log('1. Creating test user...')
    const registerResult = await AuthService.signUp({
      email: 'test@visioncare.com',
      password: 'test123456',
      name: 'Usuário Teste',
      role: 'receptionist'
    })

    if (registerResult.error) {
      console.log('❌ User creation failed:', registerResult.error)
    } else {
      console.log('✅ User created successfully:', registerResult.user?.name)
    }

    // Test 2: Sign in with the test user
    console.log('\n2. Testing sign in...')
    const signInResult = await AuthService.signIn({
      email: 'test@visioncare.com',
      password: 'test123456'
    })

    if (signInResult.error) {
      console.log('❌ Sign in failed:', signInResult.error)
    } else {
      console.log('✅ Sign in successful:', signInResult.user?.name)
      console.log('   Role:', signInResult.user?.role)
      console.log('   Session exists:', !!signInResult.session)
    }

    // Test 3: Get all users (should work for admin)
    console.log('\n3. Testing get all users...')
    const usersResult = await AuthService.getAllUsers()
    
    if (usersResult.error) {
      console.log('❌ Get users failed:', usersResult.error)
    } else {
      console.log('✅ Users retrieved:', usersResult.users.length, 'users found')
      usersResult.users.forEach(user => {
        console.log(`   - ${user.name} (${user.role}) - ${user.active ? 'Active' : 'Inactive'}`)
      })
    }

    // Test 4: Test role update
    if (registerResult.user) {
      console.log('\n4. Testing role update...')
      const roleUpdateResult = await AuthService.updateUserRole(registerResult.user.id, 'doctor')
      
      if (roleUpdateResult.error) {
        console.log('❌ Role update failed:', roleUpdateResult.error)
      } else {
        console.log('✅ Role updated successfully')
      }
    }

    console.log('\n🎉 Authentication system tests completed!')

  } catch (error: any) {
    console.error('❌ Test failed with error:', error.message)
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAuthSystem()
}

// Jest tests
describe('Auth Service', () => {
  it('should have auth service available', () => {
    expect(AuthService).toBeDefined()
  })
  
  // TODO: Add more auth tests
})

export { testAuthSystem }