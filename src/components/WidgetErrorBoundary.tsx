'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Shown as the widget title in the fallback card */
  name?: string
}

interface State {
  hasError: boolean
}

export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[WidgetErrorBoundary${this.props.name ? `: ${this.props.name}` : ''}]`, error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="card-elevated"
          style={{
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            minHeight: 120,
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 24 }}>⚠️</span>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', margin: 0 }}>
            {this.props.name ? `${this.props.name} failed to load` : 'This section failed to load'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              marginTop: 4,
              padding: '6px 16px',
              borderRadius: 8,
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-card)',
              color: 'var(--color-primary)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
