import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Mail, ArrowRight } from 'lucide-react'
import { useAgencyStore } from '@/hooks/useAgencyStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function LoginPage() {
  const navigate = useNavigate()
  const { store } = useAgencyStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const user = store.loginUser(email)
    if (user) {
      navigate('/dashboard')
    } else {
      setError('Invalid credentials. Please check your email and password.')
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#E5E7EB] shadow-xl p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-xl mx-auto shadow-sm">
            S
          </div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">Simple Agency Tool</h1>
          <p className="text-xs text-[#6B7280]">
            Sign in to access your operational workspace
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <p className="text-xs text-rose-600 font-medium text-center">{error}</p>}
          <Input
            label="Email Address"
            type="email"
            placeholder="you@eyb.digital"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-gray-400" />}
            required
          />
          <Button type="submit" className="w-full">
            Sign In to Workspace <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
