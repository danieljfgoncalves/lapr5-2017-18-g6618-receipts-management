const config = require('../config');
const TMClient = require('textmagic-rest-client');
const sms = new TMClient(config.smsService.username, config.smsService.api_key);

module.exports = sms;