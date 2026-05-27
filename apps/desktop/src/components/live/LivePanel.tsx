import { useAppStore } from '../../store/useAppStore'
import { ChatPanel } from '../chat/ChatPanel'
import { StudioPanel } from '../studio/StudioPanel'

export function LivePanel() {
  const { activeTab } = useAppStore()
  
  if (activeTab === 'chat') {
    return <ChatPanel />
  }
  
  return <StudioPanel />
}
