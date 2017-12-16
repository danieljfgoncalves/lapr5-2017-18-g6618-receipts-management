// models/comment.js

// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Promise = require('bluebird'); //ADD THIS LINE
Promise.promisifyAll(mongoose); //AND THIS LINE

// set up a mongoose model and pass it using exports
module.exports = mongoose.model('Comment', new Schema({
    physician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: 'Physician ID is required.'
    },
    presentationID: Number,
    comment: String
}));