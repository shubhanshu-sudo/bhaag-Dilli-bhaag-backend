require('dotenv').config();
const nodemailer = require('nodemailer');

/**
 * Advanced Email Test - Multiple Configuration Tests
 * Tests different SMTP configurations for GoDaddy Titan Email
 */

const testConfigurations = [
    {
        name: 'Config 1: Port 587 (TLS) - Standard',
        config: {
            host: 'smtp.titan.email',
            port: 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        }
    },
    {
        name: 'Config 2: Port 465 (SSL)',
        config: {
            host: 'smtp.titan.email',
            port: 465,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        }
    },
    {
        name: 'Config 3: Port 587 with requireTLS',
        config: {
            host: 'smtp.titan.email',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        }
    },
    {
        name: 'Config 4: Port 587 with tls options',
        config: {
            host: 'smtp.titan.email',
            port: 587,
            secure: false,
            tls: {
                rejectUnauthorized: false
            },
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        }
    }
];

const testEmailConfig = async (configObj) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${configObj.name}`);
    console.log(`${'='.repeat(60)}`);

    try {
        const transporter = nodemailer.createTransport(configObj.config);

        console.log('🔌 Verifying connection...');
        await transporter.verify();
        console.log('✅ Connection verified!');

        console.log('📤 Sending test email...');
        const info = await transporter.sendMail({
            from: `"Bhaag Dilli Bhaag Test" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER,
            subject: `✅ Success - ${configObj.name}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #22c55e;">✅ Email Test Successful!</h2>
                    <p><strong>Configuration:</strong> ${configObj.name}</p>
                    <p><strong>Host:</strong> ${configObj.config.host}</p>
                    <p><strong>Port:</strong> ${configObj.config.port}</p>
                    <p><strong>Secure:</strong> ${configObj.config.secure}</p>
                    <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN')}</p>
                    <hr>
                    <p style="color: #666;">This configuration works! Use this in your .env file.</p>
                </div>
            `,
        });

        console.log('✅ EMAIL SENT SUCCESSFULLY!');
        console.log('📬 Message ID:', info.messageId);
        console.log(`\n🎉 SUCCESS! This configuration works:\n`);
        console.log('Use these settings in your .env:');
        console.log(`SMTP_HOST=${configObj.config.host}`);
        console.log(`SMTP_PORT=${configObj.config.port}`);
        console.log(`SMTP_SECURE=${configObj.config.secure}`);

        return true;

    } catch (error) {
        console.log('❌ Failed:', error.message);
        if (error.code) {
            console.log('   Error Code:', error.code);
        }
        return false;
    }
};

const runAllTests = async () => {
    console.log('\n🔍 GoDaddy Titan Email - SMTP Configuration Test');
    console.log('='.repeat(60));
    console.log('\n📧 Testing with credentials:');
    console.log('   User:', process.env.SMTP_USER);
    console.log('   Pass:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET');
    console.log('\n⏳ Testing multiple configurations...\n');

    let successCount = 0;

    for (const config of testConfigurations) {
        const success = await testEmailConfig(config);
        if (success) {
            successCount++;
            console.log('\n✅ Found working configuration! Stopping tests.\n');
            break; // Stop on first success
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between tests
    }

    if (successCount === 0) {
        console.log('\n' + '='.repeat(60));
        console.log('❌ ALL CONFIGURATIONS FAILED');
        console.log('='.repeat(60));
        console.log('\n💡 Possible Issues:');
        console.log('   1. Password is incorrect');
        console.log('   2. SMTP access is disabled in GoDaddy/Titan');
        console.log('   3. Need to use App Password instead of email password');
        console.log('   4. Account has 2FA enabled');
        console.log('\n📋 Next Steps:');
        console.log('   1. Login to GoDaddy → My Products → Email');
        console.log('   2. Manage Titan Email → Settings');
        console.log('   3. Check SMTP settings or generate App Password');
        console.log('   4. Verify password by logging into webmail');
        console.log('   5. Contact GoDaddy support if issue persists\n');
    }
};

// Run all tests
runAllTests().catch(console.error);
