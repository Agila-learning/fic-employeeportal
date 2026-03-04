const EmployeeReport = require('../models/EmployeeReport');

const createReport = async (req, res) => {
    const { report_date, department, work_summary, challenges, next_day_plan } = req.body;
    try {
        const report = await EmployeeReport.create({
            user_id: req.user._id,
            report_date,
            department,
            work_summary,
            challenges,
            next_day_plan
        });
        res.status(201).json(report);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Report already submitted for this date' });
        }
        res.status(400).json({ message: error.message });
    }
};

const getReports = async (req, res) => {
    try {
        const filter = req.user.role === 'admin' ? {} : { user_id: req.user._id };
        const reports = await EmployeeReport.find(filter).populate('user_id', 'name email');
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createReport, getReports };