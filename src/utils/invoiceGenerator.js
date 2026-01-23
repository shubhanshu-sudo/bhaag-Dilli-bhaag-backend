const PDFDocument = require('pdfkit');

/**
 * Invoice Generator for Bhaag Dilli Bhaag
 * 
 * Generates professional PDF invoices for race registrations
 */

/**
 * Generate invoice PDF
 * 
 * @param {Object} registration - Registration document from database
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateInvoice = (registration) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50
            });

            // Collect PDF data in buffer
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });
            doc.on('error', reject);

            // Header with gradient effect (simulated with rectangles)
            doc.rect(0, 0, doc.page.width, 150).fill('#1e3a8a');

            // Event Logo/Title
            doc.fontSize(32)
                .fillColor('#ffffff')
                .font('Helvetica-Bold')
                .text('Bhaag Dilli Bhaag', 50, 40);

            doc.fontSize(14)
                .fillColor('#eab308')
                .text('Registration Invoice', 50, 80);

            // Invoice Info
            doc.fontSize(10)
                .fillColor('#ffffff')
                .text(`Invoice Date: ${new Date().toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                })}`, 50, 110);

            // Move to content area
            let yPosition = 170;

            // Invoice Title
            doc.fontSize(18)
                .fillColor('#1e3a8a')
                .font('Helvetica-Bold')
                .text('PAYMENT RECEIPT', 50, yPosition);

            yPosition += 30;

            // Registration ID Box
            doc.rect(50, yPosition, doc.page.width - 100, 35)
                .fillAndStroke('#dbeafe', '#3b82f6');

            doc.fontSize(9)
                .fillColor('#1e40af')
                .font('Helvetica-Bold')
                .text('REGISTRATION ID', 60, yPosition + 6);

            doc.fontSize(11)
                .fillColor('#1e3a8a')
                .font('Helvetica')
                .text(registration._id.toString(), 60, yPosition + 18);

            yPosition += 50;

            // Participant Details Section
            doc.fontSize(13)
                .fillColor('#1e3a8a')
                .font('Helvetica-Bold')
                .text('Participant Details', 50, yPosition);

            yPosition += 20;

            // Draw table-like structure with right-aligned values
            const drawDetailRow = (label, value, y) => {
                // Label (left-aligned)
                doc.fontSize(9)
                    .fillColor('#6b7280')
                    .font('Helvetica')
                    .text(label, 50, y, { width: 200, align: 'left' });

                // Value (right-aligned)
                doc.fontSize(9)
                    .fillColor('#111827')
                    .font('Helvetica-Bold')
                    .text(value, 250, y, { width: doc.page.width - 300, align: 'right' });

                // Separator line
                doc.strokeColor('#e5e7eb')
                    .lineWidth(0.5)
                    .moveTo(50, y + 15)
                    .lineTo(doc.page.width - 50, y + 15)
                    .stroke();

                return y + 21;
            };

            yPosition = drawDetailRow('Name', registration.name, yPosition);
            yPosition = drawDetailRow('Email', registration.email, yPosition);
            yPosition = drawDetailRow('Phone', registration.phone, yPosition);
            yPosition = drawDetailRow('Gender', registration.gender || 'N/A', yPosition);
            yPosition = drawDetailRow('Date of Birth', registration.dob ? new Date(registration.dob).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }) : 'N/A', yPosition);
            yPosition = drawDetailRow('Race Category', registration.race, yPosition);
            yPosition = drawDetailRow('T-Shirt Size', registration.tshirtSize, yPosition);
            yPosition = drawDetailRow('Emergency Contact', registration.emergencyName || 'N/A', yPosition);
            yPosition = drawDetailRow('Emergency Phone', registration.emergencyPhone || 'N/A', yPosition);
            yPosition = drawDetailRow('Registration Date', new Date(registration.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }), yPosition);

            yPosition += 15;

            // Payment Details Section
            doc.fontSize(13)
                .fillColor('#1e3a8a')
                .font('Helvetica-Bold')
                .text('Payment Details', 50, yPosition);

            yPosition += 20;

            yPosition = drawDetailRow('Razorpay Order ID', registration.razorpayOrderId || 'N/A', yPosition);
            yPosition = drawDetailRow('Razorpay Payment ID', registration.razorpayPaymentId || 'N/A', yPosition);
            yPosition = drawDetailRow('Payment Status', 'PAID ✓', yPosition);
            yPosition = drawDetailRow('Payment Date', registration.paymentDate ? new Date(registration.paymentDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'N/A', yPosition);

            yPosition += 15;

            // Amount Section (highlighted) - Using column layout
            const boxHeight = 70;
            doc.rect(50, yPosition, doc.page.width - 100, boxHeight)
                .fillAndStroke('#f0f9ff', '#3b82f6');

            // Title
            doc.fontSize(11)
                .fillColor('#1e40af')
                .font('Helvetica-Bold')
                .text('TOTAL AMOUNT PAID', 0, yPosition + 12, {
                    width: doc.page.width,
                    align: 'center'
                });

            // Amount - Format as integer and use Rs. to avoid symbol issues
            const formattedAmount = Math.round(registration.amount);

            doc.fontSize(32)
                .fillColor('#1e3a8a')
                .font('Helvetica-Bold')
                .text(`Rs. ${formattedAmount}`, 0, yPosition + 28, {
                    width: doc.page.width,
                    align: 'center'
                });

            // Subtitle
            doc.fontSize(8)
                .fillColor('#6b7280')
                .font('Helvetica')
                .text('(Indian Rupees)', 0, yPosition + boxHeight - 12, {
                    width: doc.page.width,
                    align: 'center'
                });

            yPosition += boxHeight + 15;

            // Footer
            const footerY = doc.page.height - 100;

            doc.rect(0, footerY, doc.page.width, 100)
                .fill('#f9fafb');

            doc.fontSize(9)
                .fillColor('#6b7280')
                .font('Helvetica')
                .text('This is a system-generated invoice and does not require a signature.', 50, footerY + 20, {
                    width: doc.page.width - 100,
                    align: 'center'
                });

            doc.fontSize(8)
                .fillColor('#9ca3af')
                .text('For queries, contact: info@bhaagdillibhaag.in', 50, footerY + 40, {
                    width: doc.page.width - 100,
                    align: 'center'
                });

            doc.fontSize(8)
                .fillColor('#9ca3af')
                .text('© 2026 Bhaag Dilli Bhaag. All rights reserved.', 50, footerY + 55, {
                    width: doc.page.width - 100,
                    align: 'center'
                });

            // Finalize PDF
            doc.end();

        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    generateInvoice
};
