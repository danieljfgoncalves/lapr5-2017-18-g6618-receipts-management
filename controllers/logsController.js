/**
 * logsController.js
 * 
 * Controller to deal with logs data.
 */
const request = require('request');
const userServices = require('../services/userServices');
const MongoClient = require('mongodb').MongoClient;
const config = require('../config'); 
const roles = require('../models/roles');


// GET /api/logs/auth
exports.authLogs = (req, res) => {

    if (!userServices.checkRole(req.user["https://lapr5.isep.pt/roles"], [roles.Role.ADMIN])) {
        return res.status(401).json({
            message: 'Unauthorized User.'
        });
    }

    let url = 'https://lapr5-3da.eu.auth0.com/api/v2/logs';
    var query = req.originalUrl.substr(req.originalUrl.indexOf("?") + 1);
    if (query !== "/api/logs/auth") {
        url += '?' + query;
    }

    var options = {
        method: 'GET',
        url: url,
        headers: {
            authorization: 'Bearer ' + req.accessToken.access_token,
            'content-type': 'application/json'
        }
    };
    request(options, function (error, response, body) {
        if (error) {
            return res.status(400).send(error);
        }
        if (body.error) {
            return res.status(400).json({
                error: body.error,
                description: body.error_description
            });
        }
        return res.status(200).send(JSON.parse(body));
    });
};

// GET /api/logs/http/requests
exports.getHttpRequests = (req, res) => {
    MongoClient.connect(config.logger.db, 
    function(err1, db) {
        if(err1) {
            return res.status(400).send(err1);
        }

        let limit = 100;
        if (req.query.limit && !isNaN(req.query.limit)) {
            limit = parseInt(req.query.limit);
        }

        var query = {};
        if (req.query.where) {
            try {
                query = JSON.parse(req.query.where);
            } catch(e) {
                query = {};
            }
        }

        var collection = db.collection('request-logs');
        collection.find(query).limit(limit).toArray(function(err2, logs) {
            if(err2) {
                return res.status(400).send(err2);
            }
            return res.send(logs);
        });
    });
}