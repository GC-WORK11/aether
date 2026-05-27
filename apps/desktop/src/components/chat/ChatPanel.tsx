import { useAppStore } from '../../store/useAppStore'
import { Send, Bot, User, Loader2 } from 'lucide-react'

export function ChatPanel() {
  const { messages, chatInput, setChatInput, sendMessage, pipelineRunning, pipelineResult } = useAppStore()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await sendMessage()
  }
  
  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-surface">
        <h2 className="text-lg font-semibold">Physics Assistant</h2>
        <p className="text-sm text-text-muted">Ask about any mechanism</p>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-16 text-text-muted">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Ask a question about the physics</p>
            <p className="text-sm mt-2 opacity-75">Example: "What is the spring constant?"</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div 
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-purple-400" />
              </div>
            )}
            
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user' 
                ? 'bg-cyan-500 text-white rounded-tr-sm' 
                : 'bg-surface border border-border text-text-primary rounded-tl-sm'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
            
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}
        
        {pipelineRunning && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-purple-400" />
            </div>
            <div className="bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
            </div>
          </div>
        )}
      </div>
      
      {/* Summary Bar */}
      {pipelineResult && messages.length > 0 && (
        <div className="px-4 py-2 bg-surface border-t border-border">
          <p className="text-xs text-text-muted">
            Last: <span className="text-cyan-400">{pipelineResult.answer?.mechanism_type}</span>
            {' • '}
            <span>{pipelineResult.total_time_seconds?.toFixed(1)}s</span>
          </p>
        </div>
      )}
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-surface">
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask about physics..."
            className="flex-1 px-4 py-2 bg-surface-2 border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-cyan-500 focus:outline-none"
            disabled={pipelineRunning}
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || pipelineRunning}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-surface-2 disabled:text-text-muted rounded-xl transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
