// controllers/medicalReceiptController.js

var roles = require('../models/roles');
var MedicalReceipt = require('../models/medicalReceipt');
var User = require('../models/user');
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

// GET /api/medicalReceipts
exports.get_medical_receipts_list = function (req, res) {

    if (req.roles.includes(roles.Role.ADMIN)) {

        MedicalReceipt.find(function (err1, medicalReceipts) {
            if (err1) {
                res.status(500).send(err1);
            }
            var mrs = [];
            var patientDTO, physicianDTO;
            async.each(medicalReceipts, (medicalReceipt, callback) => {

                new Promise( (resolve, reject) => {
                    User.findById(medicalReceipt.patient, (err, user) => {
                        var data = {};
                        data.patientDTO = {
                            roles: user.roles,
                            userID: user._id,
                            name: user.name,
                            email: user.email,
                            mobile: user.mobile
                        };
                        resolve(data);
                    });
                }).then(data => {
                    return new Promise( (resolve, reject) => {
                        User.findById(medicalReceipt.physician, (err, user) => {
                            data.physicianDTO = {
                                roles: user.roles,
                                userID: user._id,
                                name: user.name,
                                email: user.email,
                                mobile: user.mobile
                            };
                            resolve(data);
                        });
                    });
                }).then(data => {
                    var medicalReceiptDTO = {
                        "_id": medicalReceipt._id,
                        "patient": data.patientDTO,
                        "physician": data.physicianDTO,
                        "prescriptions": medicalReceipt.prescriptions,
                        "creationDate":  medicalReceipt.creationDate
                    };
                    mrs.push(medicalReceiptDTO);
                    callback();
                });

            }, err2 => {
                if (err2) {
                    res.status(500).send(err2);
                }
                res.status(200).json(mrs);
            })
        });
    } else if (req.roles.includes(roles.Role.PHYSICIAN) ||
        req.roles.includes(roles.Role.PATIENT)) {

        var query;
        if (req.roles.includes(roles.Role.PHYSICIAN)) {
            query = {
                "physician": req.userID
            }
        } else {
            query = {
                "patient": req.userID
            }
        }

        MedicalReceipt.find(query, function (err, medicalReceipts) {
            if (err) {
                res.status(500).send(err);
            }
            var mrs = [];
            var patientDTO, physicianDTO;
            async.each(medicalReceipts, (medicalReceipt, callback) => {

                new Promise( (resolve, reject) => {
                    User.findById(medicalReceipt.patient, (err, user) => {
                        var data = {};
                        data.patientDTO = {
                            roles: user.roles,
                            userID: user._id,
                            name: user.name,
                            email: user.email,
                            mobile: user.mobile
                        };
                        resolve(data);
                    });
                }).then(data => {
                    return new Promise( (resolve, reject) => {
                        User.findById(medicalReceipt.physician, (err, user) => {
                            data.physicianDTO = {
                                roles: user.roles,
                                userID: user._id,
                                name: user.name,
                                email: user.email,
                                mobile: user.mobile
                            };
                            resolve(data);
                        });
                    });
                }).then(data => {
                    var medicalReceiptDTO = {
                        "_id": medicalReceipt._id,
                        "patient": data.patientDTO,
                        "physician": data.physicianDTO,
                        "prescriptions": medicalReceipt.prescriptions,
                        "creationDate":  medicalReceipt.creationDate
                    };
                    mrs.push(medicalReceiptDTO);
                    callback();
                });

            }, err2 => {
                if (err2) {
                    res.status(500).send(err2);
                }
                res.status(200).json(mrs);
            })
        });
    } else {
        res.status(401).send('Unauthorized User.');
    }
};

// GET /api/medicalReceipts/{id}
exports.get_medical_receipt = function (req, res) {

    MedicalReceipt.findById(req.params.id, function (err, medicalReceipt) {
        if (err) {
            res.send(err);
        }

        var b1 = req.roles.includes(roles.Role.ADMIN);
        var b2 = req.roles.includes(roles.Role.PHARMACIST);
        var b3 = req.roles.includes(roles.Role.PATIENT) && req.userID == medicalReceipt.patient;
        var b4 = req.roles.includes(roles.Role.PHYSICIAN) && req.userID == medicalReceipt.physician;
        if (b1 || b2 || b3 || b4) {
            res.status(200).json(medicalReceipt);
        } else {
            res.status(401).send('Unauthorized User.');
        }
    });
};

