const nodemailer = require('nodemailer');
const env = require('../config/env');

/**
 * ================================================================
 * KONFIGURASI TRANSPORTER NODEMAILER - Gmail SMTP
 * ================================================================
 * 
 * ⚠️  PENTING: Gunakan "Google App Password", BUKAN password email biasa!
 * 
 * Cara mendapatkan Google App Password:
 * 1. Buka https://myaccount.google.com/security
 * 2. Aktifkan "2-Step Verification" terlebih dahulu
 * 3. Buka https://myaccount.google.com/apppasswords
 * 4. Buat App Password baru (pilih nama bebas, misal "SEAPEDIA")
 * 5. Google akan memberikan password 16 karakter (contoh: "abcd efgh ijkl mnop")
 * 6. Masukkan password tersebut ke SMTP_PASS di file .env
 * 
 * ⚠️  JANGAN gunakan password login Gmail biasa — akan ditolak oleh Google!
 * ================================================================
 */
const transporter = nodemailer.createTransport({
  service: 'gmail', // Menggunakan service Gmail (otomatis set host & port)
  auth: {
    user: env.SMTP_USER,  // Email Gmail Anda (contoh: user@gmail.com)
    pass: env.SMTP_PASS,  // Google App Password (BUKAN password biasa!)
  },
});

// Verifikasi koneksi SMTP saat startup
transporter.verify()
  .then(() => console.log('✅ SMTP transporter ready'))
  .catch((err) => console.error('❌ SMTP transporter error:', err.message));

/**
 * Mengirim email berisi kode OTP verifikasi.
 * @param {string} toEmail - Alamat email tujuan
 * @param {string} otpCode - Kode OTP 6 digit
 */
const sendVerificationEmail = async (toEmail, otpCode) => {
  const mailOptions = {
    from: `"SEAPEDIA" <${env.SMTP_USER}>`,
    to: toEmail,
    subject: '🔐 Verifikasi Email - SEAPEDIA',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #0ea5e9, #6366f1); padding: 32px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">SEAPEDIA</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Southeast Asia E-commerce Platform</p>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="color: #1e293b; margin: 0 0 12px; font-size: 20px;">Verifikasi Email Anda</h2>
          <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
            Terima kasih telah mendaftar di SEAPEDIA! Gunakan kode OTP di bawah ini untuk memverifikasi alamat email Anda. Kode ini berlaku selama <strong>24 jam</strong>.
          </p>
          <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 24px;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #0f172a;">${otpCode}</span>
          </div>
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            Jika Anda tidak merasa mendaftar di SEAPEDIA, abaikan email ini.
          </p>
        </div>
        <div style="background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} SEAPEDIA. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };
