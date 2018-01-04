// controllers/statusController.js

var MedicalReceipt = require('../models/medicalReceipt');

// GET /api/status
exports.get_status = function (req, res) {

    MedicalReceipt.count(function (err, countMedicalReceipt) {
        if (err)  return res.status(500).send(err);
        if (countMedicalReceipt != undefined) return res.status(200).json({"count": countMedicalReceipt});
        return res.status(400).send("Error counting Medical Receipt on Database!");
    });
}