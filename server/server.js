/**
 * Video Translation Simulation Server
 * -----------------------------------
 * This script simulates a video translation backend with the following functionality:
 * 
 * - **POST /create**: Creates a video translation job with a unique ID, random delay, and initial status 
 *   (either 'pending' or 'error' based on a configurable error rate).
 *   - The 'error' status indicates that an error has occurred during video translation.
 *   - While errors could occur at any time, we assign the 'error' status at the time of job creation for simplicity.
 * - **GET /status**: Checks the status of an existing job, returning 'pending', 'completed', or 'error'.
 * 
 * **Features:**
 * - Simulates random processing delays for each job (configurable with MIN_DELAY and MAX_DELAY).
 * - Handles errors based on a configurable error rate (ERROR_RATE).
 * - Ensures unique video IDs for each job.
 * 
 * **Configuration:**
 * The following environment variables can be used to customize behavior:
 * - `PORT`: The port on which the server runs (default: 3000).
 * - `MIN_DELAY`: Minimum processing delay in milliseconds (default: 5000 ms).
 * - `MAX_DELAY`: Maximum processing delay in milliseconds (default: 15000 ms).
 * - `ERROR_RATE`: Probability of a job being marked as 'error' (default: 0.3).
 * 
 * **Usage:**
 * - Start the server: `node server.js`
 * - Create a job: `POST /create` with an optional JSON body containing `videoID`.
 * - Check a job's status: `GET /status?videoID=YOUR_VIDEO_ID`
 */
require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;              // sever port
const MIN_DELAY = process.env.MIN_DELAY || 5000;    // minimum delay time of video translation
const MAX_DELAY = process.env.MAX_DELAY || 50000;   // maximum delay time of video translation
const ERROR_RATE = process.env.ERROR_RATE || 0.03;   // error rate to randomly assign 'error' status

const videos ={};


/**
 * POST /create
 * ------------------------------
 * Creates a new video translation job.
 * 
 * Request Body (JSON):
 * - videoID (optional): A unique ID for the video. If not provided, an error will occur.
 * 
 * Response (JSON):
 * - videoID: The unique ID of the created job.
 * - message: Instructions to check the job status.
 * 
 * Features:
 * - Assigns a random delay (in milliseconds) to the job, based on MIN_DELAY and MAX_DELAY.
 * - Randomly sets the status to 'pending' or 'error', based on ERROR_RATE.
 * - Ensures that the provided videoID is unique.
 */
app.post('/create', (req, res) => {
    console.log('Received POST /create request');
    console.log('Request body:', req.body);

    const videoID = req.body?.videoID;
    if (!videoID) {
        return res.status(400).json({ error: 'videoID is required in the request body' });
    }

    const delay = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1) + MIN_DELAY); // Generate a random delay
    const status = Math.random() > ERROR_RATE ? 'pending' : 'error'; // Randomly assign 'error' status

    // Ensure the videoID is unique
    if (videos[videoID]) {
        return res.status(400).json({ error: `VideoID '${videoID}' already exists. Please choose a different ID.` });
    }

    videos[videoID] = {
        startTime: Date.now(),
        delay: delay,
        status: status,
    };

    // Log job details
    console.log(`Video ID: ${videoID}, Delay: ${delay} ms, Initial Status: ${status}`);

    res.json({
        videoID: videoID,
        message: `Video translation added. Check status using /status?videoID=${videoID}`,
    });
});

/**
 * GET /status
 * ------------------------------
 * Checks the status of a video translation job.
 * 
 * Query Parameters:
 * - videoID (required): The unique ID of the video job to check.
 * 
 * Response (JSON):
 * - result: The current status of the job ('pending', 'completed', or 'error').
 * 
 * Features:
 * - Updates the status to 'completed' if the job's delay time has passed.
 * - Ensures that only 'pending' jobs can transition to 'completed' (excluding 'error' status).
 * - Handles cases where the videoID does not exist (returns 404).
 */
app.get('/status', (req, res) => {
    const videoID = req.query.videoID;

    // ensuring the videoID exists
    if (!videoID || !videos[videoID]) {
        return res.status(404).json({ error: "Video not found" });
    }

    const video = videos[videoID];
    const elapsedTime = Date.now() - video.startTime;

    // Transition to 'completed' if the delay time has passed for 'pending' status
    if (elapsedTime >= video.delay && video.status === "pending") {
        video.status = "completed";
    }

    res.json({ result: video.status });
});


module.exports = app;