const mongoose = require('mongoose');

const payslipSchema = mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true },
    year: { type: Number, required: true },
    basic_salary: { type: Number, required: true },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    net_salary: { type: Number, required: true },
    generated_at: { type: Date, default: Date.now },
}, {
    timestamps: true,
});

payslipSchema.index({ user_id: 1, month: 1, year: 1 }, { unique: true });

const Payslip = mongoose.model('Payslip', payslipSchema);
module.exports = Payslip;