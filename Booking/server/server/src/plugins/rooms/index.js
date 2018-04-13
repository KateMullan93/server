'use strict';

const Boom = require('boom');
const uuid = require('node-uuid');
const Joi = require('joi');
const unirest = require('unirest');
const _ = require('lodash');
var mongojs=require("mongojs");

const RoomModel = require('../../models/rooms');
const BeaconModel=require('../../models/beacon');
const BookingModel=require('../../models/booking');
exports.register = (plugin, options, next) => {

    plugin.route({
        method: 'POST',
        path: '/api/room',
        config: {
            tags: ['api'],
            description: 'Save room data',
            notes: 'Save room data',
            validate: {
                payload: {
                    name: Joi.string().required(),
                    beaconId: Joi.string().required(),
                    location: Joi.string().required()
                }
            }
        },
        handler: function (request, reply) {

            var room = new RoomModel(request.payload);

            room.save(function (error) {
                if (error) {
                    reply({
                        statusCode: 503,
                        message: error
                    });
                } else {
                    reply({
                        statusCode: 201,
                        message: 'Room Saved Successfully'
                    });
                }
            });
        }
    });

    plugin.route({
        method: 'GET',
        config: {
            tags: ['api'],
            description: 'Get all Rooms',
            notes: 'Get all Rooms'
        },
        path: '/api/rooms',
        handler: (request, reply) => {
            RoomModel.find({}, function (error, data) {
                if (error) {
                    reply({
                        statusCode: 503,
                        message: 'Failed to get data',
                        data: error
                    });
                } else {
                    reply({
                        statusCode: 200,
                        message: 'Room Data Successfully Fetched',
                        data: data
                    });
                }
            });
        }
    })

    plugin.route({
        method: 'POST',
        path: '/api/getroom/',
        config: {
            tags: ['api'],
            description: 'Get Room By beaconId',
            notes: 'Get Room By beaconId',
            validate: {
                payload: {
                    employeeNo: Joi.string().required(),
                    beaconId: Joi.string().required()
                }
            }
        },
        handler: (request, reply) => {
            BeaconModel.findOne({beaconId: request.payload.beaconId},function(error,beaconData){
                if(error){
                    reply({
                      statusCode: 503,
                      message: 'Failed to get data',
                      data: error
                  })
                }
                else{

                    RoomModel.findOne({_id: mongojs.ObjectId(beaconData.roomId)}, function (error, roomData) {
                        if (error) {
                            reply({
                                statusCode: 503,
                                message: 'Failed to get data',
                                data: error
                            });
                        } else {


                            var todayDate=new Date().setUTCHours(0,0,0,0);
                            todayDate=new Date(todayDate).toISOString();
                            var forTomorrowDate=new Date();
                            var TomorrowDate=forTomorrowDate.setDate(forTomorrowDate.getDate()+1);
                            var TomorrowDateWithProperFormat=new Date(TomorrowDate);
                            var roomId=mongojs.ObjectId(roomData._id);
                            var employeeNo=request.payload.employeeNo;
                            BookingModel.find({
                                roomId:roomId,
                                startDate:{
                                    $gte:todayDate,
                                    $lt:TomorrowDateWithProperFormat
                                }
                            }).sort({startDate:1}).exec(function(err, bookingData) { 
                                if(bookingData.length==0){
                                    var presentTime=new Date();
                                    if(presentTime.getHours()>=8&&presentTime.getHours()<20)
                                    {
                                        reply({
                                            statusCode: 200,
                                            message: 'booking data fetched',
                                            data: roomData,
                                            status:"avalible",
                                            avalibleTime:"Avalible Now"
                                        });
                                    }
                                    else
                                    {
                                        reply({
                                            statusCode: 200,
                                            message: 'booking data fetched',
                                            data: roomData,
                                            status:"unavalible",
                                            avalibleTime:"UnAvalible Now"
                                        });

                                    }
                                }
                                else
                                {
                                    var presentTime=new Date();
                                    if(presentTime.getHours()>=8&&presentTime.getHours()<20){
                                        var presentTimeBookedOrNot=false;
                                        var i=0;
                                        //code for checking present time is free or not
                                        for(i=0;i<bookingData.length;i++){
                                            var bookingStartDateWithTiming=new Date(bookingData[i].startDate);
                                            var bookingEndDateWithTiming=new Date(bookingData[i].endDate);
                                            if(presentTime>bookingStartDateWithTiming&&presentTime<bookingEndDateWithTiming){
                                                presentTimeBookedOrNot=true;
                                                break;
                                            }
                                        }
                                        if(presentTimeBookedOrNot){
                                            var avalibleTimeSlotFound=false;
                                            var avalibleTimeSlotTime;
                                            //if present time is booked checking for near avalible time
                                            for(i=0;i<bookingData.length;i++){
                                                if(i!=bookingData.length-1){
                                                    var bookingStartDateWithTiming=new Date(bookingData[i+1].startDate);
                                                    var bookingEndDateWithTiming=new Date(bookingData[i].endDate);
                                                    var minsDifference=Math.round(bookingStartDateWithTiming.getTime()-bookingEndDateWithTiming.getTime())/60000;
                                                    if(minsDifference>=1&& presentTime<=bookingEndDateWithTiming){
                                                        avalibleTimeSlotFound=true;
                                                        var minsModifyForUi=new Date(bookingEndDateWithTiming).getMinutes();
                                                        if(minsModifyForUi<10){
                                                            avalibleTimeSlotTime=new Date(bookingEndDateWithTiming).getHours()+":"+"0"+minsModifyForUi;
                                                        }
                                                        else
                                                        {
                                                            avalibleTimeSlotTime=new Date(bookingEndDateWithTiming).getHours()+":"+minsModifyForUi;
                                                        }
                                                        
                                                        break;
                                                    }
                                                }
                                                else
                                                {
                                                    var bookingEndDateWithTimingForLastDoc=new Date(bookingData[i].endDate);
                                                    if(bookingEndDateWithTimingForLastDoc.getHours()<20){
                                                        avalibleTimeSlotFound=true;
                                                        var minsModifyForUi=new Date(bookingEndDateWithTimingForLastDoc).getMinutes();
                                                        if(minsModifyForUi<10){
                                                         avalibleTimeSlotTime=bookingEndDateWithTimingForLastDoc.getHours()+":"+"0"+minsModifyForUi;
                                                     }
                                                     else
                                                     {
                                                        avalibleTimeSlotTime=bookingEndDateWithTimingForLastDoc.getHours()+":"+minsModifyForUi;
                                                    }
                                                    break;
                                                }

                                            }
                                        }

                                        if(avalibleTimeSlotFound){
                                           reply({
                                            statusCode: 200,
                                            message: 'booking data fetched',
                                            data: roomData,
                                            status:"avalible",
                                            avalibleTime:"Avalible From "+avalibleTimeSlotTime
                                        });
                                       }
                                       else{
                                           reply({
                                            statusCode: 200,
                                            message: 'booking data fetched',
                                            data: roomData,
                                            status:"unavalible",
                                            avalibleTime:"UnAvalible"
                                        });
                                       }


                                   }
                                   else
                                   {
                                    reply({
                                        statusCode: 200,
                                        message: 'booking data fetched',
                                        data: roomData,
                                        status:"avalible",
                                        avalibleTime:"Avalible Now"
                                    });

                                }
                            }
                            else
                            {
                                reply({
                                    statusCode: 200,
                                    message: 'booking data fetched',
                                    data: roomData,
                                    status:"unavalible",
                                    avalibleTime:"UnAvalible"
                                });

                            }




                        }
                    }
                    );


}
});


}



});







}
})

plugin.route({
    method: 'PUT',
    path: '/api/room/{id}',
    config: {
        tags: ['api'],
        description: 'Update status for room',
        notes: 'Update status for room',
        validate: {
            params: {
                id: Joi.string().required()
            },
            payload: {
                status: Joi.object({
                    name: Joi.string().required(),
                    bookingId: Joi.string().allow('').optional(),
                    ownerId: Joi.string().allow('').optional()
                })
            }
        }
    },
    handler: (request, reply) => {
        RoomModel.findOneAndUpdate({_id: request.params.id}, request.payload, function (error, data) {
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
                        message: 'Room Not Found',
                        data: data
                    });
                } else {
                    reply({
                        statusCode: 200,
                        message: 'Room Data Successfully Fetched',
                        data: data
                    });
                }
            }
        });
    }
})

plugin.route({
    method: 'DELETE',
    path: '/api/room/{id}',
    config: {
        tags: ['api'],
        description: 'Remove room by id',
        notes: 'Remove room by id',
        validate: {
            params: {
                id: Joi.string().required()
            }
        }
    },
    handler: (request, reply) => {
        RoomModel.findOneAndRemove({_id: request.params.id}, function (error, data) {
            if (error) {
                reply({
                    statusCode: 503,
                    message: 'Failed to remove room',
                    data: error
                });
            } else {

                reply({
                    statusCode: 200,
                    message: 'Room removed Successfully'
                });
            }
        });
    }
})

next();
};

exports.register.attributes = {
    name: 'routes-rooms'
};
