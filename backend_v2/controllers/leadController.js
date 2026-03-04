const Lead = require('../models/Lead');

const createLead = async (req, res) => {
    const lead = new Lead({
        ...req.body,
        created_by: req.user._id,
    });
    try {
        const createdLead = await lead.save();
        res.status(201).json(createdLead);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getLeads = async (req, res) => {
    try {
        const filter = req.user.role === 'admin' ? {} : { assigned_to: req.user._id };
        const leads = await Lead.find(filter).populate('assigned_to', 'name email');
        res.json(leads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateLead = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (lead) {
            Object.assign(lead, req.body);
            const updatedLead = await lead.save();
            res.json(updatedLead);
        } else {
            res.status(404).json({ message: 'Lead not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteLead = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (lead) {
            await lead.deleteOne();
            res.json({ message: 'Lead removed' });
        } else {
            res.status(404).json({ message: 'Lead not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createLead, getLeads, updateLead, deleteLead };