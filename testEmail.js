require('dotenv').config();
const nodemailer = require('nodemailer');

/**
 * Test Email Script
 * Sends a test email to verify SMTP credentials from .env file
 */

const sendTestEmail = async () => {
    console.log('🔍 Testing Email Configuration...\n');

    // Display current configuration (without password)
    console.log('📧 SMTP Configuration:');
    console.log('   Host:', process.env.SMTP_HOST);
    console.log('   Port:', process.env.SMTP_PORT);
    console.log('   User:', process.env.SMTP_USER);
    console.log('   Pass:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET');
    console.log('');

    try {
        // Create transporter (matching your emailService.js configuration)
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false, // false for TLS (port 587)
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Verify connection
        console.log('🔌 Verifying SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP connection verified successfully!\n');

        // Send test email
        console.log('📤 Sending test email...');
        const info = await transporter.sendMail({
            from: `"Bhaag Dilli Bhaag Test" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER, // Send to yourself
            subject: '✅ Test Email - SMTP Configuration Working',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                        .success-badge { background: #22c55e; color: white; padding: 10px 20px; border-radius: 50px; display: inline-block; font-weight: bold; }
                        .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #3b82f6; border-radius: 5px; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 SMTP Test Successful!</h1>
                        </div>
                        <div class="content">
                            <div class="success-badge">✓ Configuration Working</div>
                            
                            <div class="info-box">
                                <h3>📋 Test Details:</h3>
                                <p><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</p>
                                <p><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</p>
                                <p><strong>From Email:</strong> ${process.env.SMTP_USER}</p>
                                <p><strong>Test Time:</strong> ${new Date().toLocaleString('en-IN')}</p>
                            </div>

                            <div class="info-box">
                                <h3>✅ What This Means:</h3>
                                <ul>
                                    <li>Your .env credentials are correctly configured</li>
                                    <li>SMTP connection is working properly</li>
                                    <li>Email service is ready to send registration confirmations</li>
                                </ul>
                            </div>

                            <p style="margin-top: 20px;">
                                <strong>Next Steps:</strong><br>
                                Your email service is fully functional and ready to send confirmation emails to users after successful payments.
                            </p>
                        </div>
                        <div class="footer">
                            <p>Bhaag Dilli Bhaag - Email Service Test</p>
                            <p>© 2026 All rights reserved</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        });

        console.log('✅ Test email sent successfully!');
        console.log('📬 Message ID:', info.messageId);
        console.log('📧 Email sent to:', process.env.SMTP_USER);
        console.log('\n🎉 All checks passed! Your email configuration is working perfectly.\n');

    } catch (error) {
        console.error('\n❌ Email test failed!');
        console.error('Error:', error.message);

        if (error.code === 'EAUTH') {
            console.error('\n💡 Authentication failed. Please check:');
            console.error('   - SMTP_USER is correct');
            console.error('   - SMTP_PASS is correct');
            console.error('   - Your email provider allows SMTP access');
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
            console.error('\n💡 Connection failed. Please check:');
            console.error('   - SMTP_HOST is correct');
            console.error('   - SMTP_PORT is correct');
            console.error('   - Your firewall/network allows SMTP connections');
            console.error('   - Try port 465 with secure:true if 587 doesn\'t work');
        }

        console.error('\nFull error details:', error);
        process.exit(1);
    }
};

// Run the test
sendTestEmail();
