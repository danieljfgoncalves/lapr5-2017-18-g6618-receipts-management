// ./config.js

// FIXME: replace with new configurations for LAPR5

// App Configurations
module.exports = {

    // 'client_id':"JlBREWOiSAE87o0MZjymMkH8z5wPX7QW",
    // 'client_secret': 'xVeQAFK7NeZZXSJ7ZQeA2H6ouILGkGIyxBNKVPo-8W5tzDC-0o_vIwF96veW9V7b',
    'medicinesManagement': {
        'url': 'http://lapr5-g6618-medicines-management.azurewebsites.net/api'
    },
    'receiptsManagement': {
        'url': 'https://lapr5-g6618-receipts-management.azurewebsites.net',
        'client_id': 'JlBREWOiSAE87o0MZjymMkH8z5wPX7QW',
        'client_secret': 'xVeQAFK7NeZZXSJ7ZQeA2H6ouILGkGIyxBNKVPo-8W5tzDC-0o_vIwF96veW9V7b'
    },
    'mongoURI': {
        'production': 'mongodb://admin:admin@ds161316.mlab.com:61316/lapr5-6618-receipts-management',
        'development': 'mongodb://admin:admin@ds161316.mlab.com:61316/lapr5-6618-receipts-management',
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
    },
    'consolidation': {
        'preservation_period': 5 // years
    }
};