import React from 'react'
import { Laptop, Database, Activity, Shield } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DiagnosticChecks } from '../types/settings.types'

interface DiagnosticsPanelProps {
  devicePlatform: string
  activeInstallTab: 'ios' | 'android'
  setActiveInstallTab: (val: 'ios' | 'android') => void
  permission: string
  swStatus: string
  token: string | null
  dbTokenStatus: string
  currentUserId: string | null
  registeredDeviceCount: number | null
  lastRegistrationTime: string | null
  diagnosticsRun: boolean
  diagnosticChecks: DiagnosticChecks
  runningDiagnostics: boolean
  sendingTest: boolean
  repairing: boolean
  handleRunDiagnostics: () => void
  handleSendTestNotification: () => void
  handleRepairNotifications: () => void
  pushError: string | null
}

export default function DiagnosticsPanel({
  devicePlatform,
  activeInstallTab,
  setActiveInstallTab,
  permission,
  swStatus,
  token,
  dbTokenStatus,
  currentUserId,
  registeredDeviceCount,
  lastRegistrationTime,
  diagnosticsRun,
  diagnosticChecks,
  runningDiagnostics,
  sendingTest,
  repairing,
  handleRunDiagnostics,
  handleSendTestNotification,
  handleRepairNotifications,
  pushError
}: DiagnosticsPanelProps) {
  return (
    <div className="space-y-4">
      {devicePlatform !== 'PWA' && devicePlatform !== 'Android' && (
        <Card className="p-5 space-y-4 border border-violet-500/20 bg-gradient-to-br from-violet-950/10 to-transparent relative overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-24 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Laptop className="h-4 w-4 text-violet-400 animate-pulse" />
            Install Mobile App
          </h3>
          <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">
            To receive push notifications while the site is closed, please add this app to your mobile Home Screen:
          </p>

          {/* Tab Selector */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setActiveInstallTab('ios')}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                activeInstallTab === 'ios'
                  ? 'bg-violet-500/20 text-white border border-violet-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              iOS (Safari)
            </button>
            <button
              type="button"
              onClick={() => setActiveInstallTab('android')}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                activeInstallTab === 'android'
                  ? 'bg-violet-500/20 text-white border border-violet-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Android (Chrome)
            </button>
          </div>
          
          <div className="space-y-3 pt-1 text-xs">
            {activeInstallTab === 'ios' ? (
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 bg-white/2 p-3 rounded-xl border border-white/5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-[10px] font-black text-violet-400">1</span>
                  <span className="text-gray-300 font-semibold text-[10px]">
                    Tap the <span className="font-bold text-white">Share</span> button in Safari (at the bottom or top of the screen).
                  </span>
                </div>
                <div className="flex items-start gap-2.5 bg-white/2 p-3 rounded-xl border border-white/5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-[10px] font-black text-violet-400">2</span>
                  <span className="text-gray-300 font-semibold text-[10px]">
                    Scroll down and select <span className="font-bold text-white">Add to Home Screen</span>.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 bg-white/2 p-3 rounded-xl border border-white/5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-[10px] font-black text-violet-400">3</span>
                  <span className="text-gray-300 font-semibold text-[10px]">
                    Open the installed app from your Home Screen to enable push notifications!
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 bg-white/2 p-3 rounded-xl border border-white/5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-[10px] font-black text-violet-400">1</span>
                  <span className="text-gray-300 font-semibold text-[10px]">
                    Tap the browser menu <span className="font-bold text-white">(three dots)</span> in the top-right corner.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 bg-white/2 p-3 rounded-xl border border-white/5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-[10px] font-black text-violet-400">2</span>
                  <span className="text-gray-300 font-semibold text-[10px]">
                    Select <span className="font-bold text-white">Add to Home Screen</span> or <span className="font-bold text-white">Install App</span>.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 bg-white/2 p-3 rounded-xl border border-white/5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-[10px] font-black text-violet-400">3</span>
                  <span className="text-gray-300 font-semibold text-[10px]">
                    Launch the app from your Home Screen to register your device.
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card className="p-5 space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Database className="h-4 w-4 text-cyan-400" />
          Network Node Info
        </h3>
        
        <div className="space-y-3.5 text-xs">
          <div>
            <span className="text-gray-500 font-semibold uppercase tracking-wider text-[9px] block">Database Endpoint</span>
            <span className="text-gray-300 font-bold font-mono text-[10px] break-all block mt-1">
              {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not Configured'}
            </span>
          </div>
          <div className="border-t border-white/5 pt-3">
            <span className="text-gray-500 font-semibold uppercase tracking-wider text-[9px] block">Auth Provider</span>
            <span className="text-gray-300 font-bold block mt-1">Supabase SSR Cookies API</span>
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400" />
          Notification Diagnostics
        </h3>
        
        <div className="space-y-3.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">App Environment</span>
            <span className={`font-bold px-2 py-0.5 rounded-full border text-[10px] lowercase text-violet-400 bg-violet-500/10 border-violet-500/20`}>
              {devicePlatform}
            </span>
          </div>

          <div className="border-t border-white/5 pt-3.5 flex justify-between items-center">
            <span className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">Notification Permission</span>
            <span className={`font-bold px-2 py-0.5 rounded-full border text-[10px] lowercase ${
              permission === 'granted'
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : permission === 'denied'
                ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
            }`}>
              {permission}
            </span>
          </div>

          <div className="border-t border-white/5 pt-3.5 flex justify-between items-center">
            <span className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">Service Worker Status</span>
            <span className={`font-bold px-2 py-0.5 rounded-full border text-[10px] lowercase ${
              swStatus === 'Connected'
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : swStatus === 'Checking...'
                ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
            }`}>
              {swStatus === 'Connected' ? 'active' : swStatus === 'Checking...' ? 'checking' : 'inactive'}
            </span>
          </div>

          <div className="border-t border-white/5 pt-3.5 flex justify-between items-center">
            <span className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">FCM Token Status</span>
            <span className={`font-bold px-2 py-0.5 rounded-full border text-[10px] lowercase ${
              token
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
            }`}>
              {token ? 'available' : 'missing'}
            </span>
          </div>

          <div className="border-t border-white/5 pt-3.5 flex justify-between items-center">
            <span className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">Device Registration</span>
            <span className={`font-bold px-2 py-0.5 rounded-full border text-[10px] lowercase ${
              dbTokenStatus === 'Registered'
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
            }`}>
              {dbTokenStatus === 'Registered' ? 'registered' : 'not registered'}
            </span>
          </div>

          <div className="border-t border-white/5 pt-3.5">
            <span className="text-gray-500 font-semibold uppercase tracking-wider text-[9px] block">Current User ID</span>
            <span className="text-gray-300 font-bold block mt-1 font-mono text-[10px] select-all break-all">
              {currentUserId || 'loading...'}
            </span>
          </div>

          <div className="border-t border-white/5 pt-3.5 flex justify-between items-center">
            <span className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">Registered Device Count</span>
            <span className="text-gray-300 font-bold">
              {registeredDeviceCount !== null ? registeredDeviceCount : 'checking...'}
            </span>
          </div>

          <div className="border-t border-white/5 pt-3.5">
            <span className="text-gray-500 font-semibold uppercase tracking-wider text-[9px] block">Last Registration Timestamp</span>
            <span className="text-gray-300 font-bold block mt-1 font-mono text-[10px]">
              {lastRegistrationTime || 'N/A'}
            </span>
          </div>

          {/* Check results */}
          {diagnosticsRun && (
            <div className="border-t border-white/5 pt-3.5 space-y-2.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Diagnostics Report</span>
              
              {[
                { label: 'Browser Permission', result: diagnosticChecks.permission },
                { label: 'Service Worker', result: diagnosticChecks.sw },
                { label: 'Firebase Config', result: diagnosticChecks.firebase },
                { label: 'FCM Token Availability', result: diagnosticChecks.token },
                { label: 'DB Device Registration', result: diagnosticChecks.dbRegistration },
                { label: 'Notification Preferences', result: diagnosticChecks.preferences }
              ].map((chk, i) => {
                if (!chk.result) return null;
                const isPass = chk.result.status === 'pass';
                const isWarn = chk.result.status === 'warn';
                const color = isPass 
                  ? 'text-emerald-400' 
                  : isWarn 
                  ? 'text-amber-400' 
                  : 'text-rose-400';
                const icon = isPass ? '✓' : isWarn ? '⚠' : '✗';
                
                return (
                  <div key={i} className="flex items-start gap-2 text-[10px] font-semibold leading-tight">
                    <span className={`font-black select-none ${color}`}>{icon}</span>
                    <div className="min-w-0 flex-1">
                      <span className="text-gray-300 font-bold block">{chk.label}</span>
                      <span className="text-gray-500 text-[9px] leading-relaxed block">{chk.result.message}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {permission === 'denied' && (
            <div className="mt-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] leading-relaxed font-semibold">
              <span className="font-bold block uppercase tracking-wider text-[8px] mb-1">site permissions blocked</span>
              To re-enable, click the settings/lock icon in your browser's address bar next to the URL, change "Notification" to "Allow", and try again.
            </div>
          )}

          {pushError && (
            <div className="mt-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] leading-relaxed font-semibold">
              <span className="font-bold block uppercase tracking-wider text-[8px] mb-1">registration error</span>
              {pushError}
            </div>
          )}

          <div className="pt-2 flex flex-col gap-2">
            <Button 
              type="button" 
              onClick={handleRunDiagnostics} 
              disabled={runningDiagnostics}
              className="w-full bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 py-2 rounded-xl text-xs font-bold transition-all"
            >
              {runningDiagnostics ? 'Running Checks...' : 'Run Diagnostics'}
            </Button>

            <Button 
              type="button" 
              onClick={handleSendTestNotification} 
              disabled={sendingTest || permission !== 'granted' || dbTokenStatus !== 'Registered'}
              className="w-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 py-2 rounded-xl text-xs font-bold transition-all"
            >
              {sendingTest ? 'Sending Test...' : 'Send Test Notification'}
            </Button>

            <Button 
              type="button" 
              onClick={handleRepairNotifications} 
              disabled={repairing}
              className="w-full bg-violet-500/10 text-violet-500 hover:bg-violet-500/20 border border-violet-500/20 py-2 rounded-xl text-xs font-bold transition-all"
            >
              {repairing ? 'Repairing Connection...' : 'Repair Push Notifications'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Shield className="h-4 w-4 text-violet-400" />
          Encrypted Tunnel
        </h3>
        <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
          Your network connection is managed with zero exposure of service roles or tokens, ensuring 100% Client-to-Edge validation boundaries.
        </p>
      </Card>
    </div>
  )
}
