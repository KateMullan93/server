'use strict';

const Hapi = require('hapi');
const Good = require('good');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
const Pack = require('../package');
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
var mongojs=require("mongojs");
const server = new Hapi.Server();
//server.connection({ port: 3000 });
server.connection({
    port: 3000,
    //host: '34.244.184.254'
 });
const swagOptions = {
	info: {
		title: 'Test API Documentation',
		version: Pack.version,
	},
};


const mongoose = require('mongoose');

//mongoose.connect('mongodb://kate:password@ec2-34-244-184-254.eu-west-1.compute.amazonaws.com/meetingroomdb');


// Connect To Database
mongoose.Promise = global.Promise; 
//mongoose.connect("mongodb://172.29.123.218:27017/roombookingdb",{useMongoClient:true});
mongoose.connect("mongodb://ec2-34-244-184-254.eu-west-1.compute.amazonaws.com/roombookingdb",{useMongoClient:true});

// On Connection
mongoose.connection.on('connected', () => {
//onsole.log('Connected to database '+"mongodb:/172.29.123.218:27017/roombookingdb");
	console.log('Connected to database '+"mongodb://ec2-34-244-184-254.eu-west-1.compute.amazonaws.com/roombookingdb");
	

});

// On Error
mongoose.connection.on('error', (err) => {
	console.log('Database error: '+err);
});

const app = express();

// CORS Middleware
app.use(cors());

// CORS (Cross-Origin Resource Sharing) headers to support Cross-site HTTP requests
app.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	next();
});


// Body Parser Middleware
app.use(bodyParser.json({limit:1024*1024*20, type:'application/json'}));


const RoomModel = require('./plugins/rooms');
const BookingModel = require('./plugins/booking');
const EmployeeModel = require('./plugins/employee');
const BeaconModel= require('./plugins/beacons');

server.route({
	method: 'GET',
	path: '/',
	handler: (req, reply) => {
		reply('Booking');
	}
})

server.register([
	Inert,
	Vision,
	{
		register: require('hapi-swagger'),
		options: swagOptions
	},
	{ register: RoomModel },
	{ register: BookingModel},
	{ register: EmployeeModel},
	{ register: BeaconModel},
	{
		register: Good,
		options: {
			reporters: [{
				reporter: require('good-console'),
				events: {
					response: '*',
					log: '*'
				}

			}]
		}
	}
	], (err) => {

		if(err) {
			console.log(err);
		}
		server.start((err) => {
			if(err) {
				console.log(err);
			}
			server.log('Server running at: ', server.info.uri);
		});
	});
