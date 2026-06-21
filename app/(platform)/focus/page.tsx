'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Users, Search, Play, BookOpen, Clock, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile, StudyRoom, StudyRoomInvitation } from '@/types'
import { Card } from '@/components/ui/Card'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { useRouter } from 'next/navigation'

const AVATAR_MAP: Record<string, { gradient: string; symbol: string }> = {
  'avatar-cyber-ghost':  { gradient: 'from-indigo-400 to-purple-500',  symbol: 'CM' },
  'avatar-neon-pulse':   { gradient: 'from-purple-400 to-pink-500',    symbol: 'SL' },
  'avatar-alpha-wing':   { gradient: 'from-emerald-400 to-teal-500',   symbol: 'MM' },
  'avatar-solar-flare':  { gradient: 'from-[#5E4545] to-[#8A6D6D] dark:from-[#ffb4b4] dark:to-[#ff8a8a]',    symbol: 'WP' },
  'avatar-void-runner':  { gradient: 'from-rose-400 to-pink-500',      symbol: 'CB' },
  'avatar-shadow-blade': { gradient: 'from-slate-400 to-indigo-500',   symbol: 'MS' },
}

export default function StudyLoungePage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null)
  const [studyRooms, setStudyRooms] = useState<StudyRoom[]>([])
  const [roomMemberCounts, setRoomMemberCounts] = useState<Record<string, number>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // User Profile Directory State (for invitations)
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<StudyRoomInvitation[]>([])

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDescription, setNewRoomDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [selectedInvitees, setSelectedInvitees] = useState<string[]>([])
  const [searchInviteUser, setSearchInviteUser] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 1. Fetch Auth User and Profiles
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
        if (prof) {
          setActiveProfile(prof as UserProfile)
        }
      }
    }
    fetchUser()
  }, [supabase])

  // Fetch user profiles for invitation selections
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase.from('profiles').select('id, username, avatar')
      if (data) {
        setProfiles(data as UserProfile[])
      }
    }
    fetchProfiles()
  }, [supabase])

  // Fetch pending invitations
  const fetchInvitations = async () => {
    if (!activeProfile) return
    const { data, error } = await supabase
      .from('study_room_invitations')
      .select('*, inviter_profile:inviter_user_id(username, avatar), study_rooms:room_id(name, description, host_user_id, is_public)')
      .eq('invitee_user_id', activeProfile.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setPendingInvitations(data as any)
    }
  }

  useEffect(() => {
    if (activeProfile) {
      fetchInvitations()

      const sub = supabase.channel('my-study-invitations')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'study_room_invitations', filter: `invitee_user_id=eq.${activeProfile.id}` },
          () => {
            fetchInvitations()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(sub)
      }
    }
  }, [supabase, activeProfile])

  // 2. Fetch Active Study Rooms & Members Count
  const fetchRooms = async () => {
    try {
      setLoading(true)
      // Fetch rooms that are waiting or active
      const { data: rooms, error } = await supabase
        .from('study_rooms')
        .select('*, profiles:host_user_id(username, avatar)')
        .in('room_status', ['waiting', 'active'])
        .order('created_at', { ascending: false })

      if (error) throw error

      if (rooms) {
        setStudyRooms(rooms as any)

        // Fetch member count for each room
        const roomIds = rooms.map(r => r.id)
        if (roomIds.length > 0) {
          const { data: members, error: memError } = await supabase
            .from('study_room_members')
            .select('room_id')
            .in('room_id', roomIds)

          if (!memError && members) {
            const counts: Record<string, number> = {}
            members.forEach((m: any) => {
              counts[m.room_id] = (counts[m.room_id] || 0) + 1
            })
            setRoomMemberCounts(counts)
          }
        }
      }
    } catch (err) {
      console.warn("Failed to fetch study rooms:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()

    // Realtime subscription for study rooms updates
    const channel = supabase.channel('study-lounge-rooms')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_rooms' },
        () => {
          fetchRooms()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // 3. Create Room Action
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoomName.trim() || !activeProfile) return
    setIsSubmitting(true)

    try {
      // 1. Insert room details
      const { data: newRoom, error: roomError } = await supabase
        .from('study_rooms')
        .insert({
          name: newRoomName.trim(),
          description: newRoomDescription.trim(),
          host_user_id: activeProfile.id,
          room_status: 'waiting',
          is_public: isPublic
        })
        .select()
        .single()

      if (roomError) throw roomError

      if (newRoom) {
        // 2. Add host as a member
        const { error: memberError } = await supabase
          .from('study_room_members')
          .insert({
            room_id: newRoom.id,
            user_id: activeProfile.id,
            is_host: true
          })

        if (memberError) throw memberError

        // 3. Invite selected participants
        if (selectedInvitees.length > 0) {
          const invitationRows = selectedInvitees.map(inviteeId => ({
            room_id: newRoom.id,
            inviter_user_id: activeProfile.id,
            invitee_user_id: inviteeId,
            status: 'pending'
          }))

          const { error: inviteError } = await supabase
            .from('study_room_invitations')
            .insert(invitationRows)

          if (inviteError) throw inviteError

          // 4. Trigger Notifications in background
          selectedInvitees.forEach(inviteeId => {
            fetch('/api/notifications/trigger', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: inviteeId,
                title: 'study cabin invite 📅',
                body: `@${activeProfile.username} invited you to join: ${newRoomName.trim()}`,
                category: 'focus',
                type: 'invitation',
                relatedId: newRoom.id,
                roomId: newRoom.id
              })
            }).catch(nErr => console.warn("Failed to trigger FCM invitation:", nErr))
          })
        }

        // Close modal, reset, and navigate
        setCreateModalOpen(false)
        setNewRoomName('')
        setNewRoomDescription('')
        setIsPublic(true)
        setSelectedInvitees([])
        setSearchInviteUser('')
        router.push(`/focus/${newRoom.id}`)
      }
    } catch (err) {
      console.error(err)
      alert("Failed to create study room. Please check database permissions.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAcceptInvite = async (invitation: any) => {
    if (!activeProfile) return
    try {
      // 1. Join room
      const { error: joinErr } = await supabase
        .from('study_room_members')
        .insert({
          room_id: invitation.room_id,
          user_id: activeProfile.id,
          is_host: false
        })
      if (joinErr && joinErr.code !== '23505') throw joinErr

      // 2. Accept invitation
      const { error: inviteErr } = await supabase
        .from('study_room_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id)
      if (inviteErr) throw inviteErr

      // Redirect
      router.push(`/focus/${invitation.room_id}`)
    } catch (err) {
      console.error(err)
      alert("Failed to join room.")
    }
  }

  const handleDeclineInvite = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('study_room_invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId)
      if (error) throw error
      
      // Refresh local list
      setPendingInvitations(prev => prev.filter(i => i.id !== invitationId))
    } catch (err) {
      console.error(err)
      alert("Failed to decline invitation.")
    }
  }

  const filteredRooms = studyRooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <PageContainer>
      <div className="space-y-6 max-w-4xl mx-auto pb-24">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader 
            title="study lounge" 
            description="join dynamic, customized focus cabins or host your own live study room."
          />
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-lg transition-all duration-300 transform active:scale-95 cursor-pointer lowercase h-11 shrink-0"
            suppressHydrationWarning
          >
            <Plus className="h-4.5 w-4.5" />
            <span>create cabin</span>
          </button>
        </div>

        {/* Search bar & statistics overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Search Card */}
          <Card className="p-4 md:col-span-2 flex items-center gap-3">
            <Search className="h-5 w-5 text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="search active cabins by name or keyword..."
              className="flex-1 bg-transparent border-none text-xs focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 font-semibold h-10"
              suppressHydrationWarning
            />
          </Card>

          {/* Quick Metrics */}
          <Card className="p-4 flex items-center justify-around text-center">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">active cabins</span>
              <span className="text-xl font-black text-amber-500">{studyRooms.length}</span>
            </div>
            <div className="w-px h-8 bg-black/5 dark:bg-white/5" />
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">studying now</span>
              <span className="text-xl font-black text-cyan-500">
                {Object.values(roomMemberCounts).reduce((sum, count) => sum + count, 0)}
              </span>
            </div>
          </Card>
        </div>

        {/* Pending Invitations Section */}
        {pendingInvitations.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-widest pl-1">
              study cabin invitations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingInvitations.map((invite) => {
                const roomInfo = invite.study_rooms
                const hostProfile = invite.inviter_profile
                const hostAvatar = AVATAR_MAP[hostProfile?.avatar || 'avatar-cyber-ghost'] || AVATAR_MAP['avatar-cyber-ghost']

                return (
                  <Card key={invite.id} className="p-5 flex flex-col justify-between gap-4 relative overflow-hidden border border-amber-500/20 bg-amber-500/[0.01]">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="text-xs font-black text-gray-900 dark:text-white lowercase truncate max-w-[70%]">
                          {roomInfo?.name}
                        </h4>
                        <span className="text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          invited
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium line-clamp-2 leading-relaxed lowercase min-h-[32px]">
                        {roomInfo?.description || 'no description provided for this cabin.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3.5 border-t border-black/5 dark:border-white/5 text-xs font-bold gap-3">
                      {/* Host info */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`h-6 w-6 rounded-full bg-gradient-to-br ${hostAvatar.gradient} flex items-center justify-center text-[8px] font-bold text-white shrink-0 shadow-sm`}>
                          {hostAvatar.symbol}
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate lowercase font-semibold">
                          invited by: {hostProfile?.username || 'explorer'}
                        </span>
                      </div>

                      {/* Join / Decline Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleDeclineInvite(invite.id)}
                          className="px-3 py-1.5 rounded-xl bg-transparent border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-[10px] font-bold text-gray-500 transition-all active:scale-95 cursor-pointer lowercase h-8"
                        >
                          decline
                        </button>
                        
                        <button
                          onClick={() => handleAcceptInvite(invite)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10.5px] font-black transition-all duration-300 transform active:scale-95 cursor-pointer lowercase h-8"
                        >
                          <span>join</span>
                        </button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Study Rooms Browser List */}
        <div className="space-y-4">
          <h3 className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">
            live focus cabins
          </h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="h-6 w-6 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
              <p className="text-[11px] font-semibold text-gray-400 lowercase">syncing lounge rooms...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <Card className="p-10 text-center space-y-3.5 border-dashed">
              <BookOpen className="h-10 w-10 text-gray-300 dark:text-gray-700 mx-auto" />
              <div>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 lowercase">no active cabins found</p>
                <p className="text-[11px] text-gray-400 mt-1 lowercase font-semibold">be the first to establish a study cabin by clicking "create cabin".</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRooms.map((room) => {
                const hostProfile = (room as any).profiles
                const hostAvatar = AVATAR_MAP[hostProfile?.avatar || 'avatar-cyber-ghost'] || AVATAR_MAP['avatar-cyber-ghost']
                const memberCount = roomMemberCounts[room.id] || 0
                const isWaiting = room.room_status === 'waiting'

                return (
                  <Card key={room.id} className="p-5 flex flex-col justify-between gap-5 relative overflow-hidden transition-all duration-300 hover:scale-[1.01]">
                    
                    {/* Corner gradient glow based on status */}
                    <div className={`absolute top-0 right-0 h-20 w-20 rounded-full blur-3xl opacity-20 ${
                      isWaiting ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />

                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="text-xs font-black text-gray-900 dark:text-white lowercase truncate max-w-[70%]">
                          {room.name}
                        </h4>
                        <span className={`text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                          isWaiting 
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        }`}>
                          {room.room_status}
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium line-clamp-2 leading-relaxed lowercase min-h-[32px]">
                        {room.description || 'no description provided for this cabin.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3.5 border-t border-black/5 dark:border-white/5 text-xs font-bold gap-3">
                      {/* Host info */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`h-6 w-6 rounded-full bg-gradient-to-br ${hostAvatar.gradient} flex items-center justify-center text-[8px] font-bold text-white shrink-0 shadow-sm`}>
                          {hostAvatar.symbol}
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate lowercase font-semibold">
                          host: {hostProfile?.username || 'explorer'}
                        </span>
                      </div>

                      {/* Members list & Join Button */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold lowercase">
                          <Users className="h-3.5 w-3.5" />
                          {memberCount} {memberCount === 1 ? 'member' : 'members'}
                        </span>
                        
                        <button
                          onClick={() => router.push(`/focus/${room.id}`)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neo-bg shadow-neo-shallow border border-black/5 dark:border-white/5 text-amber-600 dark:text-amber-500 text-[10.5px] font-black transition-all duration-300 transform active:scale-95 active:shadow-neo-inset-shallow cursor-pointer lowercase h-8"
                        >
                          <Play className="h-3 w-3 fill-amber-600 dark:fill-amber-500 shrink-0" />
                          <span>join</span>
                        </button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* ── CREATE ROOM MODAL ── */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn select-none">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-md"
              onClick={() => setCreateModalOpen(false)}
            />
            
            <div className="relative w-full sm:max-w-md bg-[#fefdfb] dark:bg-[#1c1f26] rounded-t-2xl sm:rounded-3xl border border-black/6 dark:border-white/5 shadow-2xl z-10 p-6 space-y-5 animate-slideUp sm:animate-scaleIn max-h-[90vh] overflow-y-auto scrollbar-none">
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4.5 w-4.5 text-amber-500" />
                  <h3 className="text-sm font-black text-gray-900 dark:text-white lowercase">
                    establish study cabin
                  </h3>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-800 dark:hover:text-white transition-all cursor-pointer"
                  style={{ minHeight: '44px', minWidth: '44px' }}
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block pl-0.5">
                    cabin name
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value.slice(0, 40))}
                    placeholder="e.g. midnight coding sessions, bio finals grind..."
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/8 dark:border-white/8 rounded-xl py-3 px-4 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-amber-500/50 transition-all font-semibold h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block pl-0.5">
                    description
                  </label>
                  <textarea
                    value={newRoomDescription}
                    onChange={(e) => setNewRoomDescription(e.target.value.slice(0, 150))}
                    placeholder="describe the study focus or guidelines (optional)..."
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/8 dark:border-white/8 rounded-xl p-3.5 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-amber-500/50 resize-none h-20 leading-relaxed font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block pl-0.5">
                    visibility
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPublic(true)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border lowercase cursor-pointer ${
                        isPublic
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-sm'
                          : 'bg-transparent text-gray-500 border-black/8 dark:border-white/8 hover:bg-black/3 dark:hover:bg-white/3'
                      }`}
                    >
                      public
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPublic(false)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border lowercase cursor-pointer ${
                        !isPublic
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-sm'
                          : 'bg-transparent text-gray-500 border-black/8 dark:border-white/8 hover:bg-black/3 dark:hover:bg-white/3'
                      }`}
                    >
                      private (invite only)
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block pl-0.5">
                    invite participants {isPublic ? '(optional)' : '(required)'}
                  </label>
                  
                  {/* Selected Invitees Chips */}
                  {selectedInvitees.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl border border-black/5 dark:border-white/5 max-h-20 overflow-y-auto">
                      {selectedInvitees.map(id => {
                        const prof = profiles.find(p => p.id === id)
                        if (!prof) return null
                        const avatarInfo = AVATAR_MAP[prof.avatar || 'avatar-cyber-ghost'] || AVATAR_MAP['avatar-cyber-ghost']
                        return (
                          <span
                            key={id}
                            className="flex items-center gap-1 bg-neo-bg shadow-neo-shallow border border-black/5 dark:border-white/5 px-2 py-1 rounded-lg text-[10px] font-bold text-gray-700 dark:text-gray-300 lowercase"
                          >
                            <div className={`h-4 w-4 rounded-full bg-gradient-to-br ${avatarInfo.gradient} flex items-center justify-center text-[6px] font-bold text-white shrink-0 shadow-sm`}>
                              {avatarInfo.symbol}
                            </div>
                            <span>{prof.username}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedInvitees(prev => prev.filter(i => i !== id))}
                              className="text-gray-400 hover:text-rose-500 transition-colors shrink-0 font-bold leading-none select-none text-[8px] bg-transparent border-none cursor-pointer"
                            >
                              ✕
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  )}

                  {/* Search input */}
                  <input
                    type="text"
                    value={searchInviteUser}
                    onChange={(e) => setSearchInviteUser(e.target.value)}
                    placeholder="search users to invite..."
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/8 dark:border-white/8 rounded-xl py-2 px-3 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-amber-500/50 transition-all font-semibold h-10"
                  />

                  {/* Filtered Users List */}
                  <div className="border border-black/8 dark:border-white/8 rounded-xl overflow-hidden max-h-28 overflow-y-auto divide-y divide-black/5 dark:divide-white/5 bg-black/[0.01] dark:bg-white/[0.01]">
                    {profiles
                      .filter(p => p.id !== activeProfile?.id)
                      .filter(p => p.username.toLowerCase().includes(searchInviteUser.toLowerCase()))
                      .map(p => {
                        const isSelected = selectedInvitees.includes(p.id)
                        const avatarInfo = AVATAR_MAP[p.avatar || 'avatar-cyber-ghost'] || AVATAR_MAP['avatar-cyber-ghost']
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedInvitees(prev =>
                                isSelected ? prev.filter(id => id !== p.id) : [...prev, p.id]
                              )
                            }}
                            className={`flex items-center justify-between p-2 hover:bg-black/3 dark:hover:bg-white/3 cursor-pointer transition-colors ${
                              isSelected ? 'bg-amber-500/[0.03] dark:bg-amber-500/[0.03]' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`h-5 w-5 rounded-full bg-gradient-to-br ${avatarInfo.gradient} flex items-center justify-center text-[7px] font-bold text-white shrink-0 shadow-sm`}>
                                {avatarInfo.symbol}
                              </div>
                              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 lowercase truncate">
                                {p.username}
                              </span>
                            </div>
                            <div className={`h-4.5 w-4.5 rounded-lg border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-amber-500 border-amber-500 text-white'
                                : 'border-black/20 dark:border-white/20 bg-transparent'
                            }`}>
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                          </div>
                        )
                      })}
                    {profiles.filter(p => p.id !== activeProfile?.id).filter(p => p.username.toLowerCase().includes(searchInviteUser.toLowerCase())).length === 0 && (
                      <div className="p-3 text-center text-[10px] text-gray-400 lowercase font-semibold">
                        no users found
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2 h-12">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateModalOpen(false)
                      setSelectedInvitees([])
                      setSearchInviteUser('')
                      setIsPublic(true)
                    }}
                    className="flex-1 rounded-xl border border-black/8 dark:border-white/8 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-black/3 dark:hover:bg-white/3 transition-all cursor-pointer h-11"
                  >
                    cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting || !newRoomName.trim() || (!isPublic && selectedInvitees.length === 0)}
                    className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold transition-all cursor-pointer h-11 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Plus className="h-4 w-4 shrink-0" />
                    <span>{isSubmitting ? 'building...' : 'create'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </PageContainer>
  )
}
