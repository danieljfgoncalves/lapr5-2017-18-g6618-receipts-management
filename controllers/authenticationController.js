// controllers/authentication.js

var jwt     = require('jsonwebtoken');
var bcrypt  = require('bcryptjs');
var config  = require('../config');
var User    = require('../models/user');
var roles   = require('../models/roles');

// function to register a user
exports.postRegistration = function (req, res) {

    var hashedPassword = bcrypt.hashSync(req.body.password); // encrypt password

    // Verify roles
    var myRoles = new Set();
    if (req.body.roles) {
        req.body.roles.forEach(function (element) {
            var aRole = roles.verifyRole(element);
            if (aRole != null) myRoles.add(aRole);
        });
    }
    if (myRoles.size == 0) myRoles.add(roles.Role.PATIENT);

    var mobile = undefined;
    if (req.body.mobile) mobile = req.body.mobile;

    User.create({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
        mobile: mobile,
        roles: Array.from(myRoles)
    },
        function (err, user) {
            if (err) return res.status(500).send({ message:"There was a problem registering the user.", error: err});
        
            res.status(200).send({ message: "Successfully registered.", username: user.name });
    });
}

// function to authenticate a user and reply a token
exports.postAuthentication = function (req, res) {

    // find the user
    User.findOne({
        name: req.body.name
    }, function (err, user) {

        if (err) throw err;

        if (!user) {
            res.status(401).json({ success: false, message: 'Authentication failed. User not found.' });
        } else if (user) {

            // check if password matches
            if (!bcrypt.compareSync(req.body.password, user.password)) {
                res.status(401).json({ success: false, message: 'Authentication failed. Wrong password.' });
            } else {

                // if user is found and password is right
                // create a token with only our given payload
                // we don't want to pass in the entire user since that has the password
                const payload = {
                    roles: user.roles,
                    userID: user._id,
                    name: user.name,
                    email: user.email,
                    mobile: user.mobile
                };
                var token = jwt.sign(payload, config.secret, {
                    expiresIn: config.token_duration
                });

                // return the information including token as JSON
                res.status(200).json({
                    success: true,
                    message: 'Enjoy your token!',
                    token: token
                });
            }

        }

    });
}

// GET /api/users/{id}
exports.getUser = (req, res) => {

    User.findById(req.params.id, (err, user) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        if (!user) {
            res.status(404).json({"Message":"No user found with the given ID."});
            return;
        }
        var userDTO = {
            roles: user.roles,
            userID: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile
        }
        res.status(200).json(userDTO);
    });

};