// routes/medicalReceipts.js

var express     = require('express');
var router      = express.Router();
var auth = require('../middlewares/authentication');

// Require controller modules
var patient_controller = require('../controllers/patientController');

// Add Authentication authentication
router.use('/patients', auth.handleToken, auth.getApiToken);

// GET /api/Patients
router.get('/patients', patient_controller.get_patients);

// GET /api/Patients/{id}/Prescriptions/tofill/{?data}
router.get('/patients/:id/prescriptions/tofill', patient_controller.get_prescriptions_to_fill_until_date);

module.exports = router;