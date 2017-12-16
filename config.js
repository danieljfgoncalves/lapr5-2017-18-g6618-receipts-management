// ./config.js

// FIXME: replace with new configurations for LAPR5

// App Configurations
module.exports = {

    'secret': 'lapr5-6618',
    'medicinesManagement': {
        "url": "http://arqsi2017-medicines-backend-api.azurewebsites.net/api",
        "email": "arqsi17@isep.ipp.pt",
        "secret": "Arqsi-2017"
    },
    'mongoURI': {
        'production': 'mongodb://arqsi2017:arqsi2017@ds113925.mlab.com:13925/arqsi2017-dev',
        'development': 'mongodb://arqsi2017:arqsi2017@ds113925.mlab.com:13925/arqsi2017-dev',
        'test': 'mongodb://arqsi2017:arqsi2017@ds042677.mlab.com:42677/arqsi2017-test'
    },
    'logger': {
        'db': 'mongodb://admin:admin@ds141796.mlab.com:41796/lapr5-6618-system-logging',
        'collection': 'request-logs'
    },
    'emailService': {
        'host': 'mail.smtp2go.com',
        'port': 2525,
        'secure': false, // true for 465, false for other ports
        'auth': {
            'user': 'arqsi2017-1151452-1151159', // smtp2go user
            'pass': 'dHhudGMwNm5qbzkw' // smtp2go password
        }
    },
    'smsService': {
        'username': 'danielgoncalves',
        'api_key': 'NKNZETIoIuKyFkqU0rSnkXyaBqanMO'
    }
};