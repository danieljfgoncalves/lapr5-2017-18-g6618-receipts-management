const nodemailer = require('nodemailer');
const config = require('../config');
const moment = require('moment');

// create reusable transporter object using the default SMTP transport
exports.transporter = nodemailer.createTransport(config.email);

exports.mailCreatedRM = (medicalReceipt, patient, physician) => {

    return {
        from: '"MedicalReceiptsAPI ⚕👨‍⚕️💊" <no-reply@isep.ipp.pt>', // sender address
        to: patient.email, // list of receivers
        subject: 'Medical Receipt #' + medicalReceipt._id + ' issued ✔', // Subject line
        text: 'Hello ' + patient.name + ',\n'
            + 'Your medical receipt has been issue and is available since ' 
            + moment(medicalReceipt.creationDate).format("dddd, MMMM Do YYYY")
            + '.\n\nRegards,\n Dr. ' + physician.name // plain text body
    }
};
exports.mailUpdatedRM = (medicalReceipt, patient, physician) => {

    return {
        from: '"MedicalReceiptsAPI ⚕👨‍⚕️💊" <no-reply@isep.ipp.pt>', // sender address
        to: patient.email, // list of receivers
        subject: 'Medical Receipt #' + medicalReceipt._id + ' updated ✔', // Subject line
        text: 'Hello ' + patient.name + ',\n'
            + 'Your medical receipt has been updated today ('
            + moment().format("DD-MM-YYYY")
            + ').\n\nRegards,\n Dr. ' + physician.name // plain text body
    }
};