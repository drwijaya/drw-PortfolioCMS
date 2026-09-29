'use client'

import dynamic from 'next/dynamic'
import { Component, type ReactNode } from 'react'
import styles from './OffTheClock.module.css'

const Island = dynamic(() => import('./Island'), {
  ssr: false,
  loading: () => <div className={styles.loading} role="status"><span className={styles.loadingMark} aria-hidden>⌁</span>Getting the island ready…<a href="#collections">Browse collections below ↓</a></div>,
})

class IslandBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return <div className={styles.loading}><p>The island couldn’t load this time.</p><a className={styles.textLink} href="#collections">Browse all four collections ↓</a></div>
    return this.props.children
  }
}

export function IslandLoader() {
  return <IslandBoundary><Island /></IslandBoundary>
}
