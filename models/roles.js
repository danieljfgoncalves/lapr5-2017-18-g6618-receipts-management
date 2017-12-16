// models/roles.js

// ENUM to define roles
const ROLE = {
    ADMIN: "admin",
    PHYSICIAN: "physician",
    PHARMACIST: "pharmacist",
    PATIENT: "patient"
};
// var myRole = Role.ADMIN;
exports.Role = ROLE;

// FUNCTION verify role
exports.verifyRole = function (expression) {

    var myRole;
    switch (expression.toLowerCase()) {
        case ROLE.ADMIN:
            myRole = ROLE.ADMIN;
            break;
        case ROLE.PHYSICIAN:
            myRole = ROLE.PHYSICIAN
            break;
        case ROLE.PHARMACIST:
            myRole = ROLE.PHARMACIST
            break;
        case ROLE.PATIENT:
            myRole = ROLE.PATIENT;
        default:
            myRole = null;
    }
    return myRole;
}