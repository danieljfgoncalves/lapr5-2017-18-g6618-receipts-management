// controllers/medicalReceiptController.js

var roles = require('../models/roles');
var MedicalReceipt = require('../models/medicalReceipt');
var config = require('../config');
var nodeRestClient = require('node-rest-client');
var async = require('async');
var medicinesClient = require('../services/medicinesRequests');
var mongoose = require('mongoose');
var Promise = require('bluebird');
mongoose.Promise = Promise;
const email = require('../services/email');
const sms = require('../services/sms');
const moment = require('moment');
const auth = require('./authenticationController');
const request = require('request');
const userServices = require('../services/userServices');

// GET /api/medicalReceipts
exports.get_medical_receipts_list = function (req, res) {

    if (!userServices.checkRole(req.user["https://lapr5.isep.pt/roles"], [roles.Role.ADMIN, roles.Role.PATIENT, roles.Role.PHYSICIAN])) {
        return res.status(401).json({
            message: 'Unauthorized User.'
        });
    }

    var query = {};
    if (userServices.checkRole(req.user["https://lapr5.isep.pt/roles"], [roles.Role.PHYSICIAN])) {
        query = {
            "physician": req.user.sub
        };
    } else if (userServices.checkRole(req.user["https://lapr5.isep.pt/roles"], [roles.Role.PATIENT])) {
        query = {
            "patient": req.user.sub
        };
    }

    MedicalReceipt.find(query, (err, medicalReceipts) => {
        if (err) {
            return res.status(500).json({
                message: "Internal Error.",
                error: err
            });
        }
        var mrs = [];
        async.each(medicalReceipts, (medicalReceipt, callback) => {
            Promise.join(
                userServices.getUser(req.accessToken, medicalReceipt.patient),
                userServices.getUser(req.accessToken, medicalReceipt.physician),
                (patient, physician) => {
                    var medicalReceiptDTO = {
                        "_id": medicalReceipt._id,
                        "patient": patient,
                        "physician": physician,
                        "prescriptions": medicalReceipt.prescriptions,
                        "creationDate": medicalReceipt.creationDate
                    };
                    // remove roles from users
                    delete medicalReceiptDTO.patient.roles;
                    delete medicalReceiptDTO.physician.roles;

                    mrs.push(medicalReceiptDTO);
                    callback();
                });

        }, err2 => {
            if (err2) {
                return res.status(500).json({
                    error: err2
                });
            }
            return res.status(200).json(mrs);
        });
    });
};

// GET /api/medicalReceipts/{id}
exports.get_medical_receipt = function (req, res) {

    MedicalReceipt.findById(req.params.id, function (err, medicalReceipt) {
        if (err) {
            return res.status(400).json({error: err});
        }
        if (!medicalReceipt) {
            return res.status(404).json({message: 'Medical receipt not found.'});
        }

        var b1 = userServices.checkRole(req.user["https://lapr5.isep.pt/roles"], [roles.Role.ADMIN, roles.Role.PHARMACIST]);
        var b2 = req.user["https://lapr5.isep.pt/roles"].includes(roles.Role.PATIENT) && req.user.sub == medicalReceipt.patient;
        var b3 = req.user["https://lapr5.isep.pt/roles"].includes(roles.Role.PHYSICIAN) && req.user.sub == medicalReceipt.physician;
        if ( !(b1 || b2 || b3) ) {
            return res.status(401).json({
                message: 'Unauthorized User.'
            });
        }

        // medicalReceipt.patient
        // medicalReceipt.physician
        Promise.join(
            userServices.getUser(req.accessToken, medicalReceipt.patient),
            userServices.getUser(req.accessToken, medicalReceipt.physician),
            (patient, physician) => {

            var medicalReceiptDTO = {
                "_id": medicalReceipt._id,
                "patient": patient,
                "physician": physician,
                "prescriptions": medicalReceipt.prescriptions,
                "creationDate": medicalReceipt.creationDate
            };
            // remove roles from users
            delete medicalReceiptDTO.patient.roles;
            delete medicalReceiptDTO.physician.roles;

            return res.status(200).json(medicalReceiptDTO);
        });
    });
};

