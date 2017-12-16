// /test/test-routes.js
process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
var mongoose = require("mongoose");
mongoose.Promise = require('bluebird');

var Promise = require('bluebird');
var server = require('../app');
var User = require('../models/user');
var MedicalReceipt = require('../models/medicalReceipt');
var mockObjects = require('./mock-objects');

var should = chai.should();
var assert = chai.assert;
chai.use(chaiHttp);

// Tests variables/constants
var physicianID = '5a0170e5bd900e96b89a5d9a';
var physician2ID = '5a04fcd65510e58e3967f69f';
var patientID = '5a0170f4bd900e96b89a5d9c';
var patient2ID = '5a04fd095510e58e3967f6a5';
var authPromise = aName => {
    return new Promise(resolve => {
        chai.request(server)
            .post('/api/authenticate')
            .send({
                name: aName,
                password: 'passwd'
            })
            .end(function (err, res) {
                resolve(res.body.token);
            })
    });
}

describe('MOCHA & CHAI TESTS', function () {

    var patientToken;
    var patient2Token;
    var physicianToken;
    var physician2Token;
    var pharmaToken;
    var adminToken;

    before(async function () {
        patientToken = await authPromise('patient1');
        patient2Token = await authPromise('patient2');
        physicianToken = await authPromise('physician1');
        physician2Token = await authPromise('physician2');
        pharmaToken = await authPromise('pharmacist1');
        adminToken = await authPromise('admin');
    });

    describe('TESTING: Authentication', function () {

        var correctName = "test-physician";

        afterEach(function (done) {
            User.remove({
                name: correctName
            }, done);
        });
        it('[POST] should register user',
            function (done) {
                chai.request(server)
                    .post('/api/register')
                    .send({
                        name: correctName,
                        password: 'passwd',
                        email: "test@email.pt",
                        mobile: "+351936523509"
                    })
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.should.be.html;
                        res.text.should.equal("User [" + correctName + "] registered with success.");
                        done();
                    });
            });
        it('[POST] shouldn\'t register user with no name',
            function (done) {
                chai.request(server)
                    .post('/api/register')
                    .send({
                        password: 'passwd',
                        email: "test@email.pt",
                        mobile: "+351936523509"
                    })
                    .end(function (err, res) {
                        res.should.have.status(500);
                        done();
                    });
            });
        it('[POST] shouldn\'t register user with no password',
            function (done) {
                chai.request(server)
                    .post('/api/register')
                    .send({
                        name: correctName,
                        email: "test@email.pt",
                        mobile: "+351936523509"
                    })
                    .end(function (err, res) {
                        res.should.have.status(500);
                        done();
                    });
            });
        it('[POST] shouldn\'t register user with no email',
            function (done) {
                chai.request(server)
                    .post('/api/register')
                    .send({
                        name: correctName,
                        password: "passwd",
                        mobile: "+351936523509"
                    })
                    .end(function (err, res) {
                        res.should.have.status(500);
                        done();
                    });
            });
        it('[POST] shouldn\'t register user with invalid email',
            function (done) {
                chai.request(server)
                    .post('/api/register')
                    .send({
                        name: correctName,
                        password: 'passwd',
                        email: "testemail.pt",
                        mobile: "+351936523509"
                    })
                    .end(function (err, res) {
                        res.should.have.status(500);
                        done();
                    });
            });
        it('[POST] should register user with no mobile number',
            function (done) {
                chai.request(server)
                    .post('/api/register')
                    .send({
                        name: correctName,
                        password: "passwd",
                        email: "teste@mail.pt"
                    })
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.should.be.html;
                        res.text.should.equal("User [" + correctName + "] registered with success.");
                        done();
                    });
            });
        it('[POST] shouldn\'t register user with invalid mobile number',
            function (done) {
                chai.request(server)
                    .post('/api/register')
                    .send({
                        name: correctName,
                        password: 'passwd',
                        email: "teste@mail.pt",
                        mobile: "test"
                    })
                    .end(function (err, res) {
                        res.should.have.status(500);
                        done();
                    });
            });
        it('[POST] should authenticate user',
            function (done) {
                chai.request(server)
                    .post('/api/authenticate')
                    .send({
                        name: "admin",
                        password: 'passwd'
                    })
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.have.property('success');
                        res.body.success.should.equal(true);
                        res.body.should.have.property('message');
                        res.body.message.should.be.a("String");
                        res.body.should.have.property('token');
                        res.body.token.should.be.a("String");
                        done();
                    });
            });
        it('[POST] shouldn\'t authenticate user with invalid name',
            function (done) {
                chai.request(server)
                    .post('/api/authenticate')
                    .send({
                        name: "test",
                        password: 'passwd'
                    })
                    .end(function (err, res) {
                        res.should.have.status(401);
                        res.should.be.json;
                        res.body.should.have.property('success');
                        res.body.success.should.equal(false);
                        res.body.should.have.property('message');
                        res.body.message.should.be.a("String");
                        done();
                    });
            });
        it('[POST] shouldn\'t authenticate user with invalid password',
            function (done) {
                chai.request(server)
                    .post('/api/authenticate')
                    .send({
                        name: "admin",
                        password: 'wrong'
                    })
                    .end(function (err, res) {
                        res.should.have.status(401);
                        res.should.be.json;
                        res.body.should.have.property('success');
                        res.body.success.should.equal(false);
                        res.body.should.have.property('message');
                        res.body.message.should.be.a("String");
                        done();
                    });
            });
    });

    describe('TESTING: Medical Receipts', function () {

        var mrID;
        var prescID;

        beforeEach(async function () {
            await MedicalReceipt.collection.remove();
            await MedicalReceipt.insertMany(mockObjects.medicalReceipts, (err, docs) => {
                mrID = docs[0]._id;
                prescID = docs[0].prescriptions[0]._id;
            });
        });

        afterEach(function (done) {
            MedicalReceipt.collection.remove(done);
        });

        it('[GET] should retrieve all medical receipts (admin access)',
            function (done) {
                chai.request(server)
                    .get('/api/medicalReceipts')
                    .set('x-access-token', adminToken)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('array');
                        res.body.should.have.lengthOf(3);
                        res.body[0].should.have.property('creationDate');
                        res.body[0].should.have.property('physician');
                        res.body[0].physician.should.equal(physicianID);
                        res.body[0].should.have.property('patient');
                        res.body[0].patient.should.equal(patientID);
                        res.body[0].should.have.property('prescriptions');
                        res.body[0].prescriptions.should.be.a('array');
                        assert.lengthOf(res.body[0].prescriptions[0].fills, 0);
                        res.body[0].prescriptions[0].should.have.property('drug');
                        res.body[0].prescriptions[0].should.have.property('presentation');
                        res.body[0].prescriptions[0].should.have.property('prescribedPosology');
                        res.body[0].prescriptions[0].drug.should.equal('Abacavir');
                        res.body[0].prescriptions[0].presentation.form.should.equal('xarope');
                        done();
                    });
            });
        it('[GET] should retrieve only medical receipts created by logged physician (physician access)',
            function (done) {
                chai.request(server)
                    .get('/api/medicalReceipts')
                    .set('x-access-token', physicianToken)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('array');
                        res.body.should.have.lengthOf(2);
                        res.body[0].should.have.property('creationDate');
                        res.body[0].should.have.property('physician');
                        res.body[0].physician.should.equal(physicianID);
                        res.body[0].should.have.property('patient');
                        res.body[0].patient.should.equal(patientID);
                        res.body[0].should.have.property('prescriptions');
                        res.body[0].prescriptions.should.be.a('array');
                        assert.lengthOf(res.body[0].prescriptions[0].fills, 0);
                        res.body[0].prescriptions[0].should.have.property('drug');
                        res.body[0].prescriptions[0].should.have.property('presentation');
                        res.body[0].prescriptions[0].should.have.property('prescribedPosology');
                        res.body[0].prescriptions[0].drug.should.equal('Abacavir');
                        res.body[0].prescriptions[0].presentation.form.should.equal('xarope');
                        done();
                    });
            });
        it('[GET] should not retrieve any medical receipts (pharmacist access)',
            function (done) {
                chai.request(server)
                    .get('/api/medicalReceipts')
                    .set('x-access-token', pharmaToken)
                    .end(function (err, res) {
                        res.should.have.status(401);
                        done();
                    });
            });
        it('[GET] should retrieve medical receipt for respective id (pharmacist access)',
            function (done) {
                chai.request(server)
                    .get('/api/medicalReceipts/' + mrID)
                    .set('x-access-token', pharmaToken)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('creationDate');
                        res.body.should.have.property('physician');
                        res.body.physician.should.equal(physicianID);
                        res.body.should.have.property('patient');
                        res.body.patient.should.equal(patientID);
                        res.body.should.have.property('prescriptions');
                        res.body.prescriptions.should.be.a('array');
                        assert.lengthOf(res.body.prescriptions[0].fills, 0);
                        res.body.prescriptions[0].should.have.property('drug');
                        res.body.prescriptions[0].should.have.property('presentation');
                        res.body.prescriptions[0].should.have.property('prescribedPosology');
                        res.body.prescriptions[0].drug.should.equal('Abacavir');
                        res.body.prescriptions[0].presentation.form.should.equal('xarope');
                        done();
                    });
            });
        it('[GET] should not retrieve medical receipt of another patient (patient access)',
            function (done) {
                chai.request(server)
                    .get('/api/medicalReceipts/' + mrID)
                    .set('x-access-token', patient2Token)
                    .end(function (err, res) {
                        res.should.have.status(401);
                        done();
                    });
            });
        it('[GET] should not retrieve medical receipt created by another physician (physician access)',
            function (done) {
                chai.request(server)
                    .get('/api/medicalReceipts/' + mrID)
                    .set('x-access-token', physician2Token)
                    .end(function (err, res) {
                        res.should.have.status(401);
                        done();
                    });
            });
        it('[DELETE] should delete medical receipt (admin access)',
            function (done) {
                chai.request(server)
                    .del('/api/medicalReceipts/' + mrID)
                    .set('x-access-token', adminToken)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.have.property('success');
                        res.body.success.should.equal(true);
                        res.body.should.have.property('message');
                        res.body.message.should.be.a("String");
                        done();
                    });
            });
        it('[DELETE] should not delete medical receipt (physician access)',
            function (done) {
                chai.request(server)
                    .del('/api/medicalReceipts/' + mrID)
                    .set('x-access-token', physicianToken)
                    .end(function (err, res) {
                        res.should.have.status(401);
                        done();
                    });
            });
        it('[DELETE] should not delete inexistente medical receipt (admin access)',
            function (done) {
                chai.request(server)
                    .del('/api/medicalReceipts/' + '1111')
                    .set('x-access-token', adminToken)
                    .end(function (err, res) {
                        res.should.have.status(500);
                        res.should.be.json;
                        res.body.should.have.property('success');
                        res.body.success.should.equal(false);
                        res.body.should.have.property('message');
                        res.body.message.should.be.a("String");
                        done();
                    });
            });
        it('[POST] should post a fill to a specific prescription (pharmacist access)',
            function (done) {
                chai.request(server)
                    .post('/api/medicalReceipts/' + mrID + '/prescriptions/' + prescID + '/fills')
                    .send({
                        quantity: 10
                    })
                    .set('x-access-token', pharmaToken)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        done();
                    });
            });
        it('[POST] should not post a fill because of overlimit (pharmacist access)',
            function (done) {
                chai.request(server)
                    .post('/api/medicalReceipts/' + mrID + '/prescriptions/' + prescID + '/fills')
                    .send({
                        quantity: 20
                    })
                    .set('x-access-token', pharmaToken)
                    .end(function (err, res) {
                        res.should.have.status(400);
                        res.should.be.html;
                        done();
                    });
            });
        it('[POST] should not post a fill unauthorized (patient access)',
            function (done) {
                chai.request(server)
                    .post('/api/medicalReceipts/' + mrID + '/prescriptions/' + prescID + '/fills')
                    .send({
                        quantity: 20
                    })
                    .set('x-access-token', patientToken)
                    .end(function (err, res) {
                        res.should.have.status(401);
                        res.should.be.html;
                        done();
                    });
            });
        it('[GET] should retrieve a prescription by id for respective medical receipt id (physcian access)',
            function (done) {
                chai.request(server)
                    .get('/api/medicalReceipts/' + mrID + '/prescriptions/' + prescID)
                    .set('x-access-token', physicianToken)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('object');
                        res.body.should.have.property('expirationDate');
                        res.body.should.have.property('fills');
                        res.body.fills.should.be.a('array');
                        assert.lengthOf(res.body.fills, 0);
                        res.body.should.have.property('drug');
                        res.body.should.have.property('presentation');
                        res.body.should.have.property('prescribedPosology');
                        res.body.drug.should.equal('Abacavir');
                        res.body.presentation.form.should.equal('xarope');
                        done();
                    });
            });
        it('[GET] should not retrieve a prescription from another patient (patient access)',
            function (done) {
                chai.request(server)
                    .get('/api/medicalReceipts/' + mrID + '/prescriptions/' + prescID)
                    .set('x-access-token', patient2Token)
                    .end(function (err, res) {
                        res.should.have.status(401);
                        done();
                    });
            });
        it('[GET] should not retrieve a prescription with invalid id (admin access)',
            function (done) {
                chai.request(server)
                    .get('/api/medicalReceipts/' + mrID + '/prescriptions/' + '10101')
                    .set('x-access-token', patient2Token)
                    .end(function (err, res) {
                        res.should.have.status(401);
                        done();
                    });
            });
    });

    describe('TESTING: Patients', function () {

        before(async function () {
            await MedicalReceipt.collection.remove();
            await MedicalReceipt.insertMany(mockObjects.medicalReceipts);
        });

        after(function (done) {
            MedicalReceipt.collection.remove(done);
        });

        it('[GET] should retrieve only his prescriptions with expirations before 2018-02-28 (patient access)',
            function (done) {
                chai.request(server)
                    .get('/api/patients/' + patientID + '/prescriptions/tofill' + "?date=2018-02-28")
                    .set('x-access-token', patientToken)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('array');
                        res.body.should.have.lengthOf(1);
                        res.body[0].should.have.property('expirationDate');
                        res.body[0].should.have.property('fills');
                        res.body[0].fills.should.be.a('array');
                        assert.lengthOf(res.body[0].fills, 0);
                        res.body[0].should.have.property('drug');
                        res.body[0].should.have.property('presentation');
                        res.body[0].should.have.property('prescribedPosology');
                        res.body[0].drug.should.equal('Abacavir');
                        res.body[0].presentation.form.should.equal('xarope');
                        done();
                    });
            });
        it('[GET] should retrieve only his prescriptions with expirations before 2017-12-25 (patient access)',
            function (done) {
                chai.request(server)
                    .get('/api/patients/' + patientID + '/prescriptions/tofill' + "?date=2017-12-25")
                    .set('x-access-token', patientToken)
                    .end(function (err, res) {
                        res.should.have.status(404);
                        res.should.be.json;
                        res.body.should.have.property('message');
                        res.body.message.should.equal('Prescriptions not found with then given criterias.');
                        done();
                    });
            });
        it('[GET] should not retrieve any prescriptions (physician access)',
            function (done) {
                chai.request(server)
                    .get('/api/patients/' + patientID + '/prescriptions/tofill' + "?date=2020-12-25")
                    .set('x-access-token', physicianToken)
                    .end(function (err, res) {
                        res.should.have.status(401);
                        done();
                    });
            });
    });
});