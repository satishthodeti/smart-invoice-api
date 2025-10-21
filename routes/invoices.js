const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

router.post('/', invoiceController.createInvoice);
router.get('/', invoiceController.getInvoices);
router.get('/:id', invoiceController.getInvoice);
router.get('/:id/pdf', invoiceController.generatePDF);
router.post('/:id/send', invoiceController.sendEmail);
router.put('/:id/status', invoiceController.updateStatus);
router.delete('/:id', invoiceController.deleteInvoice);

module.exports = router;