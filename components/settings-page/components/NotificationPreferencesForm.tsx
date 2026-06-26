import React from 'react'
import { Bell } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface NotificationPreferencesFormProps {
  notifications: boolean
  setNotifications: (val: boolean) => void
  audioHandshake: boolean
  setAudioHandshake: (val: boolean) => void
  prefChat: boolean
  setPrefChat: (val: boolean) => void
  prefFocus: boolean
  setPrefFocus: (val: boolean) => void
  prefAi: boolean
  setPrefAi: (val: boolean) => void
  prefMemory: boolean
  setPrefMemory: (val: boolean) => void
  prefAchievement: boolean
  setPrefAchievement: (val: boolean) => void
}

export default function NotificationPreferencesForm({
  notifications,
  setNotifications,
  audioHandshake,
  setAudioHandshake,
  prefChat,
  setPrefChat,
  prefFocus,
  setPrefFocus,
  prefAi,
  setPrefAi,
  prefMemory,
  setPrefMemory,
  prefAchievement,
  setPrefAchievement
}: NotificationPreferencesFormProps) {
  return (
    <Card className="space-y-4">
      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <Bell className="h-4 w-4 text-rose-400" />
        Alert & Push Notification Rules
      </h3>
      
      <div className="space-y-4 pt-2">
        <label className="flex items-center justify-between cursor-pointer select-none">
          <div className="space-y-0.5 pr-4">
            <span className="text-xs font-bold text-white block">Connection Notifications</span>
            <span className="text-[10px] text-gray-500 font-semibold leading-normal">
              Receive alert alerts when peers connect or disconnect from active workspaces.
            </span>
          </div>
          <input
            type="checkbox"
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
            className="rounded bg-white/5 border-white/10 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 h-4 w-4 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer select-none border-t border-white/5 pt-4">
          <div className="space-y-0.5 pr-4">
            <span className="text-xs font-bold text-white block">Audio Handshakes</span>
            <span className="text-[10px] text-gray-500 font-semibold leading-normal">
              Play a futuristic sonic hum upon successful WebSocket session establishment.
            </span>
          </div>
          <input
            type="checkbox"
            checked={audioHandshake}
            onChange={(e) => setAudioHandshake(e.target.checked)}
            className="rounded bg-white/5 border-white/10 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 h-4 w-4 cursor-pointer"
          />
        </label>

        {/* FCM Toggles */}
        <div className="border-t border-white/5 pt-4 space-y-4">
          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Push Subscriptions (Firebase Cloud Messaging)
          </span>

          <label className="flex items-center justify-between cursor-pointer select-none">
            <div className="space-y-0.5 pr-4">
              <span className="text-xs font-bold text-white block">Chat Notifications</span>
              <span className="text-[10px] text-gray-500 font-semibold leading-normal">
                Get pushed for replies, reactions, quotes, and direct mentions.
              </span>
            </div>
            <input
              type="checkbox"
              checked={prefChat}
              onChange={(e) => setPrefChat(e.target.checked)}
              className="rounded bg-white/5 border-white/10 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 h-4 w-4 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer select-none border-t border-white/5 pt-4">
            <div className="space-y-0.5 pr-4">
              <span className="text-xs font-bold text-white block">Focus Room Activity</span>
              <span className="text-[10px] text-gray-500 font-semibold leading-normal">
                Get alerts when study sessions start, finish, or when you receive invitations.
              </span>
            </div>
            <input
              type="checkbox"
              checked={prefFocus}
              onChange={(e) => setPrefFocus(e.target.checked)}
              className="rounded bg-white/5 border-white/10 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 h-4 w-4 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer select-none border-t border-white/5 pt-4">
            <div className="space-y-0.5 pr-4">
              <span className="text-xs font-bold text-white block">AI Companion Updates</span>
              <span className="text-[10px] text-gray-500 font-semibold leading-normal">
                Receive notices when Rocky completes a response, summary, or generated note.
              </span>
            </div>
            <input
              type="checkbox"
              checked={prefAi}
              onChange={(e) => setPrefAi(e.target.checked)}
              className="rounded bg-white/5 border-white/10 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 h-4 w-4 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer select-none border-t border-white/5 pt-4">
            <div className="space-y-0.5 pr-4">
              <span className="text-xs font-bold text-white block">Timeline & Scrapbook Memory Alerts</span>
              <span className="text-[10px] text-gray-500 font-semibold leading-normal">
                Get notified when peers comment, react, or quote your shared vault entries.
              </span>
            </div>
            <input
              type="checkbox"
              checked={prefMemory}
              onChange={(e) => setPrefMemory(e.target.checked)}
              className="rounded bg-white/5 border-white/10 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 h-4 w-4 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer select-none border-t border-white/5 pt-4">
            <div className="space-y-0.5 pr-4">
              <span className="text-xs font-bold text-white block">Milestones & Achievements</span>
              <span className="text-[10px] text-gray-500 font-semibold leading-normal">
                Get alert milestones for streaks, focus records, or roadmap completions.
              </span>
            </div>
            <input
              type="checkbox"
              checked={prefAchievement}
              onChange={(e) => setPrefAchievement(e.target.checked)}
              className="rounded bg-white/5 border-white/10 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 h-4 w-4 cursor-pointer"
            />
          </label>
        </div>
      </div>
    </Card>
  )
}
