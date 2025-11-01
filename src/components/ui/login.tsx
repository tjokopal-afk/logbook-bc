import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/AuthContext"
import { useState } from 'react'
import { useNavigate } from 'react-router'


export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    
  const { signInWithGoogle, signInWithUsername } = useAuth();
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const username = (e.currentTarget as HTMLFormElement).querySelector('#email') as HTMLInputElement
            const password = (e.currentTarget as HTMLFormElement).querySelector('#password') as HTMLInputElement
            if (!username?.value || !password?.value) return setError('Username and password are required')
            setLoading(true)
            try {
              await signInWithUsername(username.value, password.value)
              navigate('/dashboard', { replace: true })
            } catch (err: unknown) {
              const message = err && typeof err === 'object' && 'message' in err ? (err as { message?: string }).message ?? String(err) : String(err)
              setError(message || 'Login failed')
            } finally {
              setLoading(false)
            }
          }}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-4xl font-bold">Selamat Datang</h1>
                <p className="text-muted-foreground text-balance text-xs">
                  Masuk username dan password Anda 
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Username</FieldLabel>
                <Input
                  id="email"
                  type="text"
                  placeholder="Username"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input id="password" type="password" required />
              </Field>
              <Field>
                <Button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</Button>
              </Field>
              {error && <p className='text-sm text-destructive'>{error}</p>}
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>
              <Field className="">
                <Button 
                  variant="outline" 
                  type="button" 
                  disabled={googleLoading || loading}
                  onClick={async () => {
                    setError(null);
                    setGoogleLoading(true);
                    try {
                      await signInWithGoogle();
                      // OAuth will redirect automatically
                    } catch (err: unknown) {
                      const message = err && typeof err === 'object' && 'message' in err ? (err as { message?: string }).message ?? String(err) : String(err)
                      setError(message || 'Google sign-in failed');
                      setGoogleLoading(false);
                    }
                  }}
                >
                  <svg className="h-5 w-5" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path fill="#4285F4" d="M533.5 278.4c0-18.4-1.5-36.1-4.3-53.3H272v100.8h147.3c-6.4 34.6-25 63.9-53.3 83.6v69.4h86.1c50.4-46.5 81.4-115 81.4-200.5z"/>
                    <path fill="#34A853" d="M272 544.3c72.6 0 133.6-24.1 178.2-65.5l-86.1-69.4c-24 16.2-54.8 25.8-92.1 25.8-70.8 0-130.7-47.8-152.2-112.1H31.9v70.6C76.4 491.5 168.4 544.3 272 544.3z"/>
                    <path fill="#FBBC05" d="M119.8 321.1c-10.6-31.9-10.6-66.3 0-98.2V152.3H31.9c-38.9 76.7-38.9 167.6 0 244.3l87.9-75.5z"/>
                    <path fill="#EA4335" d="M272 109.7c39.4-.6 78.3 14.2 107.6 40.9l80.7-80.7C405.6 21 349.4-.6 272 0 168.4 0 76.4 52.8 31.9 130.1l87.9 70.7C141.3 157.4 201.2 109.7 272 109.7z"/>
                  </svg>
                  {googleLoading ? 'Connecting to Google...' : 'Login with Google'}
                  <span className="sr-only">Login with Google</span>
                </Button>
              </Field>
            </FieldGroup>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="/logo.png"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}