const request = require('request');
const config = require('../config');
const _ = require("underscore");

exports.checkRole = (given, permited) => {

    // here you can check the user's role
    if (given && given.length <= 0) return false;

    return _.some(given, (role) => {

        return _.contains(permited, role);
    });
};

exports.getMyUserInfo = (token) => {

    if (token == undefined) return;

    return new Promise((resolve, reject) => {

        // GET https://lapr5-3da.eu.auth0.com/userinfo
        // Authorization: 'Bearer {ACCESS_TOKEN}'
        var options = {
            method: 'GET',
            url: 'https://lapr5-3da.eu.auth0.com/userinfo',
            headers: {
                authorization: req.headers.authorization,
                'content-type': 'application/json'
            },
            json: true
        };
        request(options, function (error, response, body) {
            if (error) reject(error);
            if (body.error) reject(body.error);

            var userInfoDTO = {

                email: body.email,
                user_id: body.sub,
                username: body.nickname,
                roles: body["https://lapr5.isep.pt/roles"],
                data: body["https://lapr5.isep.pt/user_info"]
            };
            resolve(userInfoDTO);
        });
    });
};

exports.getUser = (apiToken, userId) => {

    if (apiToken == undefined || userId == undefined) return;

    return new Promise((resolve, reject) => {

        var options = {
            method: 'GET',
            url: 'https://lapr5-3da.eu.auth0.com/api/v2/users/' + userId + '?fields=email%2Cusername%2Cuser_id%2Cuser_metadata%2Capp_metadata&include_fields=true',
            headers: {
                authorization: apiToken.token_type + " " + apiToken.access_token,
                'content-type': 'application/json'
            },
            json: true
        };
        request(options, function (error, response, body) {
            if (error) reject(error);
            if (body.error) reject(body.error);

            var userDTO = {
                roles: body.app_metadata.roles,
                userID: body.user_id,
                username: body.username,
                email: body.email,
                mobile: (body.user_metadata) ? body.user_metadata.mobile : undefined
            };
            resolve(userDTO);
        });
    });
};