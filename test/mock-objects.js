// test/mock-objects.js

exports.medicalReceipts = [{
        'patient': '5a0170f4bd900e96b89a5d9c', // patient1
        'physician': '5a0170e5bd900e96b89a5d9a', // physician1
        'prescriptions': [{
            'expirationDate': '2018-01-30',
            'prescribedPosology': {
                'quantity': '1000',
                'technique': 'oral',
                'interval': '2 n\' 2 hours',
                'period': '36 hours'
            },
            'presentation': {
                'form': 'xarope',
                'concentration': 10,
                'quantity': 2000
            },
            'drug': 'Abacavir',
            'medicine': 'Brufen',
            'quantity': 10,
            'fills': []
        }],
        'creationDate': '2017-11-06T16:24:47.444Z'
    },
    {
        'patient': '5a0170f4bd900e96b89a5d9c', // patient1
        'physician': '5a0170e5bd900e96b89a5d9a', // physician1
        'prescriptions': [{
            'expirationDate': '2018-03-30',
            'prescribedPosology': {
                'quantity': '1000',
                'technique': 'oral',
                'interval': '2 n\' 2 hours',
                'period': '36 hours'
            },
            'presentation': {
                'form': 'xarope',
                'concentration': 10,
                'quantity': 2000
            },
            'drug': 'Paracetamol',
            'medicine': 'Ben-u-ron',
            'quantity': 5,
            'fills': []
        }],
        'creationDate': '2017-11-06T18:24:47.444Z'
    },
    {
        'patient': '5a04fd095510e58e3967f6a5', // patient2
        'physician': '5a04fcd65510e58e3967f69f', // physician2
        'prescriptions': [{
            'expirationDate': '2018-02-30',
            'prescribedPosology': {
                'quantity': '500',
                'technique': 'oral',
                'interval': '2 n\' 2 hours',
                'period': '36 hours'
            },
            'presentation': {
                'form': 'xarope',
                'concentration': 10,
                'quantity': 2000
            },
            'drug': 'Paracetamol',
            'medicine': 'Ben-u-ron',
            'quantity': 3,
            'fills': []
        }],
        'creationDate': '2017-11-09T18:24:47.444Z'
    }
];