// POST /api/medicalReceipts
exports.post_medical_receipt = function (req, res) {

    if (!userServices.checkRole(req.user["https://lapr5.isep.pt/roles"], [roles.Role.ADMIN, roles.Role.PHYSICIAN])) {
        return res.status(401).json({
            message: 'Unauthorized User.'
        });
    }

    var medicalReceipt = new MedicalReceipt();

    medicalReceipt.creationDate = req.body.creationDate;
    medicalReceipt.physician = req.user.sub;
    medicalReceipt.patient = req.body.patient;

    async.each(req.body.prescriptions, (item, callback) => {

            var args = {
                headers: {
                    "Authorization": "Bearer " + req.medicinesToken.access_token,
                    'content-type': 'application/json'
                }
            };

            new Promise((resolve, rejected) => {
                resolve(medicinesClient.getMedicineData(args, item.presentation, item.medicine, item.posology));
            }).then((data) => {

                if (data.error) {
                    return res.status(data.statusCode).send(data);
                }

                var _presentation_id = new mongoose.mongo.ObjectId(data.presentation.id);
                var prescription = {
                    "expirationDate": item.expirationDate,
                    "drug": data.drug,
                    "medicine": data.medicine,
                    "quantity": item.quantity,
                    "presentation": {
                        "_id": _presentation_id,
                        "form": data.presentation.form,
                        "concentration": data.presentation.concentration,
                        "quantity": data.presentation.quantity
                    }
                };

                if (item.posology != undefined) {
                    prescription.prescribedPosology = {
                        "quantity": data.posology.dosage,
                        "technique": data.posology.technique,
                        "interval": data.posology.interval,
                        "period": data.posology.period
                    };
                } else {
                    prescription.prescribedPosology = {
                        "quantity": item.prescribedPosology.dosage,
                        "technique": item.prescribedPosology.technique,
                        "interval": item.prescribedPosology.interval,
                        "period": item.prescribedPosology.period
                    };
                }
                medicalReceipt.prescriptions.push(prescription);
                callback();
            });
        },
        (error) => {
            // save the medical receipt and check for errors
            medicalReceipt.save(err => {
                if (err) {
                    return res.status(500).json({
                        error: err
                    });
                }

                Promise.join(
                    userServices.getUser(req.accessToken, req.body.patient),
                    userServices.getUser(req.accessToken, req.user.sub),
                    async(patient, physician) => {
                        // send sms // put directly in mlabs "mobile": "+351936523509" because of credit
                        if (patient.mobile) {
                            var text = 'Hello ' + patient.name + ',\n' +
                                'Your medical receipt has been issue and is available since ' +
                                moment(medicalReceipt.creationDate).format("dddd, MMMM Do YYYY") +
                                '.\n\nRegards,\n Dr. ' + physician.name;

                            await sms.Messages.send({
                                text: text,
                                phones: patient.mobile
                            }, function (err, res) {
                                console.log('SMS sent: error {', err, '} res:', res);
                            });
                        }

                        // send mail with defined transport object
                        await email.transporter.sendMail(email.mailCreatedRM(medicalReceipt, patient, physician), (error, info) => {
                            if (error) {
                                console.log(error);
                                return res.status(201).json({
                                    message: 'Medical Receipt Created, but email notification failed!'
                                });
                            }
                            console.log('Email sent: %s', info.messageId);
                            return res.status(201).json({
                                message: 'Medical Receipt Created!'
                            });
                        });
                    });
            });
        });
};

