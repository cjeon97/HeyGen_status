const axios = require('axios');
const app = require('../server/server');
const http = require('http');
const exponentialStrategy = require('../client/strategies/exponential');

let server;

beforeAll((done) => {
    const PORT = 3000;
    server = http.createServer(app).listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
        done();
    });
});

afterAll((done) => {
    if (server) {
        server.close(() => {
            console.log('Server stopped.');
            done();
        });
    } else {
        done();
    }
});

describe('Exponential Backoff Strategy', () => {
    const baseUrl = 'http://127.0.0.1:3000';

    test('Poll job status using exponential backoff until completion', async () => {
        // Step 1: Create a job with a unique videoID
        const videoID = 'expTest';
        let createResponse;

        try {
            createResponse = await axios.post(`${baseUrl}/create`, { videoID });
            console.log('Create Job Response:', createResponse.data);
        } catch (error) {
            console.error('Error creating job:', error.message);
            throw error; // Fail the test if job creation fails
        }

        // Assert the job creation response
        expect(createResponse.data).toHaveProperty('videoID', videoID);
        expect(createResponse.data).toHaveProperty('message');
        console.log('Job created successfully.');

        // Step 2: Poll for the job status using exponential backoff
        let finalStatus;
        try {
            finalStatus = await exponentialStrategy(
                {
                    async checkStatus(videoID) {
                        const statusResponse = await axios.get(`${baseUrl}/status`, {
                            params: { videoID },
                        });
                        return statusResponse.data.result;
                    },
                },
                videoID,
                {
                    initialInterval: 1000, // Start with 1-second interval
                    stableInterval: 8000, // Maximum polling interval
                }
            );
        } catch (error) {
            console.error('Error polling job status:', error.message);
            throw error; // Fail the test if polling fails
        }

        // Step 3: Assert the final status
        console.log('Final Status:', finalStatus);
        expect(['completed', 'error']).toContain(finalStatus);
    }, 50000);
});