const PDFDocument = require('pdfkit');

class PDFGenerator {
    static generateInvoice(invoice) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    margin: 50,
                    size: 'A4',
                    info: {
                        Title: `Invoice ${invoice.invoice_number}`,
                        Author: 'Smart Invoice System',
                        Creator: 'Smart Invoice API'
                    }
                });

                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => resolve(Buffer.concat(buffers)));

                // Generate PDF sections
                this.generateHeader(doc, invoice);
                this.generateClientInfo(doc, invoice);
                this.generateInvoiceTable(doc, invoice);
                // Footer section removed

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    // ===== HEADER =====
    static generateHeader(doc, invoice) {
        const pageWidth = doc.page.width;

        // Header background
        doc.rect(0, 0, pageWidth, 80).fill('#2c3e50');

        // Company Name
        doc.fillColor('#ffffff')
            .font('Helvetica-Bold')
            .fontSize(24)
            .text('SMART INVOICE', 50, 30, { align: 'left' });

        doc.font('Helvetica')
            .fontSize(10)
            .fillColor('#bdc3c7')
            .text('Professional Billing Solutions', 50, 60);

        // Invoice Badge
        const badgeWidth = 150;
        const badgeX = pageWidth - badgeWidth - 50;

        doc.rect(badgeX, 25, badgeWidth, 40).fill('#e74c3c');
        doc.fillColor('#ffffff')
            .font('Helvetica-Bold')
            .fontSize(16)
            .text('INVOICE', badgeX + 10, 35)
            .font('Helvetica')
            .fontSize(10)
            .text(`#${invoice.invoice_number}`, badgeX + 10, 55);

        doc.fillColor('#000000'); // Reset color
    }

    // ===== CLIENT INFORMATION =====
    static generateClientInfo(doc, invoice) {
        const top = 120;

        // BILL TO
        doc.fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50')
            .text('BILL TO:', 50, top);

        // Client card
        doc.rect(45, top + 25, 250, 90).fill('#f8f9fa').stroke('#bdc3c7');
        doc.fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50')
            .text(invoice.client_name, 60, top + 40);

        // Contact Info
        let contactY = top + 60;

        if (invoice.client_phone) doc.text(`Phone: ${invoice.client_phone}`, 60, contactY);
        if (invoice.client_email) doc.text(`Email: ${invoice.client_email}`, 60, contactY + 15);

        // Dates card
        doc.rect(320, top + 25, 200, 90).fill('#f8f9fa').stroke('#bdc3c7');

        const invoiceDate = invoice.invoice_date ? new Date(invoice.invoice_date) : new Date();
        const dueDate = invoice.due_date ? new Date(invoice.due_date) : new Date();
        const status = this.getInvoiceStatus(invoice);

        const dates = [
            { label: 'Invoice Date:', value: invoiceDate.toLocaleDateString() },
            { label: 'Due Date:', value: dueDate.toLocaleDateString() },
            { label: 'Status:', value: status }
        ];

        let dateY = top + 40;
        dates.forEach((d, i) => {
            doc.font('Helvetica')
                .fontSize(10)
                .fillColor('#7f8c8d')
                .text(d.label, 335, dateY + i * 20);

            doc.font('Helvetica-Bold')
                .fillColor('#2c3e50')
                .text(d.value, 400, dateY + i * 20);
        });
    }

    // ===== INVOICE TABLE =====
    static generateInvoiceTable(doc, invoice) {
        let y = 250;

        const tableWidth = 500;
        const startX = 50;

        // Table Header
        doc.rect(startX, y, tableWidth, 25).fill('#34495e');
        doc.font('Helvetica-Bold')
            .fontSize(11)
            .fillColor('#ffffff')
            .text('DESCRIPTION', startX + 10, y + 8)
            .text('QTY', 300, y + 8)
            .text('RATE', 370, y + 8)
            .text('AMOUNT', 460, y + 8);

        y += 25;

        // Table rows
        const items = invoice.items || [];
        doc.font('Helvetica').fontSize(10);
        items.forEach((item, index) => {
            if (index % 2 === 0) doc.rect(startX, y, tableWidth, 20).fill('#f8f9fa');

            const description = item.description || item.service_name || 'Service';
            const quantity = item.quantity || 1;
            const rate = Number(item.rate) || 0;
            const amount = Number(item.amount) || quantity * rate;

            doc.fillColor('#2c3e50')
                .text(description, startX + 10, y + 5, { width: 220 })
                .text(quantity.toString(), 300, y + 5)
                .text(`$${rate.toFixed(2)}`, 370, y + 5)
                .text(`$${amount.toFixed(2)}`, 460, y + 5);

            y += 20;
        });

        // Summary
        y += 20;
        const subtotal = Number(invoice.subtotal) || items.reduce((acc, i) => acc + ((i.amount) || (i.quantity * i.rate)), 0);
        const gstRate = Number(process.env.GST_RATE) || 18;
        const gstAmount = Number(invoice.gst_amount) || (subtotal * gstRate / 100);
        const totalAmount = Number(invoice.total_amount) || (subtotal + gstAmount);

        const summaryItems = [
            { label: 'Subtotal:', value: subtotal },
            { label: `GST (${gstRate}%):`, value: gstAmount },
            { label: 'Total:', value: totalAmount, bold: true }
        ];

        summaryItems.forEach((item, index) => {
            const isTotal = item.bold;
            doc.font(isTotal ? 'Helvetica-Bold' : 'Helvetica')
                .fillColor(isTotal ? '#e74c3c' : '#2c3e50')
                .fontSize(isTotal ? 12 : 10)
                .text(item.label, 350, y + index * 20)
                .text(`$${item.value.toFixed(2)}`, 460, y + index * 20);

            if (isTotal) doc.rect(445, y + index * 20 - 2, 100, 18).stroke('#e74c3c');
        });
    }

    // ===== HELPERS =====
    static getInvoiceStatus(invoice) {
        const today = new Date();
        const dueDate = invoice.due_date ? new Date(invoice.due_date) : today;

        if (invoice.paid) return 'Paid';
        if (dueDate < today) return 'Overdue';
        if (dueDate > today) return 'Pending';
        return 'Due Today';
    }
}

module.exports = PDFGenerator;