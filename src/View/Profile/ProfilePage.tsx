import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import * as api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useNavigate } from 'react-router'

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<api.Profile | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    api.getProfileByUserId(user.id).then(setProfile).catch(() => null)
  }, [user])

  if (!user) return <div>Please sign in</div>

  return (
    <div className='container mx-auto p-6'>
      <div className='flex items-center gap-4'>
        <Avatar className='h-24 w-24'>
          <AvatarImage src={profile?.avatar_url || user.user_metadata?.avatar_url} />
          <AvatarFallback>{(profile?.full_name || user.email || 'U').split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className='text-2xl font-bold'>{profile?.full_name || user.user_metadata?.full_name || user.email}</h2>
          <p className='text-sm text-muted-foreground'>{profile?.username}</p>
          <p className='text-sm'>{profile?.affiliation}</p>
        </div>
      </div>
      <div className='mt-6'>
        <Button onClick={() => navigate('/profile/edit')}>Edit Profile</Button>
      </div>
    </div>
  )
}
