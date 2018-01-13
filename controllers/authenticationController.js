// controllers/authentication.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Config = require('../config');
const Roles = require('../models/roles');
const request = require('request');
const _ = require("underscore");
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// POST /api/signup/
exports.signup = (req, res) => {

    var mfa_secret;
    if(req.body.mfa) {

        const options = {
            issuer: `Receipts Management`,
            name: `RM (${req.body.email})`,
            length: 64
        }
        const { base32, otpauth_url } = speakeasy.generateSecret(options)
        mfa_secret = {
            enrolled: true,
            secret: base32,
            otp: otpauth_url
        }
    }

    var options = {
        method: 'POST',
        url: 'https://lapr5-3da.eu.auth0.com/api/v2/users',
        headers: {
            authorization: 'Bearer ' + req.accessToken.access_token,
            'content-type': 'application/json'
        },
        body: {
            "connection": "lapr5-user-db",
            "email": req.body.email,
            "username": req.body.username,
            "password": req.body.password,
            // "phone_number": "+199999999999999", // FIXME: Need to setup guardian first
            "user_metadata": {
                "mobile": req.body.mobile
            },
            "app_metadata": {
                "roles": ['patient'],
                "lastConsolidation": new Date(),
                "mfa": mfa_secret
            }
        },
        json: true
    };
    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        if (body.error) {
            return res.status(500).json({
                error: body
            });
        }
        if(mfa_secret) {
            QRCode.toDataURL(mfa_secret.otp, gotQrCode)
            function gotQrCode(err, qr) {
                if (err) {
                    return res.status(500).json({
                        error: body.error,
                        description: body.error_description
                    });
                }
                return res.status(201).json({
                    message: "User Signed up successfully [2FA]",
                    created_at: body.created_at,
                    user_id: body.user_id,
                    username: body.username,
                    email: body.email,
                    qr: qr,
                    otp: mfa_secret.otp
                });
            }
        } else {
            return res.status(201).json({
                message: "User Signed up successfully",
                created_at: body.created_at,
                user_id: body.user_id,
                username: body.username,
                email: body.email
            });
        }
    });
};

// POST /api/authnticate/mfa
exports.mfaAuthenticate = (req, res) => {

    const success = speakeasy.totp.verify({
        secret: req.body.secret,
        encoding: 'base32',
        token: req.body.token
    });

    if(success) {
        res.status(200).json({mfa:true});
    } else {
        res.status(401).json({ mfa: false });
    }
}

// DELETE /api/deleteAccount
exports.deleteUser = (req, res) => {
    var options = {
        method: 'DELETE',
        url: 'https://lapr5-3da.eu.auth0.com/api/v2/users/' + req.params.id,
        headers: {
            authorization: 'Bearer ' + req.accessToken.access_token,
            'content-type': 'application/json'
        }
    };
    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        if (body.error) {
            return res.status(500).json({
                error: body.error,
                description: body.error_description
            });
        } else {
            console.log(response);
            return res.status(response.statusCode).send(response.body);
        }
    });
};

// POST /api/authenticate/
exports.authenticate = (req, res) => {

    var options = {
        method: 'POST',
        url: 'https://lapr5-3da.eu.auth0.com/oauth/token',
        headers: {
            'content-type': 'application/json'
        },
        body: {
            grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
            username: req.body.username,
            password: req.body.password,
            audience: 'https://receipts-backend-api/',
            scope: 'openid',
            client_id: 'JlBREWOiSAE87o0MZjymMkH8z5wPX7QW',
            client_secret: 'xVeQAFK7NeZZXSJ7ZQeA2H6ouILGkGIyxBNKVPo-8W5tzDC-0o_vIwF96veW9V7b',
            realm: 'lapr5-user-db'
        },
        json: true
    };
    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        if (body.error) {
            res.status(500).json({
                error: body.error,
                description: body.error_description
            });
        } else {
            res.status(201).json({
                message: "User Authenticated! Enjoy your token",
                token: body.access_token,
                token_type: body.token_type,
            });
        }
    });

};

// GET /api/users/
exports.getUsers = (req, res) => {

    // https://lapr5-3da.eu.auth0.com/api/v2/users?sort=email%3A1&connection=lapr5-user-db&
    // fields=email%2Cusername%2Cuser_id%2Cuser_metadata%2Capp_metadata&include_fields=true&search_engine=v1
    var options = {
        method: 'GET',
        url: 'https://lapr5-3da.eu.auth0.com/api/v2/users?sort=email%3A1&connection=lapr5-user-db&fields=email%2Cusername%2Cuser_id%2Cuser_metadata%2Capp_metadata&include_fields=true&search_engine=v1',
        headers: {
            authorization: 'Bearer ' + req.accessToken.access_token,
            'content-type': 'application/json'
        },
        json: true
    };
    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        if (body.error) {
            res.status(500).json({
                error: body.error,
                description: body.error_description
            });
        } else {
            var list = _.map(body, (user) => {
                var userDTO = {
                    roles: user.app_metadata.roles,
                    userID: user.user_id,
                    username: user.username,
                    email: user.email,
                    mobile: (user.user_metadata) ? user.user_metadata.mobile : undefined
                };
                return userDTO;
            });

            res.status(201).json(list);
        }
    });
};

// GET /api/users/{id}
exports.getUser = (req, res) => {

    // https://lapr5-3da.eu.auth0.com/api/v2/users/auth0%7C5a393df77b89183611bb3d46?fields=email%2Cusername%2Cuser_id%2C
    // user_metadata%2Capp_metadata&include_fields=true
    var options = {
        method: 'GET',
        url: 'https://lapr5-3da.eu.auth0.com/api/v2/users/' + req.params.id + '?fields=email%2Cusername%2Cuser_id%2Cuser_metadata%2Capp_metadata&include_fields=true',
        headers: {
            authorization: 'Bearer ' + req.accessToken.access_token,
            'content-type': 'application/json'
        },
        json: true
    };
    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        if (body.error) {
            res.status(500).json({
                error: body.error,
                description: body.error_description
            });
        } else {
            var userDTO = {
                roles: body.app_metadata.roles,
                userID: body.user_id,
                username: body.username,
                email: body.email,
                mobile: (body.user_metadata) ? body.user_metadata.mobile : undefined
            };

            res.status(201).json(userDTO);

        }
    });
};