const chai = require('chai')
const path = require('path')
//const chaiAsPromised = require('chai-as-promised')
const {
    Pact
} = require('@pact-foundation/pact')
const expect = chai.expect
const API_PORT = process.env.API_PORT || 9123
//chai.use(chaiAsPromised)

var PactResponses = require('./PactResponses')
var FilmsService = require('../FilmsServiceClient');
// Configure and import consumer API
// Note that we update the API endpoint to point at the Mock Service
const LOG_LEVEL = process.env.LOG_LEVEL || 'WARN'

const provider = new Pact({
    consumer: 'Films Client',
    provider: 'Films Provider',
    port: API_PORT,
    log: path.resolve(process.cwd(), 'logs', 'pact.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    logLevel: LOG_LEVEL,
    spec: 2,
    tags: ['films'],
    providerVersion: 1.0
})

var endPoint = 'http://localhost:' + API_PORT;

describe('Pact for Film Provider', () => {
    before(() => {
        filmService = new FilmsService(endPoint);
        return provider.setup();
    })

    // Write pact interations to file
    after(() => {
        return provider.finalize();
    })
    describe('Get all films', () => {
        before(() => {
            return provider.addInteraction({
                state: 'Generate films',
                uponReceiving: 'Get all films',
                withRequest: {
                    method: 'GET',
                    path: '/films/',
                    headers: {
                        'Accept': 'application/json'
                    }
                },
                willRespondWith: {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: PactResponses.allFilmsResponse
                }
            })
        })

        it('returns all films', () => {
            return filmService.getAllFilms()
                .then(response => {
                    expect(response).to.be.not.null;
                    expect(response).to.have.length(3);
                    expect(response[0].Descripcion).to.equal("Space");

                    //Generated value it's used on client tests
                    expect(response[2].id).to.equal(10);
                });
        });
    });
    describe('Get film by ID', () => {
        before(() => {
            provider.addInteraction({
                state: 'Generate films',
                uponReceiving: 'Get all stored films',
                withRequest: {
                    method: 'GET',
                    path: '/films/1',
                    headers: {
                        'Accept': 'application/json'
                    }
                },
                willRespondWith: {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: PactResponses.oneFilmResponse
                }
            });
            provider.addInteraction({
                state: 'Generate films',
                uponReceiving: 'film not found',
                withRequest: {
                    method: 'GET',
                    path: '/films/99',
                    headers: {
                        'Accept': 'application/json'
                    }
                },
                willRespondWith: {
                    status: 404
                }
            });
        });

        it('returns one film', () => {
            return filmService.getFilmById(1)
                .then(response => {
                    expect(response).to.be.not.null;
                    expect(response.Year).to.be.eq(1980);
                });
        });
        it('returns not found when film does not exist', () => {
            return filmService.getFilmById(99)
                .then(response => {
                    expect(response).to.be.not.null;
                    expect(response.statusCode).to.be.eq(404);
                });
        });
    });
});