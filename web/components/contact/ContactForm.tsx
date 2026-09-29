'use client'

import { contactCopy,type ContactCopy } from '@/lib/cms/contact-copy'
import { useEffect, useRef, useState } from 'react'

import styles from '@/app/(site)/contact/contact.module.css'
import { trackAnalyticsEvent } from '@/lib/analytics'

type Status = 'idle' | 'sending' | 'sent' | 'error'
type ApiResponse = { error?: string; confirmationSent?: boolean; queued?:boolean }

const REQUEST_TIMEOUT_MS = 45_000

export function ContactForm({ fallbackEmail,copy=contactCopy }: { fallbackEmail: string;copy?:ContactCopy }) {
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [queued,setQueued]=useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const requestRef = useRef<AbortController | null>(null)
  const trackedStart = useRef(false)

  useEffect(
    () => () => {
      requestRef.current?.abort()
    },
    []
  )

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const form = e.currentTarget
    const controller = new AbortController()
    requestRef.current?.abort()
    requestRef.current = controller

    setStatus('sending')
    setMessage('')
    setConfirmationSent(false)

    const data = Object.fromEntries(new FormData(form))
    const timeout = window.setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS
    )

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
      })
      const json = (await res.json().catch(() => null)) as ApiResponse | null

      if (!res.ok) {
        trackAnalyticsEvent('contact_submit', {
          outcome: 'error',
          errorCategory: res.status >= 500 ? 'server' : 'validation',
        })
        setStatus('error')
        setMessage(json?.error ?? copy.errorMessage)
        return
      }

      setStatus('sent')
      setConfirmationSent(json?.confirmationSent === true)
      setQueued(json?.queued===true)
      trackAnalyticsEvent('contact_submit', { outcome: 'success' })
      form.reset()
    } catch {
      if (controller.signal.aborted) {
        trackAnalyticsEvent('contact_submit', {
          outcome: 'error',
          errorCategory: 'timeout',
        })
        setStatus('error')
        setMessage('The request timed out. Please try again.')
      } else {
        trackAnalyticsEvent('contact_submit', {
          outcome: 'error',
          errorCategory: 'network',
        })
        setStatus('error')
        setMessage('Network error. Try again?')
      }
    } finally {
      window.clearTimeout(timeout)
      if (requestRef.current === controller) requestRef.current = null
    }
  }

  return (
    <form
      className={styles.form}
      onSubmit={onSubmit}
      onFocusCapture={() => {
        if (trackedStart.current) return
        trackedStart.current = true
        trackAnalyticsEvent('contact_form_start')
      }}
      onChangeCapture={() => {
        if (status === 'sent' || status === 'error') {
          setStatus('idle')
          setMessage('')
        }
      }}
      aria-busy={status === 'sending'}
    >
      <label className={styles.field}>
        <span className={styles.label}>{copy.nameLabel}</span>
        <input name="name" type="text" required maxLength={120} autoComplete="name" />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>{copy.emailLabel}</span>
        <input name="email" type="email" required autoComplete="email" />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>{copy.messageLabel}</span>
        <textarea name="body" rows={6} required minLength={10} maxLength={4000} />
      </label>

      {/* honeypot: hidden from people, irresistible to bots */}
      <input
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className={styles.honeypot}
      />

      <button
        type="submit"
        className={styles.submit}
        data-state={status}
        disabled={status === 'sending' || status === 'sent'}
      >
        <span className={styles.submitText}>
          {status === 'sending'
            ? copy.sendingLabel
            : status === 'sent'
              ? copy.sentLabel
              : copy.sendLabel}
        </span>
        <span className={styles.birdScene} aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <svg
              key={index}
              className={`${styles.bird} ${styles[`bird${index + 1}`]}`}
              viewBox="0 0 32 22"
              fill="none"
            >
              <path
                d="M2 14c5-7 10-7 14 0 3-6 8-9 14-8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ))}
          <svg className={styles.feather} viewBox="0 0 18 22" fill="none">
            <path
              d="M15 2C8 3 3 8 3 15c3-3 6-4 9-5-3 2-6 5-8 10 7-4 12-10 11-18Z"
              fill="currentColor"
            />
          </svg>
        </span>
      </button>

      {status === 'sent' && (
        <div className={styles.receipt} role="status" aria-live="polite">
          <span className={styles.receiptEyebrow}>DRW · Delivery note</span>
          <p className={styles.receiptTitle}>Your message has landed.</p>
          <p className={styles.receiptCopy}>
            {queued ? copy.successMessage : confirmationSent
              ? 'Your message was sent to David. A confirmation email has been sent to the address you entered.'
              : 'Your message was sent to David. The confirmation email could not be sent, but your message arrived. No need to send it again.'}
          </p>
        </div>
      )}

      {status === 'error' && message && (
        <div role="alert">
          <p className={styles.error}>{message}</p>
          <a className={styles.fallbackLink} href={`mailto:${fallbackEmail}`}>
            Email {fallbackEmail} instead ↗
          </a>
        </div>
      )}
    </form>
  )
}
