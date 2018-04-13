
'use strict';

const Boom = require('boom');
const uuid = require('node-uuid');
const Joi = require('joi');
const _ = require('lodash');
const BeaconModel = require('../../models/beacon');


exports.register = (plugin, options, next) => {

    var Beacon = require('./beacons');

    plugin.expose(Beacon);


    plugin.route({
        method: 'GET',
        config: {
            tags: ['api'],
            description: 'Get all Beacons',
            notes: 'Get all Beacons'
        },
        path: '/api/beacons',
        handler: (request, reply) => {
            BeaconModel.find({}, function (error, data) {
                if (error) {
                    reply({
                        statusCode: 503,
                        message: 'Failed to get data',
                        data: error
                    });
                } else {
                    reply({
                        statusCode: 200,
                        message: 'Beacon Data Successfully Fetched',
                        data: data
                    });
                }
            });
        }
    })
    next();
};

exports.register.attributes = {
    name: 'routes-beacons'
};
