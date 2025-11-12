// =========================================
// USER SERVICE
// Service functions for user management using admin API
// =========================================

import { supabaseAdmin } from '@/supabase';

interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  role: 'intern' | 'mentor' | 'admin' | 'superuser';
  affiliation?: string;
  divisi?: number | null;
}

interface CreateUserResult {
  success: boolean;
  message: string;
  userId?: string;
  error?: string;
}

/**
 * Create a new user with service role admin API
 * @param userData - User creation data
 * @returns Result object with success status and message
 */
export async function createUserWithAdmin(userData: CreateUserData): Promise<CreateUserResult> {
  try {
    // Step 1: Create auth user using admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: userData.full_name,
        role: userData.role,
      },
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return {
        success: false,
        message: 'Failed to create user account',
        error: authError.message,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        message: 'User creation failed - no user data returned',
        error: 'No user data',
      };
    }

    // Step 2: Update profile table with additional data
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: userData.full_name,
        role: userData.role,
        affiliation: userData.affiliation || null,
        divisi: userData.divisi || null,
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      
      // Try to rollback - delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      return {
        success: false,
        message: 'Failed to update user profile',
        error: profileError.message,
      };
    }

    return {
      success: true,
      message: `User ${userData.email} created successfully`,
      userId: authData.user.id,
    };
  } catch (error) {
    console.error('Unexpected error in createUserWithAdmin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      success: false,
      message: 'Failed to create user',
      error: errorMessage,
    };
  }
}

/**
 * Delete a user using admin API
 * @param userId - User ID to delete
 * @returns Result object with success status
 */
export async function deleteUserWithAdmin(userId: string): Promise<CreateUserResult> {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      return {
        success: false,
        message: 'Failed to delete user',
        error: error.message,
      };
    }

    return {
      success: true,
      message: 'User deleted successfully',
      userId,
    };
  } catch (error) {
    console.error('Unexpected error in deleteUserWithAdmin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      success: false,
      message: 'Failed to delete user',
      error: errorMessage,
    };
  }
}

/**
 * Update user password using admin API
 * @param userId - User ID
 * @param newPassword - New password
 * @returns Result object with success status
 */
export async function updateUserPassword(userId: string, newPassword: string): Promise<CreateUserResult> {
  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      return {
        success: false,
        message: 'Failed to update password',
        error: error.message,
      };
    }

    return {
      success: true,
      message: 'Password updated successfully',
      userId,
    };
  } catch (error) {
    console.error('Unexpected error in updateUserPassword:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      success: false,
      message: 'Failed to update password',
      error: errorMessage,
    };
  }
}
