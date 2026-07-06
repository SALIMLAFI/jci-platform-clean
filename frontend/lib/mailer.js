import nodemailer from 'nodemailer';

function getMailerConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || user;

  if (!host || !user || !pass || !from) {
    return null;
  }

  return {
    host,
    port,
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465,
    auth: { user, pass },
    from,
  };
}

function createTransport() {
  const config = getMailerConfig();
  if (!config) {
    return null;
  }

  const { from, ...transportOptions } = config;
  const transporter = nodemailer.createTransport(transportOptions);
  return { transporter, from };
}

export async function sendPasswordEmail({ to, subject, html, text }) {
  // Prefer Resend when API key is provided (compatible with Vercel env var requirement)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: [to],
          subject,
          html,
          text,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const message = result?.message || result?.error || 'Resend API error';
        throw new Error(message);
      }

      return result;
    } catch (err) {
      console.error('[Mailer] Resend send error:', err);
      throw err;
    }
  }

  const mailer = createTransport();

  if (!mailer) {
    console.log('[Mailer] SMTP not configured. Email preview:', { to, subject, text });
    return { mocked: true };
  }

  return mailer.transporter.sendMail({
    from: mailer.from,
    to,
    subject,
    text,
    html,
  });
}

export function buildPasswordEmail({ name, resetUrl, googleLinked }) {
  const isGoogleLinked = Boolean(googleLinked);
  const subject = isGoogleLinked
    ? 'JCI Ledger - Création de votre mot de passe'
    : 'JCI Ledger - Réinitialisation de votre mot de passe';
  const title = isGoogleLinked
    ? 'Créez votre mot de passe local'
    : 'Réinitialisez votre mot de passe';
  const intro = isGoogleLinked
    ? 'Ce compte est lié à Google. Créez maintenant un mot de passe local pour accéder à JCI Ledger avec votre email et votre mot de passe.'
    : 'Vous avez demandé la réinitialisation de votre mot de passe JCI Ledger. Le lien ci-dessous vous permet de définir un nouveau mot de passe.';

  return {
    subject,
    text: `${title}\n\nBonjour ${name || ''},\n\n${intro}\n\nLien sécurisé : ${resetUrl}\n\nSi vous n\'êtes pas à l\'origine de cette demande, vous pouvez ignorer ce message.`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#f7f9fc;padding:24px;color:#0f172a">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px;border:1px solid #e2e8f0">
          <p style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#1f4789;font-weight:700;margin:0 0 12px">JCI Ledger</p>
          <h1 style="font-size:28px;line-height:1.2;margin:0 0 16px;color:#0f172a">${title}</h1>
          <p style="font-size:16px;line-height:1.7;color:#334155;margin:0 0 24px">Bonjour ${name || ''},</p>
          <p style="font-size:16px;line-height:1.7;color:#334155;margin:0 0 28px">${intro}</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${resetUrl}" style="display:inline-block;background:#1f4789;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:14px">Ouvrir la page sécurisée</a>
          </div>
          <p style="font-size:13px;line-height:1.6;color:#64748b;margin:0 0 8px">Ce lien expire automatiquement après une durée limitée pour protéger votre compte.</p>
          <p style="font-size:13px;line-height:1.6;color:#64748b;margin:0">Si vous n\'êtes pas à l\'origine de cette demande, ignorez simplement cet email.</p>
        </div>
      </div>
    `,
  };
}