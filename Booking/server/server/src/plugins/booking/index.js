
'use strict';

const Boom = require('boom');
const uuid = require('node-uuid');
const Joi = require('joi');
const _ = require('lodash');
const BookingModel = require('../../models/booking');
var mongojs=require("mongojs");
exports.register = (plugin, options, next) => {
	var Booking = require('./booking');
	plugin.expose(Booking);


	plugin.route({
		method: 'POST',
		path: '/api/booking',
		config: {
			tags: ['api'],
			description: 'Save booking data',
			notes: 'Save booking data',
			validate: {
				payload: {
					roomId: Joi.string().required(),
					startDate: Joi.date().required(),
					endDate: Joi.date().required(),
					employeeNo:Joi.string().required()
				}
			}
		},
		handler: function (request, reply) {
			let booking = new BookingModel(request.payload);
			var todayDate=new Date().setUTCHours(0,0,0,0);
			todayDate=new Date(todayDate).toISOString();
			var forTomorrowDate=new Date();
			var TomorrowDate=forTomorrowDate.setDate(forTomorrowDate.getDate()+1);
			var TomorrowDateWithProperFormat=new Date(TomorrowDate);
			BookingModel.find({
				roomId:request.payload.roomId,
				startDate:{
					$gte:todayDate,
					$lt:TomorrowDateWithProperFormat
				}
			}).sort({startDate:1}).exec(function(err, bookingData) { 
				var startDate=new Date(request.payload.startDate);
				var endDate=new Date(request.payload.endDate);
				var presentTimeBookedOrNot=false;
				var i=0;
				//code for checking present time is free or not
				for(i=0;i<bookingData.length;i++){
					var bookingStartDateWithTiming=new Date(bookingData[i].startDate);
					var bookingEndDateWithTiming=new Date(bookingData[i].endDate);
					
					var startDateCheck=false;
					var endDateCheck=false;
					
					var bookingStartDateHours=bookingStartDateWithTiming.getHours(); 
					var bookingStartDateMins=bookingStartDateWithTiming.getMinutes();
					var bookingEndDateHours=bookingEndDateWithTiming.getHours();
					var bookingEndDateMins=bookingEndDateWithTiming.getMinutes();
					var userGivenStartDateHours=startDate.getHours(); 
					var userGivenStartDateMins=startDate.getMinutes();
					var userGivenEndDateHours=endDate.getHours();
					var userGivenEndDateMins=endDate.getMinutes();

					if(userGivenStartDateHours!=bookingStartDateHours){
						if(userGivenStartDateHours>bookingStartDateHours){
							if(userGivenStartDateHours!=bookingEndDateHours){
								if(userGivenStartDateHours<bookingEndDateHours){
									startDateCheck=true;
								}
							}
							else{
								if(userGivenStartDateMins<bookingEndDateMins){
									startDateCheck=true;
								}
							}
						}
					}
					else
					{
						if(userGivenStartDateMins>=bookingStartDateMins){
							if(userGivenStartDateHours!=bookingEndDateHours){
								if(userGivenStartDateHours<bookingEndDateHours){
									startDateCheck=true;
								}
							}
							else
							{
								if(userGivenStartDateMins<bookingStartDateMins){
									startDateCheck=true;
								}
							}

						}
					}



					if(userGivenEndDateHours!=bookingStartDateHours){
						if(userGivenEndDateHours>bookingStartDateHours){
							if(userGivenEndDateHours!=bookingEndDateHours){
								if(userGivenEndDateHours<bookingEndDateHours){
									endDateCheck=true;
								}
							}
							else{
								if(userGivenEndDateMins<=bookingEndDateMins){
									endDateCheck=true;
								}
							}
						}
					}
					else
					{
						if(userGivenEndDateMins>bookingStartDateMins){
							if(userGivenEndDateHours!=bookingEndDateHours){
								if(userGivenEndDateHours<bookingEndDateHours){
									endDateCheck=true;
								}
							}
							else
							{
								if(userGivenEndDateMins<=bookingEndDateMins){
									endDateCheck=true;
								}
							}

						}
					}

					if(startDateCheck||endDateCheck){
						presentTimeBookedOrNot=true;
						break;
					}
				}
				if(presentTimeBookedOrNot){
					reply({
						statusCode: 200,
						message: 'Booking not Saved',
						status:"notavalible"
					});
				}
				else
				{
					booking.save(function (error, response) {
						if (error) {
							reply({
								statusCode: 503,
								message: error
							});
						} else {
							reply({
								statusCode: 200,
								message: 'Booking Saved',
								status:"booked"
							});
						}
					});
				}



			}
			);




		}
	});

	plugin.route({
		method: 'GET',
		config: {
			tags: ['api'],
			description: 'Get all Bookings',
			notes: 'Get all Bookings'
		},
		path: '/api/bookings',
		handler: (request, reply) => {
			BookingModel.find({}, function (error, data) {
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
		method: 'GET',
		path: '/api/booking/{id}',
		config: {
			tags: ['api'],
			description: 'Get booking by Id',
			notes: 'Get booking by Id',
			validate: {
				params: {
					id: Joi.string().required()
				}
			}
		},
		handler: (request, reply) => {
			BookingModel.find({_id: request.params.id}, function (error, data) {
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
		path: '/api/booking/{id}',
		config: {
			tags: ['api'],
			description: 'Remove booking by id',
			notes: 'Remove booking by id',
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
						message: 'Failed to remove booking',
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

	const roomSchema = {
		_id:Joi.string().required(),
		image:Joi.string().required(),
		location:Joi.string().required(),
		name:Joi.string().required(),
		status:Joi.string().required(),
		avalibleTime:Joi.string().required()
	};

	plugin.route({
		method: 'POST',
		path: '/api/getrecentbookings',
		config: {
			tags: ['api'],
			description: 'Save room data',
			notes: 'Save room data',
			validate: {
				payload: {
					roomData:Joi.array().min(1).items(Joi.object(roomSchema)).required()
				}
			}
		},
		handler: function (request, reply) {
			var roomData=request.payload.roomData;
			var roomDataCount=0;
			roomData.forEach(function(element) {

				var todayDate=new Date().setUTCHours(0,0,0,0);
				todayDate=new Date(todayDate).toISOString();
				var forTomorrowDate=new Date();
				var TomorrowDate=forTomorrowDate.setDate(forTomorrowDate.getDate()+1);
				var TomorrowDateWithProperFormat=new Date(TomorrowDate);
				var roomId=element._id;
				BookingModel.find({
					roomId:roomId,
					startDate:{
						$gte:todayDate,
						$lt:TomorrowDateWithProperFormat
					}
				}).sort({startDate:1}).exec(function(err, bookingData) { 
					if(err){
						reply({
							statusCode: 503,
							message: 'Failed to get bookingData',
							data: err
						});
					}
					else{
						if(bookingData.length==0){
							var presentTime=new Date();
							if(presentTime.getHours()>=8&&presentTime.getHours()<20)
							{

								element.status="avalible";
								element.avalibleTime="Avalible Now";
							}
							else
							{

								element.status="unavalible";
								element.avalibleTime="UnAvalible Now";

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

                                            	element.status="avalible";
                                            	element.avalibleTime="Avalible From "+avalibleTimeSlotTime;
                                            	
                                            }
                                            else{

                                            	element.status="unavalible";
                                            	element.avalibleTime="UnAvalible";
                                            }


                                        }
                                        else
                                        {
                                        	
                                        	element.status="avalible";
                                        	element.avalibleTime="Avalible Now";
                                        	

                                        }
                                    }
                                    else
                                    {
                                    	
                                    	element.status="unavalible";
                                    	element.avalibleTime="UnAvalible";
                                    	
                                    }




                                }
                            } 
                            roomDataCount++;
                            if(roomDataCount==roomData.length){
                            	reply({
                            		statusCode: 200,
                            		message: 'Room new Data Fetched Successfully',
                            		data:roomData
                            	});
                            }

                        }
                        );




});






}
});



next();
};

exports.register.attributes = {
	name: 'routes-booking'
};
