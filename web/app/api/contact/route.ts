import { cmsEnabled } from '@/lib/cms/db'
import { acceptContact } from '@/lib/cms/contact'
import { CmsError } from '@/lib/cms/repository'
import nodemailer from 'nodemailer'

import { ownerNotification, senderReceipt } from '@/lib/contact-email'
import { getContactMailConfig } from '@/lib/contact-mail'
import { contactSchema } from '@/lib/schema'
import { siteOrigin } from '@/lib/site-url'

export const runtime = 'nodejs'

interface RateBucket {
  timestamps: number[]
  lastSeen: number
}

const hits = new Map<string, RateBucket>()
const WINDOW_MS = 10 * 60 * 1000
const LIMIT = 3
const SWEEP_INTERVAL_MS = 60 * 1000
const MAX_TRACKED_CLIENTS = 5_000
const MAX_BODY_BYTES = 16 * 1024

let lastSweep = 0
let mailer: ReturnType<typeof nodemailer.createTransport> | null = null

class PayloadTooLargeError extends Error {}

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('Cache-Control', 'no-store')
  return Response.json(data, { ...init, headers })
}

function pruneRateLimits(now: number) {
  if (
    now - lastSweep < SWEEP_INTERVAL_MS &&
    hits.size < MAX_TRACKED_CLIENTS
  ) {
    return
  }

  lastSweep = now
  for (const [ip, bucket] of hits) {
    const recent = bucket.timestamps.filter((time) => now - time < WINDOW_MS)
    if (!recent.length) hits.delete(ip)
    else hits.set(ip, { timestamps: recent, lastSeen: bucket.lastSeen })
  }
}

function checkRateLimit(ip: string) {
  const now = Date.now()
  pruneRateLimits(now)

  const bucket = hits.get(ip)
  if (!bucket && hits.size >= MAX_TRACKED_CLIENTS) {
    return { ok: false, retryAfter: Math.ceil(WINDOW_MS / 1000) }
  }

  const recent = (bucket?.timestamps ?? []).filter(
    (time) => now - time < WINDOW_MS
  )
  if (recent.length >= LIMIT) {
    const retryAfter = Math.max(
      1,
      Math.ceil((recent[0] + WINDOW_MS - now) / 1000)
    )
    return { ok: false, retryAfter }
  }

  recent.push(now)
  hits.set(ip, { timestamps: recent, lastSeen: now })
  return { ok: true, retryAfter: 0 }
}

function normalizeIp(value: string | null) {
  const candidate = value?.trim()
  if (!candidate || candidate.length > 64) return null
  return /^[0-9a-f:.]+$/i.test(candidate) ? candidate : null
}

function clientIp(req: Request) {
  // Cloudflare overwrites this header at its trusted edge. Do not trust the
  // client-controlled x-forwarded-for chain for a security control.
  return (
    normalizeIp(req.headers.get('cf-connecting-ip')) ??
    'unknown'
  )
}

async function readJsonBody(req: Request): Promise<unknown> {
  const declaredLength = Number(req.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new PayloadTooLargeError()
  }

  if (!req.body) throw new SyntaxError('Missing body')

  const reader = req.body.getReader()
  const decoder = new TextDecoder()
  let bytes = 0
  let text = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    bytes += value.byteLength
    if (bytes > MAX_BODY_BYTES) {
      await reader.cancel()
      throw new PayloadTooLargeError()
    }
    text += decoder.decode(value, { stream: true })
  }

  text += decoder.decode()
  return JSON.parse(text)
}

function getMailer(config: {
  host: string
  port: number
  user?: string
  pass?: string
}): ReturnType<typeof nodemailer.createTransport> {
  if (mailer) return mailer

  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth:
      config.user && config.pass
        ? { user: config.user, pass: config.pass }
        : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  })
  mailer = transport
  return transport
}

export async function POST(req: Request) {
  const rate = cmsEnabled() ? {ok:true,retryAfter:0} : checkRateLimit(clientIp(req))
  if (!rate.ok) {
    return json(
      { error: 'That is a lot of messages. Try again in a few minutes.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rate.retryAfter) },
      }
    )
  }

  if (!req.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return json({ error: 'Content-Type must be application/json' }, { status: 415 })
  }

  let payload: unknown
  try {
    payload = await readJsonBody(req)
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return json({ error: 'Request is too large' }, { status: 413 })
    }
    return json({ error: 'Malformed request' }, { status: 400 })
  }

  const parsed = contactSchema.safeParse(payload)
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? 'Check the form and try again'
    return json({ error: first }, { status: 400 })
  }

  // Honeypot: pretend it worked so the bot does not retry.
  if (parsed.data.website) return json({ ok: true })

  if (cmsEnabled()) {
    const origin = req.headers.get('origin')
    if (origin !== siteOrigin) return json({error:'Origin not allowed'}, {status:403})
    try { return json(await acceptContact({name:parsed.data.name.replace(/[\x00-\x1f\x7f]+/g,' ').trim(),email:parsed.data.email,body:parsed.data.body},clientIp(req),req.headers.get('idempotency-key')??undefined)) }
    catch(error) { return json({error:error instanceof CmsError?error.message:'Could not save your message. Please try again.'},{status:error instanceof CmsError?error.status:503}) }
  }

  const config = getContactMailConfig()
  if (!config) {
    console.error('[contact] SMTP is not configured correctly, message dropped')
    return json(
      { error: 'Mail is not configured yet. Please email me directly.' },
      { status: 503 }
    )
  }

  const { name, email, body } = parsed.data
  const safeName = name.replace(/[\x00-\x1f\x7f]+/g, ' ').trim()
  const message = { name: safeName, email, body }
  const mailer = getMailer({
    host: config.host,
    port: config.port,
    user: config.user,
    pass: config.pass,
  })

  try {
    await mailer.sendMail({
      from: {
        name: 'drw · Contact form',
        address: config.from,
      },
      to: config.to,
      replyTo: { name: safeName, address: email },
      ...ownerNotification(message, siteOrigin),
    })
  } catch (error) {
    console.error('[contact] send failed', error)
    return json(
      { error: 'Could not send right now. Please email me directly.' },
      { status: 502 }
    )
  }

  let confirmationSent = false
  try {
    await mailer.sendMail({
      from: { name: 'David Rizky Wijaya', address: config.from },
      to: email,
      replyTo: { name: 'David Rizky Wijaya', address: config.to },
      headers: { 'Auto-Submitted': 'auto-replied' },
      ...senderReceipt(message, siteOrigin, config.to),
    })
    confirmationSent = true
  } catch (error) {
    // The owner's copy already arrived. A retry would duplicate that message.
    console.error('[contact] sender receipt failed', error)
  }

  return json({ ok: true, confirmationSent })
}
