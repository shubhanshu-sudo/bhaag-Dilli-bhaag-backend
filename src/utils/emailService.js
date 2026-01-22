const nodemailer = require('nodemailer');

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
    return nodemailer.createTransporter({
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

        // Email content
        const mailOptions = {
            from: `"Bhaag Dilli Bhaag" <${process.env.SMTP_USER}>`,
            to: registration.email,
            subject: 'Bhaag Dilli Bhaag – Registration Confirmed ✅',
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
        }
        .success-badge {
            background: #10b981;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            display: inline-block;
            font-weight: bold;
            margin: 20px 0;
        }
        .details-box {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            color: #6b7280;
            font-weight: 500;
        }
        .detail-value {
            color: #111827;
            font-weight: 600;
        }
        .amount {
            font-size: 24px;
            color: #1e3a8a;
            font-weight: bold;
        }
        .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 10px 10px;
            border: 1px solid #e5e7eb;
            border-top: none;
            font-size: 14px;
            color: #6b7280;
        }
        .button {
            background: #eab308;
            color: #1e3a8a;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 25px;
            display: inline-block;
            font-weight: bold;
            margin: 20px 0;
        }
        .info-box {
            background: #dbeafe;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏃‍♂️ Bhaag Dilli Bhaag</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Registration Confirmed!</p>
    </div>

    <div class="content">
        <div style="text-align: center;">
            <div class="success-badge">✅ Payment Successful</div>
        </div>

        <p>Dear <strong>${registration.name}</strong>,</p>

        <p>Congratulations! Your registration for <strong>Bhaag Dilli Bhaag</strong> has been confirmed. We're excited to see you at the race!</p>

        <div class="details-box">
            <h3 style="margin-top: 0; color: #1e3a8a;">Registration Details</h3>
            
            <div class="detail-row">
                <span class="detail-label">Registration ID</span>
                <span class="detail-value">${registration._id}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Name</span>
                <span class="detail-value">${registration.name}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Email</span>
                <span class="detail-value">${registration.email}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Phone</span>
                <span class="detail-value">${registration.phone}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Race Category</span>
                <span class="detail-value">${registration.race}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">T-Shirt Size</span>
                <span class="detail-value">${registration.tshirtSize}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Amount Paid</span>
                <span class="amount">₹${registration.amount}</span>
            </div>
        </div>

        <div class="info-box">
            <strong>📄 Invoice Attached</strong><br>
            Your payment invoice is attached to this email for your records.
        </div>

        <div class="info-box">
            <strong>📧 What's Next?</strong><br>
            • You will receive race kit details closer to the event date<br>
            • Keep your Registration ID safe for future reference<br>
            • Check your email for event updates
        </div>

        <p style="margin-top: 30px;">If you have any questions, feel free to reach out to us at <a href="mailto:info@bhaagdillibhaag.in">info@bhaagdillibhaag.in</a></p>

        <p>See you at the race! 🏃‍♂️💨</p>

        <p style="margin-top: 30px;">
            <strong>Team Bhaag Dilli Bhaag</strong>
        </p>
    </div>

    <div class="footer">
        <p style="margin: 0;">This is an automated confirmation email.</p>
        <p style="margin: 5px 0;">© 2026 Bhaag Dilli Bhaag. All rights reserved.</p>
        <p style="margin: 5px 0;">
            <a href="mailto:info@bhaagdillibhaag.in" style="color: #3b82f6;">Support</a> | 
            <a href="#" style="color: #3b82f6;">Privacy Policy</a>
        </p>
    </div>
</body>
</html>
            `,
            attachments: [
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
