
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BeaconSchema = new Schema({
	beaconId: String,
	roomId: String,
	uuid: String,
	major: Number,
	minor: Number
});

module.exports = mongoose.model('beacon', BeaconSchema);
