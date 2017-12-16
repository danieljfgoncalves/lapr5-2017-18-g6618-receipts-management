// routes/medicalReceipts.js

var express     = require('express');
var router      = express.Router();
var middlewares = require('../middleware');

// Require controller modules
var medical_receipts_controller = require('../controllers/medicalReceiptController');

// Add Authentication middleware
router.use('/medicalReceipts', middlewares.authenticateToken);

// GET /api/medicalReceipts
router.get('/medicalReceipts', medical_receipts_controller.get_medical_receipts_list);

// GET /api/medicalReceipts/{id}
router.get('/medicalReceipts/:id', medical_receipts_controller.get_medical_receipt);

// POST /api/medicalReceipts
router.post('/medicalReceipts', middlewares.authenticateToMedicinesBackend, medical_receipts_controller.post_medical_receipt);

// PUT /api/medicalReceipts/{id}
router.put('/medicalReceipts/:id', middlewares.authenticateToMedicinesBackend, medical_receipts_controller.put_medical_receipt);

// DELETE /api/medicalReceipts/{id}
router.delete('/medicalReceipts/:id', medical_receipts_controller.delete_medical_receipt);

// GET /api/medicalReceipts/{id}/Prescriptions
router.get('/medicalReceipts/:id/prescriptions', medical_receipts_controller.get_prescriptions_by_id);

// POST /api/medicalReceipts/{id1}/Prescriptions
router.post('/medicalReceipts/:id/prescriptions', middlewares.authenticateToMedicinesBackend, medical_receipts_controller.post_prescription);

// GET /api/medicalReceipts/{id}/Prescriptions/{id}
router.get('/medicalReceipts/:receiptId/prescriptions/:prescId', medical_receipts_controller.get_prescription_by_id);

// PUT /api/medicalReceipts/{id}/Prescriptions/{id}
router.put('/medicalReceipts/:receiptId/prescriptions/:prescId', middlewares.authenticateToMedicinesBackend, medical_receipts_controller.put_prescription_by_id);

// POST /api/MedicalReceipts/{id1}/Prescriptions/{id2}/Fills
router.post('/medicalReceipts/:id1/prescriptions/:id2/fills', medical_receipts_controller.post_fill_prescription);

// PUT /api/MedicalReceipts/{id1}/Prescriptions/{id2}/Fills
router.put('/medicalReceipts/:id1/prescriptions/:id2/fills', medical_receipts_controller.post_fill_prescription);


module.exports = router;