// PUT /api/medicalReceipts/{id}
exports.put_medical_receipt = async function (req, res) {

    var physicianID;
    await MedicalReceipt.findById(req.params.id, function (err, medicalReceipt) {
        physicianID = medicalReceipt.physician;
        var hasFills = false;
        medicalReceipt.prescriptions.forEach(element => {
            hasFills |= element.fills.length > 0;
        });
        if (hasFills || !medicalReceipt) {
            res.status(403).send({
                message: 'Update Forbidden'
            });
            return;
        }
    });

    var b1 = userServices.checkRole(req.user["https://lapr5.isep.pt/roles"], [roles.Role.ADMIN]);
    var b2 = req.user["https://lapr5.isep.pt/roles"].includes(roles.Role.PHYSICIAN) && req.user.sub == physicianID;
    if (!(b1 || b2)) {
        res.status(401).json({
            message: 'Unauthorized User.'
        });
        return;
    }

    var newPrescriptions = [];
    async.each(
        req.body.prescriptions,

        (item, callback) => {

            var args = {
                headers: {
                    "Authorization": "Bearer " + req.medicinesToken.access_token,
                    'content-type': 'application/json'
                }
            };

            new Promise((resolve, rejected) => {
                resolve(medicinesClient.getMedicineData(args, item.presentation, item.medicine, item.posology));
            }).then((data) => {

                if (data.error) {
                    return res.status(data.statusCode).send(data);
                }

                var prescription = {
                    "expirationDate": item.expirationDate,
                    "drug": data.drug,
                    "medicine": data.medicine,
                    "quantity": item.quantity,
                    "presentation": {
                        "form": data.presentation.form,
                        "concentration": data.presentation.concentration,
                        "quantity": data.presentation.quantity
                    }
                };

                if (item.posology != undefined) {
                    prescription.prescribedPosology = {
                        "quantity": data.posology.dosage,
                        "technique": data.posology.technique,
                        "interval": data.posology.interval,
                        "period": data.posology.period
                    };
                } else {
                    prescription.prescribedPosology = {
                        "quantity": item.prescribedPosology.dosage,
                        "technique": item.prescribedPosology.technique,
                        "interval": item.prescribedPosology.interval,
                        "period": item.prescribedPosology.period
                    };
                }
                newPrescriptions.push(prescription);
                callback();
            });
        },
        error => {
            // update the medical receipt and check for errors
            MedicalReceipt.findOneAndUpdate({
                _id: req.params.id
            }, {
                physician: req.user.sub,
                patient: req.body.patient,
                creationDate: req.body.creationDate,
                prescriptions: newPrescriptions
            }, (err, medicalReceipt) => {

                if (err) {
                    res.status(500).json({
                        error: err
                    });
                }

                Promise.join(
                    userServices.getUser(req.accessToken, req.body.patient),
                    userServices.getUser(req.accessToken, req.user.sub),
                    (patient, physician) => {
                        // send mail with defined transport object
                        email.transporter.sendMail(email.mailUpdatedRM(medicalReceipt, patient, physician), (error, info) => {
                            if (error) {
                                res.status(200).json({
                                    message: 'Medical Receipt Updated, but email notification failed!'
                                });
                                return;
                            }
                            console.log('Email sent: %s', info.messageId);
                            res.status(200).json({
                                message: 'Medical Receipt Updated!'
                            });
                        });
                    });
            });
        });
}

