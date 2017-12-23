// controllers/patientController.js

var roles = require('../models/roles');
var MedicalReceipt = require('../models/medicalReceipt');
const request = require('request');
const _ = require("underscore");
const userServices = require('../services/userServices');

// GET /api/Patient/{id}/Prescriptions/tofill/{?data} 
exports.get_prescriptions_to_fill_until_date = (req, res) => {

    var b1 = userServices.checkRole(req.user["https://lapr5.isep.pt/roles"], [roles.Role.ADMIN]);
    var b2 = req.user["https://lapr5.isep.pt/roles"].includes(roles.Role.PATIENT) && req.user.sub == req.params.id;
    if (!(b1 || b2)) {
        res.status(401).json({
            message: 'Unauthorized User.'
        });
        return;
    }

    MedicalReceipt.find({"patient":req.params.id}, (err, docs) => {
        if (!docs) {
            res.status(404).json({"message":"Medical Receipts Not Found"});
            return;
        }
        if (err) {
            res.status(500).send(err);
            return;
        }

        var receipts = [];
        docs.forEach( mr => {
            var prescriptions = [];
            mr._doc.prescriptions.forEach( p => {
                var availableFills = p._doc.presentation.quantity;
                p._doc.fills.forEach( element => {
                    availableFills -= element.quantity;
                });
                if (availableFills <= 0) {
                    return;
                }

                var dateFilter = new Date(req.query.date);
                var boolDate = isNaN(dateFilter.getDate());
                var boolNotExpired = p._doc.expirationDate < dateFilter;
                if (boolDate || boolNotExpired) {

                    // extra - filter by given fields
                    var fields = req.query.fields;
                    if (fields) { 
                        var prescriptionDTO = {};
                        var fieldsArray = fields.split(",");
                        for(var i=0; i<fieldsArray.length; i++) {
                            prescriptionDTO[fieldsArray[i]] = p[fieldsArray[i]];
                        }
                        prescriptions.push(prescriptionDTO);
                    }
                    else {
                        prescriptions.push(p);
                    }
                }
            });

            var receipt = {
                receipt_id: mr.id,
                prescriptions: prescriptions
            };
            receipts.push(receipt);
        });

        if (receipts.length <= 0) {
            res.status(404).json({
                "message":"Prescriptions not found with then given criterias."
            });
            return;
        }
        res.status(200).json(receipts);
    });
};

exports.get_patients = (req, res) => {

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

            var patients = _.filter(body, (user) => {
                return user.app_metadata.roles.includes('patient');
            });

            var list = _.map(patients, (user) => {
                var patientDTO = {
                    userID: user.user_id,
                    username: user.username,
                    email: user.email,
                    mobile: (user.user_metadata) ? user.user_metadata.mobile : undefined
                };
                return patientDTO;
            });

            res.status(201).json(list);
        }
    });
};