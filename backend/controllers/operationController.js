const Payslip = require('../models/Payslip');
const LeaveRequest = require('../models/LeaveRequest');

const createPayslip = async (req, res) => {
    try {
        const payslip = await Payslip.create(req.body);
        res.status(201).json(payslip);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getMyPayslips = async (req, res) => {
    try {
        const payslips = await Payslip.find({ user_id: req.user._id });
        res.json(payslips);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllPayslips = async (req, res) => {
    try {
        const payslips = await Payslip.find({}).populate('user_id', 'name email');
        res.json(payslips);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createLeaveRequest = async (req, res) => {
    try {
        const request = await LeaveRequest.create({ ...req.body, user_id: req.user._id });
        res.status(201).json(request);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getMyLeaveRequests = async (req, res) => {
    try {
        const requests = await LeaveRequest.find({ user_id: req.user._id });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateLeaveStatus = async (req, res) => {
    try {
        const request = await LeaveRequest.findById(req.params.id);
        if (request) {
            request.status = req.body.status;
            request.reviewed_by = req.user._id;
            request.reviewed_at = Date.now();
            const updatedRequest = await request.save();
            res.json(updatedRequest);
        } else {
            res.status(404).json({ message: 'Leave request not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { createPayslip, getMyPayslips, getAllPayslips, createLeaveRequest, getMyLeaveRequests, updateLeaveStatus };