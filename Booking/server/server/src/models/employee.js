const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EmployeeSchema = new Schema({
    employeeNo: String,
    firstName: String,
    LastName: String
});

module.exports = mongoose.model('employee', EmployeeSchema);
