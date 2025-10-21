const pool = require('../config/database');

const Service = {
  // Create new service
  async create(serviceData) {
    const { name, description, rate } = serviceData;
    const query = `
      INSERT INTO services (name, description, rate) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `;
    const values = [name, description, rate];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Get all services
  async findAll() {
    const query = 'SELECT * FROM services ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  },

  // Get service by ID
  async findById(id) {
    const query = 'SELECT * FROM services WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Update service
  async update(id, serviceData) {
    const { name, description, rate } = serviceData;
    const query = `
      UPDATE services 
      SET name = $1, description = $2, rate = $3 
      WHERE id = $4 
      RETURNING *
    `;
    const values = [name, description, rate, id];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Delete service
  async delete(id) {
    const query = 'DELETE FROM services WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = Service;