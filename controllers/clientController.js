const Client = require('../models/clientModel');

const clientController = {
    // Create client
    async createClient(req, res) {
        try {
            const client = await Client.create(req.body);
            res.status(201).json({
                success: true,
                data: client
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Get all clients
    async getClients(req, res) {
        try {
            const clients = await Client.findAll();
            res.json({
                success: true,
                data: clients
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Get client by ID
    async getClient(req, res) {
        try {
            const client = await Client.findById(req.params.id);
            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Client not found'
                });
            }
            res.json({
                success: true,
                data: client
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Update client
    async updateClient(req, res) {
        try {
            const client = await Client.update(req.params.id, req.body);
            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Client not found'
                });
            }
            res.json({
                success: true,
                data: client
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Delete client
    async deleteClient(req, res) {
        try {
            const client = await Client.delete(req.params.id);
            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Client not found'
                });
            }
            res.json({
                success: true,
                message: 'Client deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = clientController;