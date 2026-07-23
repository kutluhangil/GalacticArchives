// Top-level error boundary: a thrown render error in any lazy route or engine
// would otherwise blank the whole app. This catches it and shows a themed
// panel with recovery actions instead of a white screen.

import { Component, type ReactNode } from 'react'
import ErrorFallback from './ErrorFallback'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    // surface the real cause for debugging; the fallback stays user-friendly
    console.error('Uncaught render error:', error)
  }

  render() {
    if (this.state.error) return <ErrorFallback error={this.state.error} />
    return this.props.children
  }
}
