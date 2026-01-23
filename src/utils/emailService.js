const nodemailer = require('nodemailer');
const path = require('path');

/**
 * Email Service for Bhaag Dilli Bhaag
 * 
 * Handles all email communications including:
 * - Registration confirmations
 * - Payment confirmations
 * - Invoice delivery
 */

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

/**
 * Send registration confirmation email with invoice
 * 
 * @param {Object} registration - Registration document from database
 * @param {Buffer} invoicePDF - PDF invoice buffer
 * @returns {Promise<Object>} Email send result
 */
const sendRegistrationConfirmation = async (registration, invoicePDF) => {
    try {
        const transporter = createTransporter();
        const logoPath = path.join(process.cwd(), '..', 'my-app', 'public', 'Untitled-1-01.webp');

        // Email content
        const mailOptions = {
            from: `"Bhaag Dilli Bhaag" <${process.env.SMTP_USER}>`,
            to: registration.email,
            subject: 'Bhaag Dilli Bhaag – Registration Confirmed ✅',
            html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registration Confirmed - Bhaag Dilli Bhaag</title>
    <style>
        body { margin: 0; padding: 0; background-color: #f7f9fc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f7f9fc; padding-bottom: 20px; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); overflow: hidden; }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 50px 20px; text-align: center; color: #ffffff; }
        .header img { max-height: 85px; width: auto; margin-bottom: 20px; }
        .status-badge { background-color: rgba(255,255,255,0.2); padding: 5px 15px; border-radius: 50px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; display: inline-block; margin-bottom: 15px; border: 1px solid rgba(255,255,255,0.3); }
        .content { padding: 40px 30px; text-align: center; }
        .welcome-title { font-size: 28px; font-weight: 900; color: #1e3a8a; margin: 0 0 10px 0; font-style: italic; }
        .welcome-desc { font-size: 16px; color: #64748b; line-height: 1.6; margin-bottom: 40px; }
        .ticket-card { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; position: relative; overflow: hidden; margin-bottom: 40px; text-align: left; }
        .ticket-header { background-color: #f8fafc; padding: 20px 25px; border-bottom: 1px dashed #e2e8f0; }
        .ticket-header h3 { margin: 0; font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; }
        .ticket-body { padding: 25px; }
        .info-row { margin-bottom: 18px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; }
        .info-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .info-label { display: block; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .info-value { display: block; font-size: 16px; font-weight: 700; color: #1e293b; }
        .race-badge { display: inline-block; background-color: #1e3a8a; color: #ffffff; padding: 4px 12px; border-radius: 6px; font-size: 14px; margin-top: 5px; }
        .payment-summary { margin-top: 20px; padding: 20px; background-color: #eff6ff; border-radius: 12px; }
        .pay-table { width: 100%; border-collapse: collapse; }
        .pay-label { font-size: 16px; font-weight: 700; color: #1e3a8a; text-align: left; }
        .pay-value { font-size: 24px; font-weight: 900; color: #1e3a8a; text-align: right; }
        .next-steps { text-align: left; background-color: #f8fafc; padding: 25px; border-radius: 16px; margin-top: 30px; }
        .step-item { display: table; width: 100%; margin-bottom: 15px; }
        .step-icon { display: table-cell; width: 30px; vertical-align: top; font-size: 20px; }
        .step-text { display: table-cell; padding-left: 15px; font-size: 14px; color: #475569; line-height: 1.5; font-weight: 500; }
        .cta-btn { display: inline-block; background-color: #1e3a8a; color: #ffffff !important; padding: 16px 40px; border-radius: 50px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 1px; font-size: 14px; margin: 30px 0; box-shadow: 0 4px 15px rgba(30,58,138,0.2); }
        .footer { padding: 40px 20px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.6; }
        .footer a { color: #3b82f6; text-decoration: none; font-weight: 700; }

        @media (max-width: 480px) {
            .container { border-radius: 0; }
            .content { padding: 30px 20px; }
            .welcome-title { font-size: 24px; }
            .info-value { font-size: 15px; }
            .pay-value { font-size: 20px; }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <center>
            <div class="container">
                <div class="header">
                    <div class="status-badge">Payment Success</div>
                    <div><img src="cid:eventlogo" alt="Bhaag Dilli Bhaag Logo"></div>
                    <p style="font-weight: 700; letter-spacing: 1px; margin-top: 5px;">OFFICIAL CONFIRMATION</p>
                </div>

                <div class="content">
                    <h2 class="welcome-title">WELCOME TO THE FOLD!</h2>
                    <div class="welcome-desc">
                        Hi ${registration.name}, your registration for <strong>Bhaag Dilli Bhaag 2026</strong> is confirmed. You are officially part of this movement!
                    </div>

                    <div class="ticket-card">
                        <div class="ticket-header">
                            <h3>Registration Details</h3>
                        </div>
                        <div class="ticket-body">
                            <div class="info-row">
                                <span class="info-label">REGISTRATION ID</span>
                                <span class="info-value" style="font-family: monospace;">#${registration._id}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">PARTICIPANT NAME</span>
                                <span class="info-value">${registration.name}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">RACE CATEGORY</span>
                                <div><span class="race-badge">${registration.race}</span></div>
                            </div>
                            <div class="info-row">
                                <span class="info-label">T-SHIRT SIZE</span>
                                <span class="info-value">${registration.tshirtSize}</span>
                            </div>

                            <div class="payment-summary">
                                <table class="pay-table">
                                    <tr>
                                        <td class="pay-label">Total Amount Paid</td>
                                        <td class="pay-value">₹${registration.amount}</td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div class="next-steps">
                        <div class="step-item">
                            <div class="step-icon">📧</div>
                            <div class="step-text">We've attached your <strong>Official Invoice</strong> as a PDF to this email.</div>
                        </div>
                        <div class="step-item">
                            <div class="step-icon">🎽</div>
                            <div class="step-text"><strong>Race Kit collection</strong> (BIB & T-shirt) info will be sent 10 days before the event.</div>
                        </div>
                        <div class="step-item" style="margin-bottom: 0;">
                            <div class="step-icon">📍</div>
                            <div class="step-text">See you at <strong>Japanese Park, Rohini</strong> on 1st March 2026.</div>
                        </div>
                    </div>

                    <a href="mailto:info@bhaagdillibhaag.in" class="cta-btn">Contact Support</a>
                    
                    <div style="font-size: 14px; color: #94a3b8; font-weight: 500;">
                        Questions? Reply directly to this email or visit our website.
                    </div>
                </div>

                <div class="footer">
                    <div><strong>Bhaag Dilli Bhaag 2026</strong></div>
                    <div>Run with heart. Run for education.</div>
                    <div style="margin-top: 20px;">
                        <a href="https://bhaag-dilli-bhaag-8bd2.vercel.app">Official Website</a> &nbsp; | &nbsp; <a href="mailto:info@bhaagdillibhaag.in">Support</a>
                    </div>
                    <div style="margin-top: 20px; font-size: 10px; opacity: 0.6;">
                        &copy; 2026 Bhaag Dilli Bhaag by Round Table India. All rights reserved.
                    </div>
                </div>
            </div>
        </center>
    </div>
</body>
</html>
            `,
            attachments: [
                {
                    filename: 'logo.webp',
                    path: logoPath,
                    cid: 'eventlogo' // same cid value as in the html img src
                },
                {
                    filename: `Invoice_${registration._id}.pdf`,
                    content: invoicePDF,
                    contentType: 'application/pdf'
                }
            ]
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        console.log('✅ Email sent successfully:', info.messageId);
        return {
            success: true,
            messageId: info.messageId
        };

    } catch (error) {
        console.error('❌ Error sending email:', error);
        throw error;
    }
};

/**
 * Verify email configuration
 */
const verifyEmailConfig = async () => {
    try {
        const transporter = createTransporter();
        await transporter.verify();
        console.log('✅ Email server is ready');
        return true;
    } catch (error) {
        console.error('❌ Email server error:', error);
        return false;
    }
};

module.exports = {
    sendRegistrationConfirmation,
    verifyEmailConfig
};
