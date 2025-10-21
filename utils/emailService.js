const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465, // true for 465, false for others
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter configuration
transporter.verify(error => {
  if (error) {
    console.error('Email transporter configuration error:', error);
  } else {
    console.log('Email server is ready to take messages');
  }
});

class EmailService {
  /**
   * Send invoice via email
   * @param {Object} options
   * @param {string} options.email - Recipient email
   * @param {Object} options.invoice - Invoice data
   * @param {Buffer} options.pdfBuffer - PDF buffer
   * @param {string} options.subject - Optional email subject
   * @param {string} options.customMessage - Optional custom message
   */
  static async sendInvoice({ email, invoice, pdfBuffer, subject, customMessage }) {
    try {
      const emailSubject = subject || `Invoice ${invoice.invoice_number} from ${process.env.COMPANY_NAME || 'Our Company'}`;

      const emailMessage = customMessage ? `
        <p>Dear ${invoice.client_name},</p>
        <p>${customMessage}</p>
        <ul>
          <li>Invoice Number: ${invoice.invoice_number}</li>
          <li>Amount Due: $${invoice.total_amount || '0.00'}</li>
          <li>Due Date: ${new Date(invoice.due_date).toLocaleDateString()}</li>
        </ul>
      ` : `
        <p>Dear ${invoice.client_name},</p>
        <p>Please find your invoice <strong>${invoice.invoice_number}</strong> attached.</p>
        <p><strong>Amount Due:</strong> $${invoice.total_amount || '0.00'}</p>
        <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
        <p>You can view the detailed invoice in the attached PDF document.</p>
      `;

      const mailOptions = {
        from: {
          name: process.env.COMPANY_NAME || 'Invoice System',
          address: process.env.EMAIL_USER
        },
        to: email,
        subject: emailSubject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; color: #333; }
              .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
              .header { background: #007bff; color: #fff; text-align: center; padding: 20px; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { padding: 20px; line-height: 1.6; }
              .invoice-details { background: #f1f1f1; padding: 15px; border-radius: 5px; margin: 15px 0; }
              .invoice-details h3 { margin-top: 0; }
              .button { display: inline-block; padding: 10px 20px; background: #007bff; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 15px; }
              .footer { background: #f8f9fa; color: #666; font-size: 12px; text-align: center; padding: 15px; }
              ul { padding-left: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Invoice ${invoice.invoice_number}</h1>
              </div>
              <div class="content">
                ${emailMessage}
                <div class="invoice-details">
                  <h3>Total Amount Due: $${invoice.total_amount || '0.00'}</h3>
                  <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
                </div>
                <p>If you have any questions about this invoice, please contact us.</p>
                <p>Best regards,<br>${process.env.COMPANY_NAME || 'Your Service Provider'}</p>
              </div>
              <div class="footer">
                <p>This is an automated email. Please do not reply to this message.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        attachments: [
          {
            filename: `invoice-${invoice.invoice_number}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      const result = await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${email}, Message ID: ${result.messageId}`);
      return result;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  static async getStatus() {
    try {
      const isVerified = await transporter.verify();
      return { isConnected: isVerified, host: process.env.EMAIL_HOST, port: process.env.EMAIL_PORT, user: process.env.EMAIL_USER };
    } catch (error) {
      return { isConnected: false, error: error.message, host: process.env.EMAIL_HOST, port: process.env.EMAIL_PORT, user: process.env.EMAIL_USER };
    }
  }
}

module.exports = EmailService;
