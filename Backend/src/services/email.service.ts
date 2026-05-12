import nodemailer from "nodemailer";

/**
 * [SERVICE] Email Service
 * -----------------------
 * Handles sending transactional emails (Verification, Welcome, Alerts).
 * Consistently styled with the Smart Sukuk premium UI.
 */

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export class EmailService {
    /**
     * Sends a verification email to a new user.
     * @param email Recipient email
     * @param name Recipient name
     * @param token Verification token
     */
    static async sendVerificationEmail(email: string, name: string, token: string) {
        const verificationLink = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background-color: #F8FAFC; }
                .wrapper { width: 100%; background-color: #F8FAFC; padding: 40px 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 0 20px; }
                .logo-container { text-align: center; margin-bottom: 40px; }
                .card { background-color: #FFFFFF; border-radius: 16px; padding: 40px; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
                h1 { font-family: 'Inter', Arial, sans-serif; font-size: 24px; font-weight: 700; color: #0B213B; margin-top: 0; margin-bottom: 24px; }
                p { font-family: 'Inter', Arial, sans-serif; font-size: 16px; line-height: 26px; color: #475569; margin-top: 0; margin-bottom: 32px; }
                .btn { display: inline-block; font-family: 'Inter', Arial, sans-serif; background-color: #0B213B; color: #FFFFFF !important; text-decoration: none; padding: 16px 32px; border-radius: 10px; font-weight: 600; font-size: 16px; text-align: center; }
                .footer { font-family: 'Inter', Arial, sans-serif; text-align: center; margin-top: 40px; font-size: 14px; color: #94A3B8; }
                .divider { height: 1px; background-color: #E2E8F0; margin: 32px 0; }
                .accent { color: #D6B230; font-weight: 600; }
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="container">
                    <div class="logo-container">
                        <a href="${process.env.FRONTEND_URL}" style="text-decoration: none; display: inline-block;">
                            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="padding-right: 12px; vertical-align: middle;">
                                        <img src="https://api.iconify.design/lucide:shield.svg?color=%23D6B230" width="32" height="32" alt="Shield" style="display: block; border: 0;" />
                                    </td>
                                    <td style="font-family: 'Inter', Arial, sans-serif; font-size: 28px; font-weight: 800; color: #0B213B; letter-spacing: -1px; vertical-align: middle;">
                                        Smart Sukuk
                                    </td>
                                </tr>
                            </table>
                        </a>
                    </div>
                    <div class="card">
                        <h1>Verify Your Email</h1>
                        <p>Hello <span class="accent">${name}</span>,</p>
                        <p>Welcome to Smart Sukuk! We're excited to have you join our platform. To get started and secure your account, please verify your email address by clicking the button below.</p>
                        <div style="text-align: center;">
                            <a href="${verificationLink}" class="btn">Verify Account</a>
                        </div>
                        <div class="divider"></div>
                        <p style="font-size: 14px; color: #64748B; margin-bottom: 0;">If the button above doesn't work, copy and paste this link into your browser:<br>
                        <span style="color: #0B213B; word-break: break-all;">${verificationLink}</span></p>
                    </div>
                    <div class="footer">
                        &copy; 2026 Smart Sukuk. All rights reserved.<br>
                        Secure Real Estate Tokenization Platform.
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        await transporter.sendMail({
            from: '"Smart Sukuk" <${process.env.EMAIL_USER}>',
            to: email,
            subject: "Verify Your Smart Sukuk Account",
            html: htmlContent,
        });
    }

    /**
     * Sends a welcome email after successful verification.
     */
    static async sendWelcomeEmail(email: string, name: string) {
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background-color: #F8FAFC; }
                .wrapper { width: 100%; background-color: #F8FAFC; padding: 40px 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 0 20px; }
                .logo-container { text-align: center; margin-bottom: 40px; }
                .card { background-color: #FFFFFF; border-radius: 16px; padding: 40px; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
                h1 { font-family: 'Inter', Arial, sans-serif; font-size: 24px; font-weight: 700; color: #0B213B; margin-top: 0; margin-bottom: 24px; }
                p { font-family: 'Inter', Arial, sans-serif; font-size: 16px; line-height: 26px; color: #475569; margin-top: 0; margin-bottom: 32px; }
                .btn { display: inline-block; font-family: 'Inter', Arial, sans-serif; background-color: #0B213B; color: #FFFFFF !important; text-decoration: none; padding: 16px 32px; border-radius: 10px; font-weight: 600; font-size: 16px; text-align: center; }
                .footer { font-family: 'Inter', Arial, sans-serif; text-align: center; margin-top: 40px; font-size: 14px; color: #94A3B8; }
                .accent { color: #D6B230; font-weight: 600; }
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="container">
                    <div class="logo-container">
                        <a href="${process.env.FRONTEND_URL}" style="text-decoration: none; display: inline-block;">
                            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="padding-right: 12px; vertical-align: middle;">
                                        <img src="https://api.iconify.design/lucide:shield.svg?color=%23D6B230" width="32" height="32" alt="Shield" style="display: block; border: 0;" />
                                    </td>
                                    <td style="font-family: 'Inter', Arial, sans-serif; font-size: 28px; font-weight: 800; color: #0B213B; letter-spacing: -1px; vertical-align: middle;">
                                        Smart Sukuk
                                    </td>
                                </tr>
                            </table>
                        </a>
                    </div>
                    <div class="card">
                        <h1>Your Account is Verified!</h1>
                        <p>Hello <span class="accent">${name}</span>,</p>
                        <p>Great news! Your email has been successfully verified. You now have full access to browse properties, invest in fractional real-estate tokens, and manage your portfolio.</p>
                        <div style="text-align: center;">
                            <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">Explore Marketplace</a>
                        </div>
                    </div>
                    <div class="footer">
                        &copy; 2026 Smart Sukuk. All rights reserved.<br>
                        Secure Real Estate Tokenization Platform.
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        await transporter.sendMail({
            from: '"Smart Sukuk" <${process.env.EMAIL_USER}>',
            to: email,
            subject: "Welcome to Smart Sukuk!",
            html: htmlContent,
        });
    }

    /**
     * Sends a contact us message to the support team.
     */
    static async sendContactEmail(name: string, email: string, phone: string, message: string) {
        const supportEmail = "smartsukuk50@gmail.com";
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 20px; background-color: #F8FAFC; }
                .card { background-color: #FFFFFF; border-radius: 8px; padding: 30px; border: 1px solid #E2E8F0; }
                h2 { margin-top: 0; color: #0B213B; }
                p { margin: 10px 0; color: #475569; }
                .label { font-weight: bold; color: #0B213B; }
                .message-box { background-color: #F1F5F9; padding: 15px; border-radius: 6px; margin-top: 20px; white-space: pre-wrap; }
            </style>
        </head>
        <body>
            <div class="card">
                <h2>New Contact Form Submission</h2>
                <p><span class="label">Name:</span> ${name}</p>
                <p><span class="label">Email:</span> ${email}</p>
                <p><span class="label">Phone:</span> ${phone || 'Not provided'}</p>
                
                <p class="label" style="margin-top: 25px;">Message:</p>
                <div class="message-box">${message}</div>
            </div>
        </body>
        </html>
        `;

        await transporter.sendMail({
            from: '"Smart Sukuk Contact Form" <${process.env.EMAIL_USER}>',
            to: supportEmail,
            replyTo: email,
            subject: "New Contact Inquiry from " + name,
            html: htmlContent,
        });
    }
}
