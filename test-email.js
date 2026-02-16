const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 2525,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    }
});

console.log('Testing connection with Brevo...');
console.log('Host:', process.env.SMTP_HOST);
console.log('Port:', process.env.SMTP_PORT);
console.log('User:', process.env.SMTP_USER);

transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Connection failed:', error);
    } else {
        console.log('🚀 Connection successful! Brevo is ready.');
    }
    process.exit();
});
