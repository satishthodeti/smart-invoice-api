const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

// Send single invoice via email
router.post('/invoices/:id/send', emailController.sendInvoice);

// Send multiple invoices via email
router.post('/invoices/bulk-send', emailController.sendBulkInvoices);

// Send payment reminder
router.post('/invoices/:id/reminder', emailController.sendReminder);

// Test email configuration
router.post('/test', emailController.testEmailConfig);

module.exports = router;