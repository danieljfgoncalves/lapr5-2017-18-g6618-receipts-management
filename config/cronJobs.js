/**
 * cronJobs.js
 */

const consolidationController = require('../controllers/consolidationController');

exports.jobs = [
    {
        "period": "0 30 23 * * *",
        "task": consolidationController.runThreatInfo
    }
];