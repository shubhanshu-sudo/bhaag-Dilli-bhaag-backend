const PDFDocument = require('pdfkit');
const path = require('path');

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

            // Logo path support for both local dev and production
            const logoPath = path.join(process.cwd(), '..', 'bhaag_Dilli_bhaag', 'public', 'Untitled-1-01.webp');

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
            try {
                // Add logo image
                doc.image(logoPath, 50, 40, { height: 60 });
            } catch (err) {
                // Fallback to text if image fails
                doc.fontSize(32)
                    .fillColor('#ffffff')
                    .font('Helvetica-Bold')
                    .text('Bhaag Dilli Bhaag', 50, 40);
            }

            doc.fontSize(12)
                .fillColor('#eab308')
                .font('Helvetica-Bold')
                .text('Registration Invoice', 50, 105);

            // Invoice Info
            doc.fontSize(10)
                .fillColor('#ffffff')
                .font('Helvetica-Bold')
                .text(`Invoice Date: ${new Date().toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                })}`, 50, 122);

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

            // Payment Breakdown Section (highlighted box with itemized breakdown)
            // Read amounts from database - use stored values, don't calculate
            const baseAmount = registration.baseAmount || registration.amount || 0;
            const chargedAmount = registration.chargedAmount || registration.amount || 0;
            const gatewayFee = chargedAmount - baseAmount;

            const boxHeight = gatewayFee > 0 ? 110 : 70;
            doc.rect(50, yPosition, doc.page.width - 100, boxHeight)
                .fillAndStroke('#f0f9ff', '#3b82f6');

            // Section Title
            doc.fontSize(11)
                .fillColor('#1e40af')
                .font('Helvetica-Bold')
                .text('PAYMENT SUMMARY', 60, yPosition + 12);

            let paymentY = yPosition + 30;

            // Only show breakdown if gateway fee > 0, otherwise show simple total
            if (gatewayFee > 0) {
                // Registration Fee row
                doc.fontSize(10)
                    .fillColor('#374151')
                    .font('Helvetica')
                    .text('Registration Fee', 60, paymentY);
                doc.fontSize(10)
                    .fillColor('#374151')
                    .font('Helvetica-Bold')
                    .text(`Rs. ${Math.round(baseAmount)}`, doc.page.width - 150, paymentY, { width: 100, align: 'right' });

                paymentY += 18;

                // Payment Gateway Charges row
                doc.fontSize(10)
                    .fillColor('#374151')
                    .font('Helvetica')
                    .text('Payment Gateway Charges', 60, paymentY);
                doc.fontSize(10)
                    .fillColor('#374151')
                    .font('Helvetica-Bold')
                    .text(`Rs. ${Math.round(gatewayFee)}`, doc.page.width - 150, paymentY, { width: 100, align: 'right' });

                paymentY += 15;

                // Divider line
                doc.strokeColor('#93c5fd')
                    .lineWidth(1)
                    .moveTo(60, paymentY)
                    .lineTo(doc.page.width - 60, paymentY)
                    .stroke();

                paymentY += 10;

                // Total Amount Paid row
                doc.fontSize(13)
                    .fillColor('#1e3a8a')
                    .font('Helvetica-Bold')
                    .text('Total Amount Paid', 60, paymentY);
                doc.fontSize(16)
                    .fillColor('#1e3a8a')
                    .font('Helvetica-Bold')
                    .text(`Rs. ${Math.round(chargedAmount)}`, doc.page.width - 150, paymentY - 2, { width: 100, align: 'right' });
            } else {
                // Simple display for legacy invoices without breakdown
                doc.fontSize(13)
                    .fillColor('#1e3a8a')
                    .font('Helvetica-Bold')
                    .text('Total Amount Paid', 60, paymentY);
                doc.fontSize(22)
                    .fillColor('#1e3a8a')
                    .font('Helvetica-Bold')
                    .text(`Rs. ${Math.round(chargedAmount)}`, doc.page.width - 150, paymentY - 2, { width: 100, align: 'right' });
            }

            yPosition += boxHeight + 10;

            // Razorpay deductions note (only show if there's a gateway fee)
            if (gatewayFee > 0) {
                doc.fontSize(8)
                    .fillColor('#6b7280')
                    .font('Helvetica-Oblique')
                    .text(
                        'Note: Payment gateway charges are collected to cover transaction processing fees. Razorpay deducts applicable charges before settlement.',
                        50,
                        yPosition,
                        { width: doc.page.width - 100, align: 'left' }
                    );
                yPosition += 25;
            }

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
