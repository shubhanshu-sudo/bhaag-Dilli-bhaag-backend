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
        /* Base Styles */
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f4f7fa;
            color: #1a202c;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper {
            width: 100%;
            table-layout: fixed;
            background-color: #f4f7fa;
            padding-bottom: 40px;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        /* Header */
        .header {
            background-color: #1e3a8af2; /* blue-900 with transparency */
            background-image: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            padding: 40px 20px;
            text-align: center;
            color: #ffffff;
        }
        .header img {
            max-height: 80px;
            width: auto;
            margin-bottom: 10px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.025em;
            text-transform: uppercase;
        }
        .header p {
            margin: 8px 0 0;
            font-size: 14px;
            opacity: 0.9;
        }
        /* Content */
        .content {
            padding: 32px 24px;
        }
        .welcome-text {
            text-align: center;
            margin-bottom: 32px;
        }
        .welcome-text h2 {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 8px;
            color: #1e3a8a;
        }
        .welcome-text p {
            font-size: 16px;
            color: #4a5568;
            line-height: 1.6;
            margin: 0;
        }
        /* Details Card */
        .details-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 32px;
        }
        .details-card h3 {
            font-size: 14px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin: 0 0 16px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 15px;
        }
        .detail-label {
            color: #64748b;
            flex-shrink: 0;
        }
        .detail-value {
            color: #0f172a;
            font-weight: 600;
            text-align: right;
            padding-left: 20px;
        }
        .amount-row {
            margin-top: 20px;
            padding-top: 16px;
            border-top: 2px dashed #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .amount-label {
            font-size: 18px;
            font-weight: 700;
            color: #1e3a8a;
        }
        .amount-value {
            font-size: 28px;
            font-weight: 800;
            color: #1e3a8a;
        }
        /* Info Boxes */
        .info-section {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        .info-box {
            background-color: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 16px;
            border-radius: 8px;
        }
        .info-box strong {
            display: block;
            color: #1e40af;
            margin-bottom: 4px;
            font-size: 15px;
        }
        .info-box p {
            margin: 0;
            font-size: 14px;
            line-height: 1.5;
            color: #1e3a8a;
        }
        /* Footer */
        .footer {
            padding: 32px 24px;
            text-align: center;
            background-color: #f8fafc;
            color: #94a3b8;
        }
        .footer p {
            font-size: 13px;
            margin: 4px 0;
        }
        .footer a {
            color: #3b82f6;
            text-decoration: none;
            font-weight: 600;
        }
        /* Mobile Overrides */
        @media screen and (max-width: 480px) {
            .content {
                padding: 24px 16px;
            }
            .header {
                padding: 32px 16px;
            }
            .header h1 {
                font-size: 24px;
            }
            .welcome-text h2 {
                font-size: 20px;
            }
            .detail-row {
                flex-direction: column;
                margin-bottom: 16px;
            }
            .detail-value {
                text-align: left;
                padding-left: 0;
                margin-top: 4px;
            }
            .amount-value {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div style="height: 20px;"></div>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <img src="cid:eventlogo" alt="Bhaag Dilli Bhaag Logo">
                <p>Registration Official Confirmation</p>
            </div>

            <!-- Main Content -->
            <div class="content">
                <div class="welcome-text">
                    <h2>Got it, ${registration.name}!</h2>
                    <p>Your spot for Bhaag Dilli Bhaag 2026 is officially reserved. Get ready for an epic race day!</p>
                </div>

                <!-- Registration Summary -->
                <div class="details-card">
                    <h3>Summary Details</h3>
                    
                    <div class="detail-row">
                        <span class="detail-label">Registration ID</span>
                        <span class="detail-value" style="font-family: monospace;">#${registration._id}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Participant</span>
                        <span class="detail-value">${registration.name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Race Category</span>
                        <span class="detail-value" style="background: #1e3a81; color: white; padding: 2px 8px; border-radius: 4px;">${registration.race}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">T-Shirt Size</span>
                        <span class="detail-value">${registration.tshirtSize}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Email</span>
                        <span class="detail-value" style="font-size: 13px;">${registration.email}</span>
                    </div>

                    <div class="amount-row">
                        <span class="amount-label">Total Paid</span>
                        <span class="amount-value">₹${registration.amount}</span>
                    </div>
                </div>

                <!-- Next Steps -->
                <div class="info-section">
                    <div class="info-box">
                        <strong>📄 Official Invoice</strong>
                        <p>We've attached your official payment receipt as a PDF to this email. Please keep it for your records.</p>
                    </div>
                    <div class="info-box" style="border-left-color: #eab308; background-color: #fffbeb;">
                        <strong>📅 Race Kit Details</strong>
                        <p>Information regarding BIB and T-shirt collection will be sent to this email 10 days before the event.</p>
                    </div>
                </div>

                <div style="margin-top: 32px; text-align: center; font-size: 15px; color: #4a5568;">
                    <p>Questions? We're here to help.</p>
                    <a href="mailto:info@bhaagdillibhaag.in" style="display: inline-block; padding: 10px 24px; background-color: #1e3a8a; color: white; border-radius: 8px; text-decoration: none; font-weight: 700; margin-top: 8px;">Contact Support</a>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p>You received this because you registered for Bhaag Dilli Bhaag.</p>
                <p>&copy; 2026 Bhaag Dilli Bhaag. All rights reserved.</p>
                <div style="margin-top: 16px;">
                    <a href="https://bhaag-dilli-bhaag-8bd2.vercel.app">Visit Website</a>
                </div>
            </div>
        </div>
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
