'use client'

import React from 'react'
import { Save } from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { Button } from '@/components/ui/Button'
import { useSettingsState } from '../hooks/useSettingsState'
import ThemeConfigurationPanel from './ThemeConfigurationPanel'
import NotificationPreferencesForm from './NotificationPreferencesForm'
import DataPrivacySection from './DataPrivacySection'
import DiagnosticsPanel from './DiagnosticsPanel'

export default function SettingsPageContainer() {
  const {
    notifications,
    setNotifications,
    audioHandshake,
    setAudioHandshake,
    selectedTheme,
    setSelectedTheme,
    prefChat,
    setPrefChat,
    prefFocus,
    setPrefFocus,
    prefAi,
    setPrefAi,
    prefMemory,
    setPrefMemory,
    prefAchievement,
    setPrefAchievement,
    savingPrefs,
    aiContextEnabled,
    setAiContextEnabled,
    providerPreference,
    setProviderPreference,
    providersStatus,
    loadingProviders,
    swStatus,
    dbTokenStatus,
    lastRegistrationTime,
    devicePlatform,
    sendingTest,
    repairing,
    activeInstallTab,
    setActiveInstallTab,
    currentUserId,
    registeredDeviceCount,
    runningDiagnostics,
    diagnosticsRun,
    diagnosticChecks,
    pushError,
    token,
    permission,
    handleRepairNotifications,
    handleRunDiagnostics,
    handleSendTestNotification,
    handleSave,
    handleClearMemory
  } = useSettingsState()

  return (
    <PageContainer>
      <SectionHeader 
        title="Preferences" 
        description="Modify application settings, display themes, and network connection parameters."
      />

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Left 2 Cols: Form settings */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Display settings */}
          <ThemeConfigurationPanel
            selectedTheme={selectedTheme}
            setSelectedTheme={setSelectedTheme}
          />

          {/* Alert Options */}
          <NotificationPreferencesForm
            notifications={notifications}
            setNotifications={setNotifications}
            audioHandshake={audioHandshake}
            setAudioHandshake={setAudioHandshake}
            prefChat={prefChat}
            setPrefChat={setPrefChat}
            prefFocus={prefFocus}
            setPrefFocus={setPrefFocus}
            prefAi={prefAi}
            setPrefAi={setPrefAi}
            prefMemory={prefMemory}
            setPrefMemory={setPrefMemory}
            prefAchievement={prefAchievement}
            setPrefAchievement={setPrefAchievement}
          />

          {/* AI Settings & AI Routing */}
          <DataPrivacySection
            aiContextEnabled={aiContextEnabled}
            setAiContextEnabled={setAiContextEnabled}
            handleClearMemory={handleClearMemory}
            providerPreference={providerPreference}
            setProviderPreference={setProviderPreference}
            loadingProviders={loadingProviders}
            providersStatus={providersStatus}
          />

          <Button type="submit" variant="neon" className="w-auto py-2.5 px-6 self-start flex items-center gap-2" disabled={savingPrefs}>
            <Save className="h-4 w-4" />
            <span>{savingPrefs ? 'Saving Settings...' : 'Save Preferences'}</span>
          </Button>

        </div>

        {/* Right 1 Col: Diagnostics */}
        <DiagnosticsPanel
          devicePlatform={devicePlatform}
          activeInstallTab={activeInstallTab}
          setActiveInstallTab={setActiveInstallTab}
          permission={permission}
          swStatus={swStatus}
          token={token}
          dbTokenStatus={dbTokenStatus}
          currentUserId={currentUserId}
          registeredDeviceCount={registeredDeviceCount}
          lastRegistrationTime={lastRegistrationTime}
          diagnosticsRun={diagnosticsRun}
          diagnosticChecks={diagnosticChecks}
          runningDiagnostics={runningDiagnostics}
          sendingTest={sendingTest}
          repairing={repairing}
          handleRunDiagnostics={handleRunDiagnostics}
          handleSendTestNotification={handleSendTestNotification}
          handleRepairNotifications={handleRepairNotifications}
          pushError={pushError}
        />

      </form>
    </PageContainer>
  )
}
