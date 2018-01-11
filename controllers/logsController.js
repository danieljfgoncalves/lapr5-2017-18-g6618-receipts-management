/**
 * logsController.js
 * 
 * Controller to deal with logs data.
 */
const request = require('request');
const userServices = require('../services/userServices');
var roles = require('../models/roles');


// GET /api/logs/auth
exports.authLogs = (req, res) => {

    if (!userServices.checkRole(req.user["https://lapr5.isep.pt/roles"], [roles.Role.ADMIN])) {
        return res.status(401).json({
            message: 'Unauthorized User.'
        });
    }
    var page=0;
    if(req.page)
    {
        page = req.page;
    }
    var options = {
        method: 'GET',
        url: 'https://lapr5-3da.eu.auth0.com/api/v2/logs?page='+page+'&per_page=100&q=type%3As%20type%3Ass%20type%3Afu%20type%3Afeccft',
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
        }

        return res.status(200).send(JSON.parse(body));
    });
};