var TMClient = require('textmagic-rest-client');
sms = new TMClient(config.smsService.username, config.smsService.api_key);

module.exports = sms;