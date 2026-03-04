const express = require('express');
const router = express.Router();
const { createPayslip, getMyPayslips, getAllPayslips, createLeaveRequest, getMyLeaveRequests, updateLeaveStatus } = require('../controllers/operationController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/payslips')
    .post(protect, admin, createPayslip)
    .get(protect, admin, getAllPayslips);

router.route('/payslips/my')
    .get(protect, getMyPayslips);

router.route('/leave')
    .post(protect, createLeaveRequest)
    .get(protect, getMyLeaveRequests);

router.route('/leave/:id')
    .put(protect, admin, updateLeaveStatus);

module.exports = router;