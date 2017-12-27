// models/medicalReceipt.js

var mongoose = require('mongoose');
var Promise = require('bluebird');
Promise.promisifyAll(mongoose);
var Schema = mongoose.Schema;

var defaultExpirationDate = new Date();
defaultExpirationDate.setDate(defaultExpirationDate.getDate() + 30);

var PresentationSchema = new Schema({
    form: String,
    concentration: String,
    quantity: Number
});
var FillSchema = new Schema({
    date: {
        type: Date,
        default: Date.now
    },
    quantity: Number
});
var PrescribedPosologySchema = new Schema({
    quantity: String,
    technique: String,
    interval: String,
    period: String
});
var PrescriptionSchema = new Schema({
    expirationDate: {
        type: Date,
        default: defaultExpirationDate
    },
    drug: String,
    medicine: String,
    prescribedPosology: PrescribedPosologySchema,
    presentation: PresentationSchema,
    quantity: {
        type: Number,
        required: 'Quantity is required',
        min: 1
    },
    fills: [FillSchema]
});
var MedicalReceiptSchema = new Schema({
    physician: String,
    patient: String,
    creationDate: {
        type: Date,
        default: Date.now
    },
    prescriptions: [{
        type: PrescriptionSchema,
        required: 'Prescriptions are required'
    }]
});

MedicalReceiptSchema.path('prescriptions').validate(prescriptions => {
    if (!prescriptions) { return false }
    else if (prescriptions.length === 0) { return false }
    return true;
}, 'A medical receipt must have at least one prescription.');

module.exports = mongoose.model('MedicalReceipt', MedicalReceiptSchema);