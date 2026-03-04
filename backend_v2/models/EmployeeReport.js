const mongoose = require('mongoose');

const reportSchema = mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    report_date: { type: Date, required: true },
    department: {
        type: String,
        enum: ['BDA', 'Academic', 'Operation', 'HR', 'IT', 'Marketing'],
        required: true
    },
    work_summary: { type: String, required: true },
    challenges: { type: String },
    next_day_plan: { type: String },
}, {
    timestamps: true,
});

reportSchema.index({ user_id: 1, report_date: 1 }, { unique: true });

const EmployeeReport = mongoose.model('EmployeeReport', reportSchema);
module.exports = EmployeeReport;