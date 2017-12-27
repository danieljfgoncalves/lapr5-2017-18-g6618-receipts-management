const config = require('./config');
const mongoMorgan = require('mongo-morgan');
const morganJSON = require('morgan-json');

// *** CUSTOM TOKENS *** //
mongoMorgan.token('host', (req) => {
    return req.headers.host;
});
mongoMorgan.token('origin', (req) => {
    return req.headers.origin;
});
mongoMorgan.token('protocol', (req) => {
    return req.protocol;
});

// *** CUSTOM FORMAT *** //
const format = morganJSON({
    date: ':date[iso]',
    protocol: ':protocol',
    http_version: ':http-version',
    remote: ':remote-addr',
    host: ':host',
    origin:':origin',
    method: ':method',
    url: ':url',
    status: ':status',
    length: ':res[content-length]',
    response_time: ':response-time ms'
});

// *** LOGGER *** //
module.exports = mongoMorgan(config.logger.db, format, { collection: config.logger.collection });