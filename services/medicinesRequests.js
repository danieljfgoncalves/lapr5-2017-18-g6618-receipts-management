// services/medicinesRequests.js
var config = require('../config');
var nodeRestClient = require('node-rest-client');
var client = new nodeRestClient.Client();
const _ = require("underscore");

exports.getMedicineData = (args, presentationId, medicineId, posologyId) => {

    if (presentationId == undefined || medicineId == undefined) return;

    return new Promise((resolve, reject) => {

        var url = config.medicinesManagement.url.concat("/Presentations/").concat(presentationId).concat('/detailed');
        client.get(url, args, (data, response) => {

            if(response.statusCode == 500) reject(response.statusCode);

            var medicineFound = _.find(data.medicines, (medicine) => { return medicine.id == medicineId; });
            if (!medicineFound) {
                return resolve(
                    {
                        error: 'Invalid Medicine',
                        statusCode: 400
                    }
                );
            }

            var medicineName = medicineFound.name;

            var medData = {
                medicine: medicineName,
                drug: data.drug.name,
                presentation: {
                    id: data.id,
                    form: data.form,
                    concentration: data.concentration,
                    quantity: data.packageQuantity
                }
            };

            if (posologyId) { 
                medData.posology = _.find(data.posologies, (posology) => { return posology.id == posologyId; });
            }

            resolve(medData);
        });
    })
};