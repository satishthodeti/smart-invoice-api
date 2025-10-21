const pool = require('../config/database');

const Invoice = {
  // Generate unique invoice number
  async generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const query = `
      SELECT COUNT(*) as count 
      FROM invoices 
      WHERE EXTRACT(YEAR FROM created_at) = $1
    `;
    const result = await pool.query(query, [year]);
    const count = parseInt(result.rows[0].count) + 1;
    return `INV-${year}-${count.toString().padStart(4, '0')}`;
  },

  // Create new invoice
  async create(invoiceData) {
    const { client_id, invoice_date, due_date, notes, items } = invoiceData;
    const clientResult = await pool.query('SELECT * FROM clients WHERE id = $1', [client_id]);
    
    if (!clientResult.rows[0]) {
      throw new Error('Client not found');
    }

    const invoice_number = await this.generateInvoiceNumber();
    
    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insert invoice
      const invoiceQuery = `
        INSERT INTO invoices (invoice_number, client_id, invoice_date, due_date, notes) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING *
      `;
      const invoiceValues = [invoice_number, client_id, invoice_date, due_date, notes];
      const invoiceResult = await client.query(invoiceQuery, invoiceValues);
      const invoice = invoiceResult.rows[0];

      // Insert invoice items and calculate totals
      let subtotal = 0;
      for (const item of items) {
        const service = await client.query('SELECT * FROM services WHERE id = $1', [item.service_id]);
        if (!service.rows[0]) {
          throw new Error(`Service with ID ${item.service_id} not found`);
        }

        const rate = item.rate || service.rows[0].rate;
        const amount = rate * item.quantity;

        const itemQuery = `
          INSERT INTO invoice_items (invoice_id, service_id, description, quantity, rate, amount) 
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        const itemValues = [invoice.id, item.service_id, item.description, item.quantity, rate, amount];
        await client.query(itemQuery, itemValues);

        subtotal += amount;
      }

      // Calculate GST and total
      const gstRate = parseFloat(process.env.GST_RATE) || 18;
      const gstAmount = (subtotal * gstRate) / 100;
      const totalAmount = subtotal + gstAmount;

      // Update invoice with calculated amounts
      const updateQuery = `
        UPDATE invoices 
        SET subtotal = $1, gst_amount = $2, total_amount = $3, status = 'sent'
        WHERE id = $4 
        RETURNING *
      `;
      const updateValues = [subtotal, gstAmount, totalAmount, invoice.id];
      const finalInvoice = await client.query(updateQuery, updateValues);

      await client.query('COMMIT');
      return finalInvoice.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Get all invoices with client details
  async findAll() {
    const query = `
      SELECT 
        i.*,
        c.name as client_name,
        c.email as client_email
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      ORDER BY i.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // Get invoice by ID with full details
  async findById(id) {
    const invoiceQuery = `
      SELECT 
        i.*,
        c.name as client_name,
        c.email as client_email,
        c.phone as client_phone,
        c.address as client_address,
        i.total_amount
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.id = $1
    `;
    
    const itemsQuery = `
      SELECT 
        ii.*,
        s.name as service_name
      FROM invoice_items ii
      LEFT JOIN services s ON ii.service_id = s.id
      WHERE ii.invoice_id = $1
    `;

    const [invoiceResult, itemsResult] = await Promise.all([
      pool.query(invoiceQuery, [id]),
      pool.query(itemsQuery, [id])
    ]);

    if (!invoiceResult.rows[0]) {
      return null;
    }

    const invoice = invoiceResult.rows[0];
    invoice.items = itemsResult.rows;

    return invoice;
  },

  // Update invoice status
  async updateStatus(id, status) {
    const query = 'UPDATE invoices SET status = $1 WHERE id = $2 RETURNING *';
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  },

  // Delete invoice
  async delete(id) {
    const query = 'DELETE FROM invoices WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = Invoice;