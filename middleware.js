// ./middleware.js

var jwt = require('jsonwebtoken');
var config = require('./config');
var nodeRestClient = require('node-rest-client');

exports.authenticateToken = (req, res, next) => {

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode token
    if (token) {

        // verifies secret and checks exp
        jwt.verify(token, config.secret, (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    success: false,
                    message: 'Failed to authenticate token.'
                });
            } else {
                // if everything is good, save roles to request for use in other routes
                req.roles = decoded.roles;
                req.userID = decoded.userID;
                next();
            }
        });

    } else {

        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });

    }
}

exports.authenticateToMedicinesBackend = (req, res, next) => {
    var client = new nodeRestClient.Client();

    var args = {
        data: {
            "Email": config.medicinesManagement.email,
            "Password": config.medicinesManagement.secret
        },
        headers: {
            "Content-Type": "application/json"
        }
    };

    var promise = new Promise((resolve, reject) => { // register
        var url = config.medicinesManagement.url.concat("/Account");
        client.post(url, args, (data, response) => {
            resolve();
        })
    });
    promise.then(() => { // login
        var url = config.medicinesManagement.url.concat("/Account/Token");
        client.post(url, args, (data, response) => {
            req.token = data.token;
            next();
        })
    });
}