/**
 * Exponential Backoff Polling Strategy
 * -------------------------------------
 * This function implements an exponential backoff polling strategy to check the status of a job.
 * 
 * The strategy works as follows:
 * - Start with an initial interval (default: 1000 ms) between polling requests.
 * - Double the interval after each polling attempt until it reaches a stable maximum interval (default: 8000 ms).
 * - Continue polling until the job status transitions to either 'completed' or 'error'.
 * 
 * **Key Points:**
 * - This strategy minimizes unnecessary frequent polling during long translation times.
 * - While it may increase delays for short translations, the relative delay is small compared to the overall job duration.
 * 
 * **Parameters:**
 * - `client`: An object with a `checkStatus(videoID)` method that polls the status endpoint.
 * - `videoID`: The unique identifier of the job being polled.
 * - `options`: Configuration options:
 *   - `initialInterval`: The initial interval between polling requests (default: 1000 ms).
 *   - `stableInterval`: The maximum interval between polling requests (default: 8000 ms).
 * 
 * **Returns:**
 * - A Promise that resolves to 'completed' when the job is successfully completed.
 * - The Promise rejects with an error if the job status becomes 'error' or a polling request fails.
 */
module.exports = async function exponentialStrategy(client, videoID, options = {}) {
    const initialInterval = options.initialInterval || 1000;
    const stableInterval = options.stableInterval || 8000;

    let interval = initialInterval;

    return new Promise((resolve, reject) => {
        const poll = async () => {
            try {
                const status = await client.checkStatus(videoID);

                if (status === 'completed') {
                    resolve('completed');
                } else if (status === 'error') {
                    reject(new Error('Error in video translation.'));
                } else {
                    // pending status. Another polling needed
                    console.log(`Polling: status=${status}, next interval=${interval}ms`);

                    setTimeout(poll, interval);
                    
                    // Increase interval until it reaches stable interval
                    interval = Math.min(interval * 2, stableInterval);
                }
            } catch (error) {
                reject(error); 
            }
        };

        poll();
    });
};