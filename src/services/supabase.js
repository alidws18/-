import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database helper functions
export const db = {
  // Get current user profile
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        role:roles(*),
        center:centers(*)
      `)
      .eq('id', user.id)
      .single()

    if (error) throw error
    return data
  },

  // Get user role
  async getUserRole() {
    const user = await this.getCurrentUser()
    return user?.role?.name || null
  },

  // Check if user is admin
  async isAdmin() {
    const role = await this.getUserRole()
    return role === 'admin'
  },

  // Check if user is manager
  async isManager() {
    const role = await this.getUserRole()
    return role === 'manager'
  }
}
