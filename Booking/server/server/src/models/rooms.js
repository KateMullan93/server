const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoomSchema = new Schema({
	name: String,
	location: String,
	image:String
});

module.exports = mongoose.model('rooms', RoomSchema);

