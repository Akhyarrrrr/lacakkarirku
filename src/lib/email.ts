type EmailInput = { to: string; subject: string; html: string }

export async function sendEmail(input: EmailInput) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || 'LacakKarirku <lacakkarirku@notify.akhyar.dev>'
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured')
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, ...input }),
  })
  if (!response.ok) throw new Error(`Email delivery failed (${response.status})`)
}
