const axios = require('axios');

/**
 * VideoTranslationClient
 * ----------------------
 * A client library to interact with the Video Translation API. This class provides methods to:
 * - Create a new video translation job.
 * - Check the status of an existing video translation job.
 * 
 * Methods:
 * - `createJob(videoID)`: Sends a POST request to create a new video translation job with a unique ID.
 * - `checkStatus(videoID)`: Sends a GET request to check the current status of a video translation job.
 * 
 * Usage:
 * const client = new VideoTranslationClient('http://localhost:3000');
 * const response = await client.createJob('video123');
 * const status = await client.checkStatus('video123');
 */
class VideoTranslationClient {
    /**
     * Constructor
     * @param {string} baseURL - The base URL of the Video Translation API
     */
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    /**
     * Create a new video translation job.
     * 
     * Sends a POST request to the `/create` endpoint to create a new video translation job
     * with the specified `videoID`.
     * 
     * @param {string} videoID - A unique identifier for the video translation job.
     * @returns {Object} - The server response containing the video ID and a message.
     * @throws {Error} - If the request fails, throws an error with details.
     */
    async createJob(videoID) {
        try {
            const response = await axios.post(`${this.baseURL}/create`, { videoID });
            return response.data;
        } catch (error) {
            throw new Error(`Error creating job: ${error.response?.data?.error || error.message}`);
        }
    }

    /**
     * Check the status of a video translation job.
     * 
     * Sends a GET request to the `/status` endpoint to retrieve the current status of the
     * video translation job identified by `videoID`.
     * 
     * @param {string} videoID - The unique identifier of the video translation job to check.
     * @returns {string} - The current status of the job ('pending', 'completed', or 'error').
     * @throws {Error} - If the request fails, throws an error with details.
     */
    async checkStatus(videoID) {
        try {
            const response = await axios.get(`${this.baseURL}/status`, { params: { videoID } });
            return response.data.result;
        } catch (error) {
            throw new Error(`Error checking status: ${error.response?.data?.error || error.message}`);
        }
    }
}

module.exports = VideoTranslationClient;