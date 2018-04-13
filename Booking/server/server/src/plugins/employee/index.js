
'use strict';

const Boom = require('boom');
const uuid = require('node-uuid');
const Joi = require('joi');
const _ = require('lodash');
const EmployeeModel = require('../../models/employee');
exports.register = (plugin, options, next) => {
    var Employee = require('./employee');
    plugin.expose(Employee);

    
    plugin.route({
        method: 'GET',
        path: '/api/employee/{id}',
        config: {
            tags: ['api'],
            description: 'Get employee by No',
            notes: 'Get Employee by No',
            validate: {
                params: {
                    id: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {
            EmployeeModel.find({employeeNo: request.params.id}, function (error, data) {
                if (error) {
                    reply({
                        statusCode: 503,
                        message: 'Failed to get data',
                        data: error
                    });
                } else {
                    if (data.length === 0) {
                        reply({
                            statusCode: 200,
                            message: 'Employee Not Found',
                            data: data
                        });
                    } else {
                        reply({
                            statusCode: 200,
                            message: 'Employee Details Successfully  Fetched',
                            data: data
                        });
                    }
                }
            });
        }
    })
    
    next();
};

exports.register.attributes = {
    name: 'routes-employee'
};
