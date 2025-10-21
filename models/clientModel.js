const pool = require('../config/database');

const Client = {
  // Create new client
  async create(clientData) {
    const { name, email, phone, address } = clientData;
    const query = `
      INSERT INTO clients (name, email, phone, address) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `;
    const values = [name, email, phone, address];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Get all clients
  async findAll() {
    const query = 'SELECT * FROM clients ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  },

  // Get client by ID
  async findById(id) {
    const query = 'SELECT * FROM clients WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Update client
  async update(id, clientData) {
    const { name, email, phone, address } = clientData;
    const query = `
      UPDATE clients 
      SET name = $1, email = $2, phone = $3, address = $4 
      WHERE id = $5 
      RETURNING *
    `;
    const values = [name, email, phone, address, id];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Delete client
  async delete(id) {
    const query = 'DELETE FROM clients WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = Client;