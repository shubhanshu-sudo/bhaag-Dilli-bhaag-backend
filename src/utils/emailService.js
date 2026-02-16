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

// Create reusable transporter (Singleton with pooling for production)
// Using 'service: gmail' is often more reliable on Render
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // Production settings for clouds
    pool: true,
    maxConnections: 3,
    connectionTimeout: 60000, // Increased to 60 seconds
    greetingTimeout: 60000,
    socketTimeout: 60000,
    debug: true,
    logger: true,
    tls: {
        rejectUnauthorized: false
    }
});

// Verify connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ SMTP Connection Error Details (Render):', error);
        console.log('💡 Tip: Check if Render IP is blocked by Gmail or if App Password is correct.');
    } else {
        console.log('🚀 SMTP Server via Gmail Service is ready');
    }
});

/**
 * Send registration confirmation email with invoice
 * 
 * @param {Object} registration - Registration document from database
 * @param {Buffer} invoicePDF - PDF invoice buffer
 * @returns {Promise<Object>} Email send result
 */
const sendRegistrationConfirmation = async (registration, invoicePDF) => {
    try {
        const logoPath = path.join(process.cwd(), '..', 'bhaag_Dilli_bhaag', 'public', 'Untitled-1-01.webp');

        // Read amounts from database - use stored values, don't calculate
        const baseAmount = registration.baseAmount || registration.amount || 0;
        const chargedAmount = registration.chargedAmount || registration.amount || 0;
        const gatewayFee = chargedAmount - baseAmount;
        const showBreakdown = gatewayFee > 0;

        // Format payment date
        const paymentDate = registration.paymentDate
            ? new Date(registration.paymentDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            : 'N/A';

        // Email content
        const mailOptions = {
            from: `"Bhaag Dilli Bhaag" <${process.env.SMTP_USER}>`,
            to: registration.email,
            subject: 'Payment Successful – Bhaag Dilli Bhaag Registration Confirmed',
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
        .status-badge { background-color: rgba(34, 197, 94, 0.3); padding: 5px 15px; border-radius: 50px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; display: inline-block; margin-bottom: 15px; border: 1px solid rgba(34, 197, 94, 0.5); color: #bbf7d0; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; font-weight: 700; color: #1e3a8a; margin: 0 0 20px 0; }
        .message-text { font-size: 15px; color: #475569; line-height: 1.7; margin-bottom: 30px; }
        .section-card { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; margin-bottom: 25px; }
        .section-header { background-color: #f8fafc; padding: 15px 20px; border-bottom: 1px solid #e2e8f0; }
        .section-header h3 { margin: 0; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 2px; }
        .section-body { padding: 20px; }
        .breakdown-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
        .breakdown-row:last-child { border-bottom: none; }
        .breakdown-row.total { border-top: 2px dashed #cbd5e1; margin-top: 5px; padding-top: 15px; }
        .breakdown-label { font-size: 14px; color: #475569; font-weight: 500; }
        .breakdown-value { font-size: 14px; color: #1e293b; font-weight: 700; }
        .breakdown-row.total .breakdown-label { font-size: 15px; color: #1e3a8a; font-weight: 700; }
        .breakdown-row.total .breakdown-value { font-size: 18px; color: #1e3a8a; font-weight: 900; }
        .info-row { margin-bottom: 12px; }
        .info-label { display: block; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .info-value { display: block; font-size: 14px; font-weight: 600; color: #1e293b; font-family: monospace; }
        .invoice-note { background-color: #eff6ff; padding: 15px 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #3b82f6; }
        .invoice-note p { margin: 0; font-size: 14px; color: #1e40af; font-weight: 500; }
        .closing-text { font-size: 14px; color: #64748b; line-height: 1.6; margin-top: 25px; }
        .closing-text a { color: #3b82f6; text-decoration: none; font-weight: 600; }
        .footer { padding: 30px 20px; text-align: center; background-color: #f8fafc; color: #94a3b8; font-size: 12px; line-height: 1.6; }
        .footer a { color: #3b82f6; text-decoration: none; font-weight: 700; }

        @media (max-width: 480px) {
            .container { border-radius: 0; }
            .content { padding: 30px 20px; }
            .greeting { font-size: 16px; }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <center>
            <div class="container">
                <div class="header">
                    <div class="status-badge">✓ Payment Successful</div>
                    <div><img src="cid:eventlogo" alt="Bhaag Dilli Bhaag Logo"></div>
                </div>

                <div class="content">
                    <h2 class="greeting">Hi ${registration.name},</h2>
                    
                    <p class="message-text">
                        Thank you for registering for the <strong>Bhaag Dilli Bhaag Running Event</strong>.<br>
                        Your payment has been successfully received and your registration is confirmed.
                    </p>

                    <!-- Payment Summary -->
                    <div class="section-card">
                        <div class="section-header">
                            <h3>Payment Summary</h3>
                        </div>
                        <div class="section-body">
                            ${showBreakdown ? `
                            <div class="breakdown-row">
                                <span class="breakdown-label">Registration Fee</span>
                                <span class="breakdown-value">₹${Math.round(baseAmount)}</span>
                            </div>
                            <div class="breakdown-row">
                                <span class="breakdown-label">Payment Gateway Charges</span>
                                <span class="breakdown-value">₹${Math.round(gatewayFee)}</span>
                            </div>
                            ` : ''}
                            <div class="breakdown-row total">
                                <span class="breakdown-label">Total Amount Paid</span>
                                <span class="breakdown-value">₹${Math.round(chargedAmount)}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Reference -->
                    <div class="section-card">
                        <div class="section-header">
                            <h3>Payment Reference</h3>
                        </div>
                        <div class="section-body">
                            <div class="info-row">
                                <span class="info-label">Payment ID</span>
                                <span class="info-value">${registration.razorpayPaymentId || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Order ID</span>
                                <span class="info-value">${registration.razorpayOrderId || 'N/A'}</span>
                            </div>
                            <div class="info-row" style="margin-bottom: 0;">
                                <span class="info-label">Payment Date</span>
                                <span class="info-value" style="font-family: inherit;">${paymentDate}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Invoice Note -->
                    <div class="invoice-note">
                        <p>📎 Your invoice is attached with this email for your reference.</p>
                    </div>

                    <!-- Closing -->
                    <p class="closing-text">
                        We look forward to seeing you at the event.<br>
                        For any queries, feel free to contact us at <a href="mailto:info@bhaagdillibhaag.in">info@bhaagdillibhaag.in</a>
                    </p>
                </div>

                <div class="footer">
                    <div><strong>Bhaag Dilli Bhaag 2026</strong></div>
                    <div style="margin-top: 8px; font-size: 13px; color: #1e3a8a; font-weight: 700;">1st March 2026 | Sector-10, Rohini</div>
                    
                    <!-- Contact Info -->
                    <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                         <div style="margin-bottom: 10px;">
                            <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Contact Us</span>
                         </div>
                         <div style="font-size: 14px; color: #1e293b; font-weight: 600; margin-bottom: 5px;">
                            📞 <a href="tel:9311593910" style="color: #1e3a8a; text-decoration: none;">+91 9599218680</a>
                         </div>
                         <div style="font-size: 14px; color: #1e293b; font-weight: 600;">
                            ✉️ <a href="mailto:info@bhaagdillibhaag.in" style="color: #1e3a8a; text-decoration: none;">info@bhaagdillibhaag.in</a>
                         </div>
                    </div>

                    <!-- Social Links -->
                    <div style="margin-top: 20px;">
                        <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 10px;">Follow Our Journey</span>
                        <a href="https://www.instagram.com/bhaagdillibhaag/" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                           <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/32px-Instagram_logo_2016.svg.png" width="24" height="24" alt="Instagram">
                        </a>
                        <a href="https://www.facebook.com/profile.php?id=61587329426324" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                           <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/32px-Facebook_Logo_%282019%29.png" width="24" height="24" alt="Facebook">
                        </a>
                        <a href="https://www.youtube.com/@BhaagDilliBhaag" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                           <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/32px-YouTube_full-color_icon_%282017%29.svg.png" width="24" height="24" alt="YouTube">
                        </a>
                    </div>

                    <div style="margin-top: 25px; font-size: 11px; color: #64748b;">
                        <a href="https://bhaagdillibhaag.in" style="color: #3b82f6; text-decoration: none; font-weight: 700;">Official Website</a>
                    </div>
                    <div style="margin-top: 15px; font-size: 10px; opacity: 0.6;">
                        &copy; 2026 Bhaag Dilli Bhaag. All rights reserved.
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
                    filename: 'Untitled-1-01.webp',
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
