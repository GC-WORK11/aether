import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/globals.css'

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean; error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', {className: 'min-h-screen bg-[#050507] flex items-center justify-center p-6'},
        React.createElement('div', {className: 'max-w-md text-center'},
          React.createElement('div', {className: 'text-6xl mb-6'}, '⚠️'),
          React.createElement('h1', {className: 'text-2xl font-bold text-white mb-4'}, 'Something went wrong'),
          React.createElement('p', {className: 'text-slate-400 mb-6 font-mono text-sm'}, this.state.error?.message || 'Unknown error'),
          React.createElement('button', {
            className: 'px-6 py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400',
            onClick: () => window.location.reload()
          }, 'Reload App')
        )
      )
    }
    return this.props.children
  }
}

function Root() {
  return React.createElement(ErrorBoundary, null,
    React.createElement(BrowserRouter, null,
      React.createElement(App)
    )
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  React.createElement(React.StrictMode, null,
    React.createElement(Root)
  )
)
