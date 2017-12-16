// services/medicinesRequests.js
var config = require('../config');
var nodeRestClient = require('node-rest-client');
var client = new nodeRestClient.Client();

exports.getPresentation = function(args, presentationId) {

    if (presentationId == null) return;

    return new Promise((resolve, reject) => {
        
        var url = config.medicinesManagement.url.concat("/Presentations/").concat(presentationId);
        client.get(url, args, (data, response) => {
            resolve(data);
        });
    })
}

exports.getDrug = function(args, drugId) {

    if(drugId == null) return;

    return new Promise((resolve, reject) => {

        var url = config.medicinesManagement.url.concat("/Drugs/").concat(drugId);
        client.get(url, args, (data, response) => {
            resolve(data);
        });
    })
}

exports.getPosology = function (args, posologyId) {

    if (posologyId == null) return;

    return new Promise((resolve, reject) => {

        var url = config.medicinesManagement.url.concat("/Posologies/").concat(posologyId);
        client.get(url, args, (data, response) => {
            resolve(data);
        });
    })
}

exports.getMedicine = function (args, medicineId) {

    if (medicineId == null) return;

    return new Promise((resolve, reject) => {

        var url = config.medicinesManagement.url.concat("/Medicines/").concat(medicineId);
        client.get(url, args, (data, response) => {
            resolve(data);
        });
    })
}