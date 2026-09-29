export interface ContactMessage {
  name: string
  email: string
  body: string
}

export interface ContactEmail {
  subject: string
  text: string
  html: string
}

const colors = {
  brown: '#644331',
  accent: '#9c5833',
  cream: '#fff1ea',
  paper: '#fffaf6',
  white: '#ffffff',
  border: '#e3d4bd',
  ink: '#2e2a26',
  muted: '#6b6258',
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[character]
  })
}

function messageBox(body: string, label: string) {
  const message = escapeHtml(body).replace(/\r\n?|\n/g, '<br>')

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;border:1px solid ${colors.border};border-collapse:separate;background:${colors.white};">
      <tr>
        <td width="4" bgcolor="${colors.accent}" style="width:4px;background:${colors.accent};font-size:1px;line-height:1px;">&nbsp;</td>
        <td style="padding:20px 22px 22px;">
          <p style="margin:0 0 12px;color:${colors.accent};font:700 10px/1.4 Arial,Helvetica,sans-serif;letter-spacing:1.5px;text-transform:uppercase;">${label}</p>
          <p style="margin:0;color:${colors.ink};font:400 15px/1.75 Arial,Helvetica,sans-serif;word-break:break-word;">${message}</p>
        </td>
      </tr>
    </table>`
}

function emailShell({
  origin,
  preheader,
  eyebrow,
  title,
  introduction,
  content,
  closing,
}: {
  origin: string
  preheader: string
  eyebrow: string
  title: string
  introduction: string
  content: string
  closing: string
}) {
  const contactUrl = `${origin}/contact`

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:${colors.cream};color:${colors.ink};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${colors.cream}" style="width:100%;background:${colors.cream};border-collapse:collapse;">
      <tr>
        <td align="center" style="padding:30px 14px 40px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="${colors.paper}" style="width:100%;max-width:600px;border:1px solid ${colors.border};border-collapse:separate;background:${colors.paper};">
            <tr>
              <td bgcolor="${colors.brown}" style="padding:12px 28px;background:${colors.brown};color:#ffffff !important;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td valign="middle" style="vertical-align:middle;">
                      <a href="${origin}" style="display:inline-block;color:#ffffff !important;text-decoration:none;">
                        <img src="${origin}/logo-wordmark-white.png" width="112" height="50" alt="drw" style="display:block;width:112px;height:50px;border:0;color:#ffffff !important;font:700 22px Arial,Helvetica,sans-serif;">
                      </a>
                    </td>
                    <td align="right" valign="middle" style="vertical-align:middle;text-align:right;">
                      <a href="${origin}" style="color:#f4e9df;font:500 11px/1.5 Arial,Helvetica,sans-serif;letter-spacing:.5px;text-decoration:none;">davidrwijaya.site ↗</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td height="3" bgcolor="${colors.accent}" style="height:3px;background:${colors.accent};font-size:1px;line-height:1px;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:40px 32px 34px;">
                <p style="margin:0 0 17px;color:${colors.accent};font:700 10px/1.4 Arial,Helvetica,sans-serif;letter-spacing:1.7px;text-transform:uppercase;">${eyebrow}</p>
                <h1 style="margin:0 0 18px;color:${colors.brown};font:400 34px/1.2 Georgia,'Times New Roman',serif;letter-spacing:-.5px;">${title}</h1>
                <p style="margin:0 0 30px;color:${colors.muted};font:400 15px/1.7 Arial,Helvetica,sans-serif;">${introduction}</p>
                ${content}
                <p style="margin:0;color:${colors.muted};font:400 14px/1.7 Arial,Helvetica,sans-serif;">${closing}</p>
              </td>
            </tr>
            <tr>
              <td bgcolor="#f5e9da" style="padding:20px 32px;background:#f5e9da;border-top:1px solid ${colors.border};">
                <p style="margin:0 0 5px;color:${colors.brown};font:700 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:1px;">DAVID RIZKY WIJAYA</p>
                <p style="margin:0;color:${colors.muted};font:400 11px/1.6 Arial,Helvetica,sans-serif;">From the <a href="${contactUrl}" style="color:${colors.accent};text-decoration:underline;">portfolio contact page</a> · <a href="${origin}" style="color:${colors.accent};text-decoration:underline;">davidrwijaya.site</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export function ownerNotification(message: ContactMessage, origin: string): ContactEmail {
  const name = escapeHtml(message.name)
  const email = escapeHtml(message.email)
  const subjectName = message.name.replace(/[\r\n]+/g, ' ').trim().slice(0, 60)
  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 28px;border-top:1px solid ${colors.border};border-bottom:1px solid ${colors.border};border-collapse:collapse;">
      <tr>
        <td width="70" style="padding:15px 0 8px;color:${colors.accent};font:700 10px/1.5 Arial,Helvetica,sans-serif;letter-spacing:1.2px;vertical-align:top;">FROM</td>
        <td style="padding:15px 0 8px;color:${colors.ink};font:600 14px/1.5 Arial,Helvetica,sans-serif;word-break:break-word;">${name}</td>
      </tr>
      <tr>
        <td width="70" style="padding:0 0 15px;color:${colors.accent};font:700 10px/1.5 Arial,Helvetica,sans-serif;letter-spacing:1.2px;vertical-align:top;">EMAIL</td>
        <td style="padding:0 0 15px;font:400 14px/1.5 Arial,Helvetica,sans-serif;word-break:break-word;"><a href="mailto:${email}" style="color:${colors.accent};text-decoration:underline;">${email}</a></td>
      </tr>
    </table>
    ${messageBox(message.body, 'Their message')}`

  return {
    subject: `New portfolio message · ${subjectName}`,
    text: `New message from ${message.name} <${message.email}>\n\n${message.body}\n\nReply to this email to respond directly to the sender.\n\n— David Rizky Wijaya · ${origin}/contact`,
    html: emailShell({
      origin,
      preheader: `New portfolio message from ${name}.`,
      eyebrow: 'Portfolio / New message',
      title: 'A new conversation.',
      introduction: 'Someone reached out through your portfolio. Their note is below.',
      content,
      closing: 'Reply to this email to respond directly to the sender.',
    }),
  }
}

export function senderReceipt(message: ContactMessage, origin: string, replyAddress: string): ContactEmail {
  const name = escapeHtml(message.name)
  const replyLink = `mailto:${escapeHtml(replyAddress)}`

  return {
    subject: 'Your message reached David · drw',
    text: `Hi ${message.name},\n\nThank you for reaching out. Your message has arrived, and I'll reply to this email address.\n\nA copy of your message:\n${message.body}\n\nNeed to add something? Reply to this email or write to ${replyAddress}.\n\n— David Rizky Wijaya\n${origin}/contact\n\nIf you didn't send this message, you can ignore this email.`,
    html: emailShell({
      origin,
      preheader: 'Your message has arrived. Here is a copy for your records.',
      eyebrow: 'Portfolio / Message received',
      title: 'Thank you for reaching out.',
      introduction: `Hi ${name}, your message has arrived. I&apos;ll read it and reply to this email address. Here&apos;s a copy for your records.`,
      content: messageBox(message.body, 'Your message'),
      closing: `Need to add something? Simply reply to this email, or <a href="${replyLink}" style="color:${colors.accent};text-decoration:underline;">write to me directly</a>.<br><span style="color:${colors.muted};font-size:12px;">If you didn&apos;t send this message, you can ignore this email.</span>`,
    }),
  }
}
