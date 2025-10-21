const Invoice = require('../models/invoiceModel');
const PDFGenerator = require('../utils/pdfGenerator');
const EmailService = require('../utils/emailService');

const invoiceController = {
  // Create invoice
  async createInvoice(req, res) {
    try {
      const invoice = await Invoice.create(req.body);
      res.status(201).json({
        success: true,
        data: invoice
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get all invoices
  async getInvoices(req, res) {
    try {
      const invoices = await Invoice.findAll();
      res.json({
        success: true,
        data: invoices
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get invoice by ID
  async getInvoice(req, res) {
    try {
      const invoice = await Invoice.findById(req.params.id);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }
      res.json({
        success: true,
        data: invoice
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Generate PDF
  async generatePDF(req, res) {
    try {
      const invoice = await Invoice.findById(req.params.id);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      const pdfBuffer = await PDFGenerator.generateInvoice(invoice);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoice_number}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Send invoice via email
  async sendEmail(req, res) {
    try {
      const invoice = await Invoice.findById(req.params.id);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      const pdfBuffer = await PDFGenerator.generateInvoice(invoice);
      const email = req.body.email || invoice.client_email;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'No email address provided'
        });
      }

      await EmailService.sendInvoice(email, invoice, pdfBuffer);

      res.json({
        success: true,
        message: 'Invoice sent successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Update invoice status
  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      const invoice = await Invoice.updateStatus(req.params.id, status);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      res.json({
        success: true,
        data: invoice
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Delete invoice
  async deleteInvoice(req, res) {
    try {
      const invoice = await Invoice.delete(req.params.id);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }
      res.json({
        success: true,
        message: 'Invoice deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = invoiceController;