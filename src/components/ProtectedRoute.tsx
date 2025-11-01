import React from 'react'
import { Navigate } from 'react-router'
import { useAuth } from '@/context/AuthContext'
import { type Role, hasRoleLevel, getDefaultPath } from '@/utils/roleConfig'

interface ProtectedRouteProps {
  children: React.ReactElement
  allowedRoles?: Role[]
  requireRole?: Role
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles, 
  requireRole 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()

  // Show nothing while loading
  if (loading) {
    return null
  }

  // Redirect to login if not authenticated
  if (!user || !profile) {
    return <Navigate to='/' replace />
  }

  const userRole = profile.role

  // Check if user has required role level
  if (requireRole && !hasRoleLevel(userRole, requireRole)) {
    // Redirect to user's default dashboard
    return <Navigate to={getDefaultPath(userRole)} replace />
  }

  // Check if user's role is in allowed roles
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to user's default dashboard
    return <Navigate to={getDefaultPath(userRole)} replace />
  }

  return children
}
