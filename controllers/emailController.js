const Invoice = require('../models/invoiceModel');
const PDFGenerator = require('../utils/pdfGenerator');
const EmailService = require('../utils/emailService');

const emailController = {
  /**
   * Send invoice via email
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async sendInvoice(req, res) {
    try {
      const { id } = req.params;
      const { email, subject, customMessage } = req.body;

      // Get invoice with full details
      const invoice = await Invoice.findById(id);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      // Determine recipient email
      const recipientEmail = email || invoice.client_email;
      if (!recipientEmail) {
        return res.status(400).json({
          success: false,
          message: 'No email address provided and client has no email on record'
        });
      }

      // Generate PDF
      const pdfBuffer = await PDFGenerator.generateInvoice(invoice);

      // Prepare email options
      const emailOptions = {
        email: recipientEmail,
        invoice: invoice,
        pdfBuffer: pdfBuffer,
        subject: subject,
        customMessage: customMessage
      };

      // Send email
      const emailResult = await EmailService.sendInvoice(emailOptions);

      // Update invoice status to sent if it was draft
      if (invoice.status === 'draft') {
        await Invoice.updateStatus(id, 'sent');
      }

      res.json({
        success: true,
        message: 'Invoice sent successfully',
        data: {
          messageId: emailResult.messageId,
          recipient: recipientEmail,
          invoiceNumber: invoice.invoice_number,
          status: 'sent'
        }
      });

    } catch (error) {
      console.error('Email sending error:', error);
      res.status(500).json({
        success: false,
        message: `Failed to send email: ${error.message}`
      });
    }
  },

  /**
   * Send bulk invoices via email
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async sendBulkInvoices(req, res) {
    try {
      const { invoiceIds, customMessage } = req.body;

      if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'invoiceIds array is required and cannot be empty'
        });
      }

      const results = {
        successful: [],
        failed: []
      };

      // Process each invoice
      for (const invoiceId of invoiceIds) {
        try {
          const invoice = await Invoice.findById(invoiceId);
          if (!invoice) {
            results.failed.push({
              invoiceId,
              error: 'Invoice not found'
            });
            continue;
          }

          if (!invoice.client_email) {
            results.failed.push({
              invoiceId,
              invoiceNumber: invoice.invoice_number,
              error: 'Client has no email address'
            });
            continue;
          }

          // Generate PDF
          const pdfBuffer = await PDFGenerator.generateInvoice(invoice);

          // Send email
          const emailOptions = {
            email: invoice.client_email,
            invoice: invoice,
            pdfBuffer: pdfBuffer,
            customMessage: customMessage
          };

          await EmailService.sendInvoice(emailOptions);

          // Update status
          if (invoice.status === 'draft') {
            await Invoice.updateStatus(invoiceId, 'sent');
          }

          results.successful.push({
            invoiceId,
            invoiceNumber: invoice.invoice_number,
            recipient: invoice.client_email
          });

        } catch (error) {
          results.failed.push({
            invoiceId,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        message: `Bulk email sending completed. Successful: ${results.successful.length}, Failed: ${results.failed.length}`,
        data: results
      });

    } catch (error) {
      console.error('Bulk email sending error:', error);
      res.status(500).json({
        success: false,
        message: `Bulk email sending failed: ${error.message}`
      });
    }
  },

  /**
   * Send invoice reminder for overdue invoices
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async sendReminder(req, res) {
    try {
      const { id } = req.params;
      const { reminderType = 'gentle' } = req.body;

      const invoice = await Invoice.findById(id);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      if (!invoice.client_email) {
        return res.status(400).json({
          success: false,
          message: 'Client has no email address'
        });
      }

      // Generate PDF
      const pdfBuffer = await PDFGenerator.generateInvoice(invoice);

      // Determine reminder message based on type
      const reminderMessages = {
        gentle: `Gentle reminder: Your invoice ${invoice.invoice_number} is due on ${new Date(invoice.due_date).toLocaleDateString()}.`,
        urgent: `URGENT: Your invoice ${invoice.invoice_number} is overdue. Please make payment immediately.`,
        final: `FINAL NOTICE: Your invoice ${invoice.invoice_number} is seriously overdue. Please contact us immediately to avoid further action.`
      };

      const customMessage = reminderMessages[reminderType] || reminderMessages.gentle;

      const emailOptions = {
        email: invoice.client_email,
        invoice: invoice,
        pdfBuffer: pdfBuffer,
        subject: `Payment Reminder: Invoice ${invoice.invoice_number}`,
        customMessage: customMessage
      };

      const emailResult = await EmailService.sendInvoice(emailOptions);

      // Update invoice status to overdue if not already
      if (invoice.status !== 'overdue' && new Date(invoice.due_date) < new Date()) {
        await Invoice.updateStatus(id, 'overdue');
      }

      res.json({
        success: true,
        message: 'Reminder sent successfully',
        data: {
          messageId: emailResult.messageId,
          recipient: invoice.client_email,
          invoiceNumber: invoice.invoice_number,
          reminderType: reminderType,
          status: 'reminder_sent'
        }
      });

    } catch (error) {
      console.error('Reminder sending error:', error);
      res.status(500).json({
        success: false,
        message: `Failed to send reminder: ${error.message}`
      });
    }
  },

  /**
   * Test email configuration
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async testEmailConfig(req, res) {
    try {
      const { testEmail } = req.body;

      if (!testEmail) {
        return res.status(400).json({
          success: false,
          message: 'testEmail is required'
        });
      }

      // Create a simple test invoice
      const testInvoice = {
        invoice_number: 'TEST-001',
        client_name: 'Test Client',
        client_email: testEmail,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subtotal: 100.00,
        gst_amount: 18.00,
        total_amount: 118.00,
        items: [
          {
            service_name: 'Test Service',
            description: 'This is a test email',
            quantity: 1,
            rate: 100.00,
            amount: 100.00
          }
        ]
      };

      const pdfBuffer = await PDFGenerator.generateInvoice(testInvoice);

      const emailOptions = {
        email: testEmail,
        invoice: testInvoice,
        pdfBuffer: pdfBuffer,
        subject: 'Test Email - Smart Invoice Generator',
        customMessage: 'This is a test email to verify your email configuration is working correctly.'
      };

      const result = await EmailService.sendInvoice(emailOptions);

      res.json({
        success: true,
        message: 'Test email sent successfully',
        data: {
          messageId: result.messageId,
          recipient: testEmail,
          status: 'test_sent'
        }
      });

    } catch (error) {
      console.error('Test email error:', error);
      res.status(500).json({
        success: false,
        message: `Test email failed: ${error.message}`
      });
    }
  }
};

module.exports = emailController;