// DELETE /api/medicalReceipts/{id}
exports.delete_medical_receipt = function (req, res) {

    if (!userServices.checkRole(req.user["https://lapr5.isep.pt/roles"], [roles.Role.ADMIN])) {
        res.status(401).json({
            message: 'Unauthorized User.'
        });
        return;
    }

    MedicalReceipt.remove({
        _id: req.params.id
    }, function (err, medicalReceipt) {
        if (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
        res.status(200).json({
            success: true,
            message: 'Medical Receipt Deleted'
        });
    });
}

// GET /api/MedicalReceipts/{id}/Prescriptions
exports.get_prescriptions_by_id = function (req, res) {

    MedicalReceipt.findById(req.params.id, function (err, medicalReceipt) {
        if (err) {
            res.json({
                error: err
            });
        }

        var b1 = userServices.checkRole(req.user["https://lapr5.isep.pt/roles"], [roles.Role.ADMIN, roles.Role.PHARMACIST]);
        var b2 = req.user["https://lapr5.isep.pt/roles"].includes(roles.Role.PATIENT) && req.user.sub == medicalReceipt.patient;
        var b3 = req.user["https://lapr5.isep.pt/roles"].includes(roles.Role.PHYSICIAN) && req.user.sub == medicalReceipt.physician;
        if (b1 || b2 || b3) {

            res.status(200).json(medicalReceipt.prescriptions);
        } else {
            res.status(401).json({
                message: 'Unauthorized User.'
            });
        }
    });
}

// POST /api/MedicalReceipts/{id1}/Prescriptions/{id2}/Fills
exports.post_fill_prescription = (req, res) => {
    if (!userServices.checkRole(req.user["https://lapr5.isep.pt/roles"], [roles.Role.ADMIN, roles.Role.PHARMACIST])) {
        return res.status(401).json({message:'Unauthorized User.'});
    }

    if (!req.body.quantity) {
        return res.status(400).json({message:'Quantity is required!'});
    }
    if (isNaN(req.body.quantity)) {
        return res.status(400).json({message:'Quantity must be a number!'});
    }
    if (+req.body.quantity < 1) {
        return res.status(400).json({message:'Quantity must be bigger than 0!'});
    }

    MedicalReceipt.findById(req.params.id1, (err, medicalReceipt) => {
        if (err) {
            res.json({error: err});
            return;
        }

        var prescription = medicalReceipt._doc.prescriptions.find(e => e._id == req.params.id2);
        if (!prescription) {
            res.status(404).json({message:"The prescription doesn't exists."});
            return;
        }

        var availableFills = prescription._doc.quantity;
        prescription._doc.fills.forEach(element => {
            availableFills -= element.quantity;
        });

        if (req.body.quantity > availableFills) {
            res.status(403).json({message:"The quantity is bigger than the available [Remaining: " + availableFills + "]."});
            return;
        }

        prescription._doc.fills.push(req.body);
        medicalReceipt.save(function (err) {
            if (err) {
                res.json({error: err});
            }
            res.status(200).json({
                message: 'Presciption Filled!',
                availableQty: availableFills - req.body.quantity,
                medicalReceipt: medicalReceipt._id,
                prescription: prescription._id
            });
        });
    });
}

// POST /api/medicalReceipts/{id1}/Prescriptions/
exports.post_prescription = function (req, res) {

    MedicalReceipt.findById(req.params.id, function (err, medicalReceipt) {
        if (err) {
            res.json({
                error: err
            });
        }

        var b1 = userServices.checkRole(req.user["https://lapr5.isep.pt/roles"], [roles.Role.ADMIN]);
        var b2 = userServices.checkRole(req.user["https://lapr5.isep.pt/roles"], [roles.Role.PHYSICIAN]) &&
            req.user.sub == medicalReceipt.physician;
        if (! (b1 || b2) ) {
            res.status(401).json({
                message: 'Unauthorized User.'
            });
            return;
        }

        var args = {
            headers: {
                "Authorization": "Bearer " + req.medicinesToken.access_token,
                'content-type': 'application/json'
            }
        };

        new Promise((resolve, rejected) => {
            resolve(medicinesClient.getMedicineData(args, req.body.presentation, req.body.medicine, req.body.posology));
        }).then((data) => {

            if (data.error) {
                return res.status(data.statusCode).send(data);
            }

            var prescription = {
                "expirationDate": req.body.expirationDate,
                "drug": data.drug,
                "medicine": data.medicine,
                "quantity": req.body.quantity,
                "presentation": {
                    "form": data.presentation.form,
                    "concentration": data.presentation.concentration,
                    "quantity": data.presentation.quantity
                }
            };

            if (req.body.posology != undefined) {
                prescription.prescribedPosology = {
                    "quantity": data.posology.dosage,
                    "technique": data.posology.technique,
                    "interval": data.posology.interval,
                    "period": data.posology.period
                };
            } else {
                prescription.prescribedPosology = {
                    "quantity": req.body.prescribedPosology.dosage,
                    "technique": req.body.prescribedPosology.technique,
                    "interval": req.body.prescribedPosology.interval,
                    "period": req.body.prescribedPosology.period
                };
            }
            medicalReceipt.prescriptions.push(prescription);
            // save the medical receipt and check for errors
            medicalReceipt.save(err => {
                if (err) {
                    res.status(500).json({
                        error: err
                    });
                }
                res.status(201).json({
                    message: 'Prescription Created & Added to Medical Receipt!'
                });
            });
        });
    });

}

// GET /api/medicalReceipts/{id}/Prescriptions/{id}
exports.get_prescription_by_id = function (req, res) {

    MedicalReceipt.findById(req.params.receiptId, function (err, medicalReceipt) {
        if (err) {
            res.json({
                error: err
            });
        }

        var b1 = userServices.checkRole(req.user["https://lapr5.isep.pt/roles"], [roles.Role.ADMIN, roles.Role.PHARMACIST]);
        var b2 = req.user["https://lapr5.isep.pt/roles"].includes(roles.Role.PATIENT) && req.user.sub == medicalReceipt.patient;
        var b3 = req.user["https://lapr5.isep.pt/roles"].includes(roles.Role.PHYSICIAN) && req.user.sub == medicalReceipt.physician;
        if (b1 || b2 || b3) {

            var prescription = medicalReceipt.prescriptions.id(req.params.prescId);

            if (!prescription) {
                res.status(404).json({
                    message: "The prescription doesn't exists."
                });
                return;
            }

            res.status(200).json(prescription);
        } else {
            res.status(401).json({
                message: 'Unauthorized User.'
            });
        }
    });
}

// // PUT /api/medicalReceipts/{id}/Prescriptions/{id}
exports.put_prescription_by_id = function (req, res) {

    MedicalReceipt.findById(req.params.receiptId, function (err, medicalReceipt) {
        if (err) {
            res.status(500).json({
                error: err
            });
        }

        var b1 = userServices.checkRole(req.user["https://lapr5.isep.pt/roles"], [roles.Role.ADMIN]);
        var b2 = req.user["https://lapr5.isep.pt/roles"].includes(roles.Role.PHYSICIAN) && req.user.sub == medicalReceipt.physician;
        if (b1 || b2) {

            var prescription = medicalReceipt.prescriptions.id(req.params.prescId);

            if (!prescription) {
                res.status(404).json({
                    message: "The prescription doesn't exists."
                });
                return;
            } else if (prescription.fills.length > 0) {
                res.status(403).send({
                    message: 'The prescription has been filled & can\'t be changed'
                });
                return;
            }

            var args = {
                headers: {
                    "Authorization": "Bearer " + req.medicinesToken.access_token,
                    'content-type': 'application/json'
                }
            };

            new Promise((resolve, rejected) => {
                resolve(medicinesClient.getMedicineData(args, req.body.presentation, req.body.medicine, req.body.posology));
            }).then((data) => {

                if (data.error) {
                    return res.status(data.statusCode).send(data);
                }

                if (req.body.expirationDate) prescription.expirationDate = req.body.expirationDate;
                if (data.drug) prescription.drug = data.drug.name;
                if (data.medicine) prescription.medicine = data.medicine.name;
                if (req.body.quantity) prescription.quantity = req.body.quantity;
                if (data.posology) {
                    prescription.prescribedPosology = {
                        "quantity": data.posology.quantity,
                        "technique": data.posology.technique,
                        "interval": data.posology.interval,
                        "period": data.posology.period
                    }
                } else if (req.body.prescribedPosology) {
                    prescription.prescribedPosology = {
                        "quantity": req.body.prescribedPosology.dosage,
                        "technique": req.body.prescribedPosology.technique,
                        "interval": req.body.prescribedPosology.interval,
                        "period": req.body.prescribedPosology.period
                    };
                }
                if (data.presentation) {
                    prescription.presentation = {
                        "form": data.presentation.form,
                        "concentration": data.presentation.concentration,
                        "quantity": data.presentation.quantity
                    }
                }

                // Update prescription
                prescription.save(err => {
                    if (err) res.status(500).json({
                        error: err
                    });
                });
                // update the medical receipt and check for errors
                medicalReceipt.save(err => {
                    if (err) res.status(500).json({
                        error: err
                    });

                    res.status(200).json({
                        message: 'Prescription was updated!'
                    });
                });
            })

        } else {
            res.status(401).json({
                message: 'Unauthorized User.'
            });
        }
    });
}