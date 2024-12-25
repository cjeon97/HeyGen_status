const axios = require('axios');
const http = require('http');
const app = require('../server/server');
const expectedTimeStrategy = require('../client/strategies/expectedTime');

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

describe('Expected Time Polling Strategy', () => {
    const baseUrl = 'http://127.0.0.1:3000';

    test('Poll job status based on expected time strategy', async () => {
        const videoID = 'expectedTest';
        const expectedCompletionTime = 30000; // Job expected to complete in 30 seconds
        const jobStartTime = Date.now(); // Job starts now

        // Create a job with a unique videoID
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

        // Poll for the job status using the expected time strategy
        let finalStatus;
        try {
            finalStatus = await expectedTimeStrategy(
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
                    expectedCompletionTime,
                    jobStartTime,
                    coefficients: { a: 1 / 30000, b: 0.01, c: 1000 }, // Default coefficients
                    minimumInterval: 500,
                    maximumInterval: 3000,
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
