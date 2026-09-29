import { z } from 'zod'

export interface ContactMailConfig {
  host: string
  port: number
  user?: string
  pass?: string
  from: string
  to: string
}

const emailAddress = z.string().email()

/** Keep the page's form availability and the API's send requirements aligned. */
export function getContactMailConfig(): ContactMailConfig | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_FROM, CONTACT_TO } =
    process.env
  const port = Number(SMTP_PORT ?? 587)
  const from = CONTACT_FROM || SMTP_USER || CONTACT_TO

  if (
    !SMTP_HOST ||
    !CONTACT_TO ||
    !from ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65_535 ||
    Boolean(SMTP_USER) !== Boolean(SMTP_PASS) ||
    !emailAddress.safeParse(from).success ||
    !emailAddress.safeParse(CONTACT_TO).success
  ) {
    return null
  }

  return {
    host: SMTP_HOST,
    port,
    user: SMTP_USER,
    pass: SMTP_PASS,
    from,
    to: CONTACT_TO,
  }
}
