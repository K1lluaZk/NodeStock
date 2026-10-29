import nodemailer from 'nodemailer'

let transporter

const getMailConfiguration = () => {
  const requiredValues = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'APP_URL']
  const missingValues = requiredValues.filter(name => !process.env[name]?.trim())

  if (missingValues.length > 0) {
    throw new Error(`Falta configurar: ${missingValues.join(', ')}`)
  }

  const port = Number(process.env.SMTP_PORT || 587)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('SMTP_PORT debe ser un puerto válido')
  }

  const secureValue = process.env.SMTP_SECURE
  if (secureValue && secureValue !== 'true' && secureValue !== 'false') {
    throw new Error('SMTP_SECURE debe ser true o false')
  }

  const appUrl = new URL(process.env.APP_URL)
  const isLocalhost = ['localhost', '127.0.0.1'].includes(appUrl.hostname)
  if (appUrl.protocol !== 'https:' && !(isLocalhost && appUrl.protocol === 'http:')) {
    throw new Error('APP_URL debe usar HTTPS, excepto en localhost')
  }

  return {
    host: process.env.SMTP_HOST.trim(),
    port,
    secure: secureValue ? secureValue === 'true' : port === 465,
    user: process.env.SMTP_USER.trim(),
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM?.trim() || process.env.SMTP_USER.trim(),
    appUrl
  }
}

export const validatePasswordResetMailConfiguration = () => {
  getMailConfiguration()
}

export const sendPasswordResetEmail = async ({ to, token }) => {
  const configuration = getMailConfiguration()
  transporter ??= nodemailer.createTransport({
    host: configuration.host,
    port: configuration.port,
    secure: configuration.secure,
    auth: {
      user: configuration.user,
      pass: configuration.pass
    }
  })

  const resetUrl = new URL('/reset-password', configuration.appUrl)
  resetUrl.searchParams.set('token', token)

  await transporter.sendMail({
    from: configuration.from,
    to,
    subject: 'Restablece tu contraseña de NodeStock',
    text: `Usa este enlace para crear una nueva contraseña. El enlace vence en una hora: ${resetUrl.href}`,
    html: `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; color: #333333; line-height: 1.6;">

      <p style="font-size: 16px; margin-bottom: 20px;">
        Recibimos una solicitud para restablecer la contraseña de tu cuenta de
        <strong>NodeStock</strong>.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a
          href="${resetUrl.href}"
          style="
            display: inline-block;
            background: #4F46E5;
            color: #FFFFFF;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
          "
        >
          🔑 Crear nueva contraseña
        </a>
      </div>

      <div
        style="
          background: #F8F9FA;
          border-left: 4px solid #4F46E5;
          padding: 16px;
          border-radius: 6px;
          font-size: 14px;
          color: #555555;
        "
      >
        ⏰ <strong>Importante:</strong> Este enlace vencerá en <strong>1 hora</strong>.

        <br><br>

        Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
      </div>

      <p style="margin-top: 30px; font-size: 13px; color: #888888; text-align: center;">
        © ${new Date().getFullYear()} NodeStock. Todos los derechos reservados.
      </p>

    </div>
  `
  })
}
