const express = require('express');
const router = express.Router();
const { createLead, getLeads, updateLead, deleteLead } = require('../controllers/leadController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createLead)
    .get(protect, getLeads);

router.route('/:id')
    .put(protect, updateLead)
    .delete(protect, admin, deleteLead);

module.exports = router;