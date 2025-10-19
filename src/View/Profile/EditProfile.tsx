import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import * as api from '@/lib/api_clean'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { useNavigate } from 'react-router'

export default function EditProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Partial<api.Profile> | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    api.getProfileByUserId(user.id).then(setProfile).catch(() => null)
  }, [user])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (!profile) throw new Error('No profile to update')
      // ensure we send a Partial<Profile>
      await api.updateProfile(user!.id, profile as Partial<api.Profile>)
      navigate('/profile')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <div>Please sign in</div>

  return (
    <div className='container mx-auto p-6'>
      <h1 className='text-2xl font-bold mb-4'>Edit Profile</h1>
      <form onSubmit={onSubmit} className='grid gap-4 max-w-lg'>
        <Field>
          <FieldLabel>Username</FieldLabel>
          <Input value={profile?.username || ''} onChange={(e) => setProfile({ ...profile, username: e.target.value })} required />
        </Field>
        <Field>
          <FieldLabel>Full name</FieldLabel>
          <Input value={profile?.full_name || ''} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
        </Field>
        <Field>
          <FieldLabel>Affiliation</FieldLabel>
          <Input value={profile?.affiliation || ''} onChange={(e) => setProfile({ ...profile, affiliation: e.target.value })} />
        </Field>
        <Field>
          <FieldLabel>Avatar URL</FieldLabel>
          <Input value={profile?.avatar_url || ''} onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })} />
        </Field>
        <div className='flex gap-2'>
          <Button type='submit' disabled={loading}>Save</Button>
          <Button variant='ghost' type='button' onClick={() => navigate('/profile')}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
