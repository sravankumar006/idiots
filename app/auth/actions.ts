'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface AuthResponse {
  error?: string
  success?: boolean
}

/**
 * Log in a user with email and password
 */
export async function login(formData: { email: string; password: string }): Promise<AuthResponse | undefined> {
  const supabase = await createClient()
  let isSuccessful = false

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    })

    if (error) {
      return { error: error.message }
    }
    isSuccessful = true
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred during login.' }
  }

  if (isSuccessful) {
    redirect('/dashboard')
  }
}

/**
 * Sign up a new user with email, password, username, and avatar
 */
export async function signup(formData: {
  email: string
  password: string
  username: string
  avatar: string
}): Promise<AuthResponse | undefined> {
  const supabase = await createClient()
  let isSuccessful = false

  try {
    // 1. Sign up the user with metadata (metadata is stored inside auth.users.user_metadata)
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          username: formData.username,
          avatar: formData.avatar,
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    // 2. Sync select details (username, avatar) to public.profiles table
    if (data?.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          avatar: formData.avatar,
        })
        .eq('id', data.user.id)

      if (profileError) {
        console.warn("Could not sync public user profile details immediately:", profileError)
      }
    }
    
    isSuccessful = true
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred during signup.' }
  }

  if (isSuccessful) {
    redirect('/dashboard')
  }
}

/**
 * Log out the currently authenticated user
 */
export async function logout(): Promise<AuthResponse | undefined> {
  const supabase = await createClient()
  let isSuccessful = false

  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      return { error: error.message }
    }
    isSuccessful = true
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred during logout.' }
  }

  if (isSuccessful) {
    redirect('/login')
  }
}
