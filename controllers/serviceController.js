const Service = require('../models/serviceModel');

const serviceController = {
  // Create service
  async createService(req, res) {
    try {
      const service = await Service.create(req.body);
      res.status(201).json({
        success: true,
        data: service
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get all services
  async getServices(req, res) {
    try {
      const services = await Service.findAll();
      res.json({
        success: true,
        data: services
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get service by ID
  async getService(req, res) {
    try {
      const service = await Service.findById(req.params.id);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }
      res.json({
        success: true,
        data: service
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Update service
  async updateService(req, res) {
    try {
      const service = await Service.update(req.params.id, req.body);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }
      res.json({
        success: true,
        data: service
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // Delete service
  async deleteService(req, res) {
    try {
      const service = await Service.delete(req.params.id);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }
      res.json({
        success: true,
        message: 'Service deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = serviceController;