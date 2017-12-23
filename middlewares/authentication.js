// ./authentication.js
const request = require('request');
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const config = require('../config');

// Authentication middleware. When used, the
// access token must exist and be verified against
// the Auth0 JSON Web Key Set
exports.handleToken = jwt({
    // Dynamically provide a signing key
    // based on the kid in the header and 
    // the signing keys provided by the JWKS endpoint.
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://lapr5-3da.eu.auth0.com/.well-known/jwks.json`
    }),

    // Validate the audience and the issuer.
    audience: 'https://receipts-backend-api/',
    issuer: `https://lapr5-3da.eu.auth0.com/`,
    algorithms: ['RS256']
});

// Obtain API's token from Auth0
exports.getApiToken = (req, res, next) => {

    var options = {
        method: 'POST',
        url: 'https://lapr5-3da.eu.auth0.com/oauth/token',
        headers: { 'content-type': 'application/json' },
        body:
            {
                grant_type: 'client_credentials',
                client_id: req.headers.client_id,  //   'JlBREWOiSAE87o0MZjymMkH8z5wPX7QW',
                client_secret: req.headers.client_secret,  //   'xVeQAFK7NeZZXSJ7ZQeA2H6ouILGkGIyxBNKVPo-8W5tzDC-0o_vIwF96veW9V7b',
                audience: 'https://lapr5-3da.eu.auth0.com/api/v2/'
            },
        json: true
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        req.accessToken = body;
        next();
    });
}; 

exports.authenticateMedicinesManagement = (req, res, next) => {

    var options = {
        method: 'POST',
        url: 'https://lapr5-3da.eu.auth0.com/oauth/token',
        headers: { 'content-type': 'application/json' },
        body: 
        {
            grant_type: 'client_credentials',
            client_id: req.headers.client_id,  //   'JlBREWOiSAE87o0MZjymMkH8z5wPX7QW',
            client_secret: req.headers.client_secret,  //   'xVeQAFK7NeZZXSJ7ZQeA2H6ouILGkGIyxBNKVPo-8W5tzDC-0o_vIwF96veW9V7b',
            audience:"https://medicines-backend-api/"
        },
        json:true
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        req.medicinesToken = body;
        next();
    });
    
};