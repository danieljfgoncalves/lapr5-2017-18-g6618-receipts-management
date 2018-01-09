/**
 * consolidationController.js
 * 
 * Controller for concepts related to consolidation deadlines, etc.
 */
const MedicalReceipt = require('../models/medicalReceipt');
const userServices = require('../services/userServices');
const config = require('../config');
const async = require('async');

// GET /api/consolidation/threatInfo
exports.threatInfo = function (req, res) {

    if (!req.accessToken) {
        return res.status(403).json({"Message":"API token required"});
    }

    userServices.getUsers(req.accessToken).then(users => {

        let usersRenewed = 0;
        let currentDate = new Date();

        async.each(users, (currentUser, callback) => {

            if (!userIsAppropriated(currentUser)) {
                return callback();
            }

            let lastConsolidationDate = new Date(currentUser.app_metadata.lastConsolidation ? 
                currentUser.app_metadata.lastConsolidation : currentUser.created_at);
            let diffInYears = (currentDate - lastConsolidationDate) / 31556952000;

            if (diffInYears > config.consolidation.preservation_period) {
                
                MedicalReceipt.remove({patient: currentUser.user_id}, err => {
                    if (err) {
                        return res.status(400).send(er);
                    }

                    userServices.patchUser(req.accessToken, currentUser.user_id,
                        {
                            "app_metadata": {
                                "lastConsolidation": currentDate
                            }
                        }
                    ).then(status => {
                        if (status == 200) {
                            usersRenewed++;
                        }
                        return callback();
                    });
                });
            }
            else {
                return callback();
            }

        }, (err) => {

            if (err) {
                return res.status(400).send(err);
            }

            return res.status(200).json(
                {
                    "Message": "Users data processed",
                    "UsersRenewed": usersRenewed
                }
            )
        });

    });
}

function userIsAppropriated(user) {

    if (!user.identities || 
        !user.app_metadata || 
        !user.app_metadata.roles) {
        
        return false;
    }

    let hasProperConnection = false;
    for (let i = 0; i < user.identities.length; i++) {
        if (user.identities[i].connection === "lapr5-user-db") {
            hasProperConnection = true;
        }
    }

    let isPatient = false;
    for (let i = 0; i < user.app_metadata.roles.length; i++) {
        if (user.app_metadata.roles[i] === "patient") {
            isPatient = true;
        }
    }

    return hasProperConnection && isPatient;
}