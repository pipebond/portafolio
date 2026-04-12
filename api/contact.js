const mysql      = require('mysql2/promise');
const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { name, email, service, budget, message } = req.body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Nombre, email y mensaje son requeridos.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email inválido.' });
  }

  try {
    const connection = await mysql.createConnection({
      host:     process.env.DB_HOST,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port:     parseInt(process.env.DB_PORT || '4000'),
      ssl:      { rejectUnauthorized: true },
    });

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS contacts (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(255)  NOT NULL,
        email      VARCHAR(255)  NOT NULL,
        service    VARCHAR(100),
        budget     VARCHAR(50),
        message    TEXT          NOT NULL,
        created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(
      'INSERT INTO contacts (name, email, service, budget, message) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.trim(), service || null, budget || null, message.trim()]
    );

    await connection.end();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from:    `"Portafolio FAC" <${process.env.GMAIL_USER}>`,
      to:      process.env.GMAIL_USER,
      subject: `📬 Nuevo contacto: ${name.trim()}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:24px;border-radius:8px;">
          <h2 style="color:#c9a96e;border-bottom:2px solid #c9a96e;padding-bottom:8px;">
            Nuevo mensaje desde tu portafolio
          </h2>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <tr>
              <td style="padding:8px 0;font-weight:bold;color:#555;width:130px;">Nombre</td>
              <td style="padding:8px 0;color:#111;">${name.trim()}</td>
            </tr>
            <tr style="background:#fff;">
              <td style="padding:8px 0;font-weight:bold;color:#555;">Email</td>
              <td style="padding:8px 0;">
                <a href="mailto:${email.trim()}" style="color:#c9a96e;">${email.trim()}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-weight:bold;color:#555;">Servicio</td>
              <td style="padding:8px 0;color:#111;">${service || '—'}</td>
            </tr>
            <tr style="background:#fff;">
              <td style="padding:8px 0;font-weight:bold;color:#555;">Presupuesto</td>
              <td style="padding:8px 0;color:#111;">${budget || '—'}</td>
            </tr>
          </table>
          <div style="margin-top:20px;background:#fff;padding:16px;border-radius:6px;border-left:4px solid #c9a96e;">
            <p style="font-weight:bold;color:#555;margin:0 0 8px;">Mensaje:</p>
            <p style="color:#111;margin:0;line-height:1.6;">${message.trim().replace(/\n/g, '<br>')}</p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Error en /api/contact:', err.message);
    return res.status(500).json({ error: 'Error interno. Intenta de nuevo.' });
  }
};