// POST /api/medicalReceipts
exports.post_medical_receipt = function (req, res) {

    if (!(req.roles.includes(roles.Role.ADMIN) ||
            req.roles.includes(roles.Role.PHYSICIAN))) {
        res.status(401).send('Unauthorized User.');
        return;
    }

    var medicalReceipt = new MedicalReceipt();

    medicalReceipt.creationDate = req.body.creationDate;
    medicalReceipt.physician = req.userID;
    medicalReceipt.patient = req.body.patient;

    async.each(
        req.body.prescriptions,

        (item, callback) => {

            var args = {
                data: {
                    "Email": config.medicinesManagement.email,
                    "Password": config.medicinesManagement.secret
                },
                headers: {
                    "Authorization": "Bearer ".concat(req.token),
                    "Content-Type": "application/json"
                }
            };

            Promise.join(
                medicinesClient.getDrug(args, item.drug),
                medicinesClient.getMedicine(args, item.medicine),
                medicinesClient.getPresentation(args, item.presentation),
                medicinesClient.getPosology(args, item.posology),
                function (drug, medicine, presentation, posology) {

                    var prescription = {
                        "expirationDate": item.expirationDate,
                        "drug": drug.name,
                        "medicine": medicine.name,
                        "quantity": item.quantity,
                        "prescribedPosology": {
                            "quantity": posology.quantity,
                            "technique": posology.technique,
                            "interval": posology.interval,
                            "period": posology.period
                        },
                        "presentation": {
                            "form": presentation.form,
                            "concentration": presentation.concentration,
                            "quantity": presentation.quantity
                        }
                    };
                    medicalReceipt.prescriptions.push(prescription);
                    callback();
                });
        },
        (error) => {
            // save the medical receipt and check for errors
            medicalReceipt.save(err => {
                if (err) {
                    res.status(500).send(err);
                }

                Promise.join(
                    User.findOne({
                        _id: req.body.patient
                    }).exec(),
                    User.findOne({
                        _id: req.userID
                    }).exec(),
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
                                res.status(201).json({
                                    message: 'Medical Receipt Created, but email notification failed!'
                                });
                                return console.log(error);
                            }
                            console.log('Email sent: %s', info.messageId);
                            res.status(201).json({
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

        if (hasFills) {
            res.status(401).send('Unauthorized User.');
            return;
        }
    });

    if (!(req.roles.includes(roles.Role.ADMIN) ||
            (req.roles.includes(roles.Role.PHYSICIAN) && req.userID == physicianID))) {
        res.status(401).send('Unauthorized User.');
        return;
    }

    var newPrescriptions = [];
    async.each(
        req.body.prescriptions,

        (item, callback) => {

            var args = {
                data: {
                    "Email": config.medicinesManagement.email,
                    "Password": config.medicinesManagement.secret
                },
                headers: {
                    "Authorization": "Bearer ".concat(req.token),
                    "Content-Type": "application/json"
                }
            };

            Promise.join(
                medicinesClient.getDrug(args, item.drug),
                medicinesClient.getMedicine(args, item.medicine),
                medicinesClient.getPresentation(args, item.presentation),
                medicinesClient.getPosology(args, item.posology),
                function (drug, medicine, presentation, posology) {

                    var prescription = {
                        "expirationDate": item.expirationDate,
                        "drug": drug.name,
                        "medicine": medicine.name,
                        "quantity": item.quantity,
                        "prescribedPosology": {
                            "quantity": posology.quantity,
                            "technique": posology.technique,
                            "interval": posology.interval,
                            "period": posology.period
                        },
                        "presentation": {
                            "form": presentation.form,
                            "concentration": presentation.concentration,
                            "quantity": presentation.quantity
                        }
                    };
                    newPrescriptions.push(prescription);
                    callback();
                })
        },
        error => {
            // update the medical receipt and check for errors
            MedicalReceipt.findOneAndUpdate({
                _id: req.params.id
            }, {
                physician: req.userID,
                patient: req.body.patient,
                creationDate: req.body.creationDate,
                prescriptions: newPrescriptions
            }, (err, medicalReceipt) => {

                if (err) {
                    res.status(500).send(err);
                }

                Promise.join(
                    User.findOne({
                        _id: req.body.patient
                    }).exec(),
                    User.findOne({
                        _id: req.userID
                    }).exec(),
                    (patient, physician) => {
                        // send mail with defined transport object
                        email.transporter.sendMail(email.mailUpdatedRM(medicalReceipt, patient, physician), (error, info) => {
                            if (error) {
                                res.status(200).json({
                                    message: 'Medical Receipt Updated, but email notification failed!'
                                });
                                return console.log(error);
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

    if (!req.roles.includes(roles.Role.ADMIN)) {
        res.status(401).send('Unauthorized User.');
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
            res.send(err);
        }

        var b1 = req.roles.includes(roles.Role.ADMIN);
        var b2 = req.roles.includes(roles.Role.PHARMACIST);
        var b3 = req.roles.includes(roles.Role.PATIENT) && req.userID == medicalReceipt.patient;
        var b4 = req.roles.includes(roles.Role.PHYSICIAN) && req.userID == medicalReceipt.physician;
        if (b1 || b2 || b3 || b4) {

            res.status(200).json(medicalReceipt.prescriptions);
        } else {
            res.status(401).send('Unauthorized User.');
        }
    });
}

// POST /api/MedicalReceipts/{id1}/Prescriptions/{id2}/Fills
exports.post_fill_prescription = (req, res) => {
    if (!(req.roles.includes(roles.Role.ADMIN) ||
            req.roles.includes(roles.Role.PHARMACIST))) {

        res.status(401).send('Unauthorized User.');
        return;
    }
    MedicalReceipt.findById(req.params.id1, (err, medicalReceipt) => {
        if (err) {
            res.send(err);
            return;
        }

        var prescription = medicalReceipt._doc.prescriptions.find(e => e._id == req.params.id2);
        if (!prescription) {
            res.status(404).send("The prescription doesn't exists.");
            return;
        }

        var availableFills = prescription._doc.quantity;
        prescription._doc.fills.forEach(element => {
            availableFills -= element.quantity;
        });

        if (req.body.quantity > availableFills) {
            res.status(400).send("The quantity is bigger than the available [Remaining: " + availableFills + "].");
            return;
        }

        prescription._doc.fills.push(req.body);
        medicalReceipt.save(function (err) {
            if (err) {
                res.send(err);
            }
            res.status(200).json({
                message: 'Medical Receipt Updated!'
            });
        });
    });
}

// POST /api/medicalReceipts/{id1}/Prescriptions/
exports.post_prescription = function (req, res) {

    if (!(req.roles.includes(roles.Role.ADMIN) ||
            req.roles.includes(roles.Role.PHYSICIAN))) {
        res.status(401).send('Unauthorized User.');
        return;
    }
    MedicalReceipt.findById(req.params.id, function (err, medicalReceipt) {
        if (err) {
            res.send(err);
        }

        var args = {
            data: {
                "Email": config.medicinesManagement.email,
                "Password": config.medicinesManagement.secret
            },
            headers: {
                "Authorization": "Bearer ".concat(req.token),
                "Content-Type": "application/json"
            }
        };

        Promise.join(
            medicinesClient.getDrug(args, req.body.drug),
            medicinesClient.getMedicine(args, req.body.medicine),
            medicinesClient.getPresentation(args, req.body.presentation),
            medicinesClient.getPosology(args, req.body.posology),
            function (drug, medicine, presentation, posology) {

                var prescription = {
                    "expirationDate": req.body.expirationDate,
                    "drug": drug.name,
                    "medicine": medicine.name,
                    "quantity": item.quantity,
                    "prescribedPosology": {
                        "quantity": posology.quantity,
                        "technique": posology.technique,
                        "interval": posology.interval,
                        "period": posology.period
                    },
                    "presentation": {
                        "form": presentation.form,
                        "concentration": presentation.concentration,
                        "quantity": presentation.quantity
                    }
                };
                medicalReceipt.prescriptions.push(prescription);
                // save the medical receipt and check for errors
                medicalReceipt.save(err => {
                    if (err) {
                        res.status(500).send(err);
                    }
                    res.status(201).json({
                        message: 'Prescription Created & Added to Medical Receipt!'
                    });
                });
            })
    });

}

// GET /api/medicalReceipts/{id}/Prescriptions/{id}
exports.get_prescription_by_id = function (req, res) {

    MedicalReceipt.findById(req.params.receiptId, function (err, medicalReceipt) {
        if (err) {
            res.status(500).send(err);
        }
        var b1 = req.roles.includes(roles.Role.ADMIN);
        var b2 = req.roles.includes(roles.Role.PHARMACIST);
        var b3 = req.roles.includes(roles.Role.PATIENT) && req.userID == medicalReceipt.patient;
        var b4 = req.roles.includes(roles.Role.PHYSICIAN) && req.userID == medicalReceipt.physician;
        if (b1 || b2 || b3 || b4) {

            var prescription = medicalReceipt.prescriptions.id(req.params.prescId);

            if (!prescription) {
                res.status(404).send("The prescription doesn't exists.");
                return;
            }

            res.status(200).json(prescription);
        } else {
            res.status(401).send('Unauthorized User.');
        }
    });
}

// // PUT /api/medicalReceipts/{id}/Prescriptions/{id}
exports.put_prescription_by_id = function (req, res) {

    MedicalReceipt.findById(req.params.receiptId, function (err, medicalReceipt) {
        if (err) {
            res.status(500).send(err);
        }

        if (req.roles.includes(roles.Role.ADMIN) ||
            (req.roles.includes(roles.Role.PHYSICIAN) && req.userID == medicalReceipt.physician)) {

            var prescription = medicalReceipt.prescriptions.id(req.params.prescId);

            if (!prescription) {
                res.status(404).send("The prescription doesn't exists.");
                return;
            } else if (prescription.fills.length > 0) {
                res.status(401).send('The prescription has been filled & can\'t be changed');
                return;
            }

            var args = {
                data: {
                    "Email": config.medicinesManagement.email,
                    "Password": config.medicinesManagement.secret
                },
                headers: {
                    "Authorization": "Bearer ".concat(req.token),
                    "Content-Type": "application/json"
                }
            };

            Promise.join(
                medicinesClient.getDrug(args, req.body.drug),
                medicinesClient.getMedicine(args, req.body.medicine),
                medicinesClient.getPresentation(args, req.body.presentation),
                medicinesClient.getPosology(args, req.body.posology),
                function (drug, medicine, presentation, posology) {

                    if (req.body.expirationDate) prescription.expirationDate = req.body.expirationDate;
                    if (drug) prescription.drug = drug.name;
                    if (medicine) prescription.medicine = medicine.name;
                    if (req.body.quantity) prescription.quantity = req.body.quantity;
                    if (posology) {
                        prescription.prescribedPosology = {
                            "quantity": posology.quantity,
                            "technique": posology.technique,
                            "interval": posology.interval,
                            "period": posology.period
                        }
                    }
                    if (presentation) {
                        prescription.presentation = {
                            "form": presentation.form,
                            "concentration": presentation.concentration,
                            "quantity": presentation.quantity
                        }
                    }

                    // // // Update prescription
                    prescription.save(err => {
                        if (err) res.status(500).send(err);
                    });
                    // update the medical receipt and check for errors
                    medicalReceipt.save(err => {
                        if (err) res.status(500).send(err);

                        res.status(200).json({
                            message: 'Prescription was updated!'
                        });
                    });
                })

        } else {
            res.status(401).send('Unauthorized User.');
        }
    });
}