import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Briefcase } from 'lucide-react'
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
      setError('Invalid credentials. Please check your email address.')
    }
  }

  const handleQuickLogin = (userEmail: string) => {
    setEmail(userEmail)
    setPassword('password')
    const user = store.loginUser(userEmail)
    if (user) {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#E5E7EB] shadow-xl p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-xl mx-auto shadow-sm">
            E
          </div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">EMAC Agency Workspace</h1>
          <p className="text-xs text-[#6B7280]">
            Sign in to access your operational agency platform
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <p className="text-xs text-rose-600 font-medium text-center">{error}</p>}
          <Input
            label="Email Address"
            type="email"
            placeholder="muhassin@emac.one"
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

        {/* Quick Demo Sign-in Accounts */}
        <div className="pt-4 border-t border-[#E5E7EB] space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] text-center">
            Quick 1-Click Team Access
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickLogin('muhassin@emac.one')}
              className="w-full text-left px-3 py-2 rounded-lg border border-[#E5E7EB] hover:border-indigo-300 hover:bg-indigo-50/50 flex items-center justify-between text-xs transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-semibold text-gray-900">Muhassin Rahim</span>
              </div>
              <span className="text-[10px] font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                Owner
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('anees@emac.one')}
              className="w-full text-left px-3 py-2 rounded-lg border border-[#E5E7EB] hover:border-blue-300 hover:bg-blue-50/50 flex items-center justify-between text-xs transition-colors"
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold text-gray-900">Anees Rahman</span>
              </div>
              <span className="text-[10px] font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                Admin
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('jithin@emac.one')}
              className="w-full text-left px-3 py-2 rounded-lg border border-[#E5E7EB] hover:border-emerald-300 hover:bg-emerald-50/50 flex items-center justify-between text-xs transition-colors"
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-semibold text-gray-900">Jithin</span>
              </div>
              <span className="text-[10px] font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                Employee
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('hashim@emac.one')}
              className="w-full text-left px-3 py-2 rounded-lg border border-[#E5E7EB] hover:border-purple-300 hover:bg-purple-50/50 flex items-center justify-between text-xs transition-colors"
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                <span className="font-semibold text-gray-900">Hashim</span>
              </div>
              <span className="text-[10px] font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                Employee
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('freelancer@emac.one')}
              className="w-full text-left px-3 py-2 rounded-lg border border-[#E5E7EB] hover:border-amber-300 hover:bg-amber-50/50 flex items-center justify-between text-xs transition-colors"
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-semibold text-gray-900">David</span>
              </div>
              <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                Freelancer
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
