const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BookingSchema = new Schema({
	employeeNo: String,
	roomId:String,
	startDate:Date,
	endDate:Date
});

module.exports = mongoose.model('booking', BookingSchema);
