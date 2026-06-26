import React from 'react'
import { Sparkles, Maximize, Minimize, CornerDownLeft } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card } from '@/components/ui/Card'
import { ChatMessage, UserProfile } from '@/types'

interface RockyChatWindowProps {
  personalMessages: ChatMessage[]
  isTyping: boolean
  isChatFullscreen: boolean
  setIsChatFullscreen: (val: boolean) => void
  personalPrompt: string
  setPersonalPrompt: (val: string) => void
  handleSendPersonal: (e: React.FormEvent) => Promise<void>
  currentUser: UserProfile | null
  chatEndRef: React.RefObject<HTMLDivElement | null>
  avatarMap: Record<string, { gradient: string; symbol: string }>
}

export default function RockyChatWindow({
  personalMessages,
  isTyping,
  isChatFullscreen,
  setIsChatFullscreen,
  personalPrompt,
  setPersonalPrompt,
  handleSendPersonal,
  currentUser,
  chatEndRef,
  avatarMap
}: RockyChatWindowProps) {
  const activeAvatarId = currentUser?.avatar || 'avatar-cyber-ghost'
  const activeAvatar = avatarMap[activeAvatarId] || avatarMap['avatar-cyber-ghost']

  return (
    <div className={`flex flex-col transition-all duration-300 ${
      isChatFullscreen 
        ? 'col-span-1 h-[100dvh] w-full p-0 md:p-0'
        : 'lg:col-span-2 h-[600px] relative'
    }`}>
      <Card className={`flex-1 flex flex-col overflow-hidden hover:border-white/5 relative ${isChatFullscreen ? 'rounded-none border-none neo-panel shadow-none p-0' : 'p-0'}`}>
        {/* Chat Header for Fullscreen Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5 shrink-0 select-none">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Companion Active</span>
          <button
            onClick={() => setIsChatFullscreen(!isChatFullscreen)}
            className="p-2 rounded-xl text-neo-secondary hover:text-neo-text hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer border-none"
            title={isChatFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isChatFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>

        {/* Messages viewport */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {personalMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 select-none">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-violet-500/10 to-rose-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-violet-400" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Your Personal Consultant</h3>
              <p className="text-xs text-gray-500 max-w-sm font-semibold leading-relaxed">
                Ask technical questions, draft concepts, or synthesize topics. Chat history in this tab is personal and kept secure.
              </p>
            </div>
          ) : (
            personalMessages.map((msg, idx) => {
              const isSelf = msg.sender_id === currentUser?.id
              const avatarId = msg.profiles?.avatar || 'avatar-cyber-ghost'
              const avatar = avatarMap[avatarId] || avatarMap['avatar-cyber-ghost']
              
              return (
                <div 
                  key={msg.id || idx} 
                  className={`flex gap-3 w-fit max-w-[75%] animate-fadeIn ${
                    isSelf ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-semibold text-white shadow-md shrink-0 select-none ${
                    isSelf 
                      ? `bg-gradient-to-br ${activeAvatar.gradient}` 
                      : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                  }`}>
                    {isSelf ? activeAvatar.symbol : 'AI'}
                  </div>

                  <div className={`space-y-1 flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] font-bold text-gray-500 block">
                      {isSelf ? 'You' : 'Companion'}
                    </span>
                    <div className={`p-4 rounded-2xl text-[13px] leading-relaxed w-fit max-w-full ${
                      isSelf 
                        ? 'bg-neo-bg shadow-neo text-[#5E4545] dark:text-[#ffb4b4] border-none rounded-tr-none' 
                        : 'neo-inset-panel text-neo-text border-none rounded-tl-none'
                    }`}>
                      {!isSelf ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:neo-inset-panel prose-pre:border-none prose-pre:rounded-xl break-words leading-relaxed text-gray-800 dark:text-gray-300">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.message}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}

          {/* Typing Indicator */}
          {isTyping && personalMessages[personalMessages.length - 1]?.sending && (
            <div className="flex gap-3 w-fit max-w-[75%] animate-fadeIn">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-semibold text-white shadow-md shrink-0 select-none">
                AI
              </div>
              <div className="space-y-1 flex flex-col items-start">
                <span className="text-[10px] font-bold text-gray-500 block">Companion</span>
                <div className="px-4 py-3 neo-inset-panel border-none rounded-2xl rounded-tl-none flex items-center gap-2 w-fit max-w-full">
                  <div className="flex gap-1 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-neo-secondary font-medium animate-pulse ml-1">
                    {personalMessages[personalMessages.length - 1]?.message ? 'IS AI is generating a response...' : 'IS AI is thinking...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef as any} />
        </div>

        {/* Chat Input form */}
        <form onSubmit={handleSendPersonal} className="p-4 shrink-0 bg-transparent border-none select-none">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Consult your private companion..."
              value={personalPrompt}
              onChange={(e) => setPersonalPrompt(e.target.value)}
              disabled={isTyping}
              className="w-full neo-inset-panel border-none rounded-2xl py-3.5 pl-4 pr-16 text-xs text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none transition-all font-semibold"
            />
            <button
              type="submit"
              disabled={isTyping}
              className="absolute right-2 py-1.5 px-3 rounded-lg bg-neo-bg shadow-neo border-none text-[#5E4545] dark:text-[#ffb4b4] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-neo-inset transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
            >
              <span>Query</span>
              <CornerDownLeft className="h-3 w-3" />
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
