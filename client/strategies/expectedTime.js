/**
 * Expected Time-Based Polling Strategy
 * -------------------------------------
 * Dynamically adjusts the polling interval using a quadratic function based on
 * the time remaining, given the total expected time for job completion.
 * 
 * **Formula**:
 * I(t) = a * t^2 + b * t + c
 * 
 * **How It Works**:
 * - The polling interval decreases as the job nears its expected completion time.
 * - The quadratic function ensures smooth adjustments in intervals:
 *   - Larger intervals when the job is far from completion.
 *   - Smaller intervals as the job approaches completion.
 * - Clamps intervals to ensure they stay within a specified range (`minimumInterval` to `maximumInterval`).
 * 
 * **Parameters:**
 * - `client`: An object with a `checkStatus(videoID)` method to poll the job status.
 * - `videoID`: The unique identifier of the job being polled.
 * - `options`: Configuration options:
 *   - `expectedCompletionTime`: The total expected time for the job to complete (in milliseconds).
 *   - `coefficients`: The coefficients `a`, `b`, `c` for the quadratic function (default: `{ a: 1/30000, b: 0.01, c: 1000 }`).
 *   - `minimumInterval`: Minimum allowable polling interval (default: 500 ms).
 *   - `maximumInterval`: Maximum allowable polling interval (default: 3000 ms).
 *   - `jobStartTime`: The start time of the job (default: current time via `Date.now()`).
 * 
 * **Returns:**
 * - A Promise that resolves to 'completed' when the job is successfully completed.
 * - The Promise rejects with an error if the job status becomes 'error' or a polling request fails.
 * 
 * **Usage:**
 * const result = await expectedTimeStrategy(client, videoID, {
 *   expectedCompletionTime: 20000, // Job expected to complete in 20 seconds
 *   coefficients: { a: 1/30000, b: 0.01, c: 1000 },
 *   minimumInterval: 500,
 *   maximumInterval: 3000,
 * });
 */
module.exports = async function expectedTimeStrategy(client, videoID, options = {}) {
    const {
        expectedCompletionTime, // Total time expected for job completion
        coefficients = { a: 1 / 30000, b: 0.01, c: 500 }, // Default quadratic coefficients
        minimumInterval = 500, // Minimum allowable polling interval (ms)
        maximumInterval = 3000, // Maximum allowable polling interval (ms)
        jobStartTime = Date.now(), // Default: Assume job starts when this function is called
    } = options;

    if (!expectedCompletionTime) {
        throw new Error('Expected completion time must be provided.');
    }

    return new Promise((resolve, reject) => {
        /**
         * Recursive polling function
         * - Checks the job status.
         * - Resolves on 'completed' status.
         * - Rejects on 'error' status.
         * - Adjusts polling intervals dynamically based on the quadratic formula.
         */
        const poll = async () => {
            try {
                const status = await client.checkStatus(videoID);

                if (status === 'completed') {
                    resolve('completed');
                } else if (status === 'error') {
                    reject(new Error('Error in video translation.'));
                } else {
                    // Calculate time elapsed and time remaining
                    const currentTime = Date.now();
                    const elapsedTime = currentTime - jobStartTime;
                    const timeRemaining = Math.max(0, expectedCompletionTime - elapsedTime);

                    // Calculate the polling interval using the quadratic formula
                    const { a, b, c } = coefficients;
                    let interval = a * timeRemaining ** 2 + b * timeRemaining + c;

                    // Clamp the interval between minimumInterval and maximumInterval
                    interval = Math.max(minimumInterval, Math.min(interval, maximumInterval));

                    console.log(
                        `Polling: status=${status}, elapsedTime=${elapsedTime}ms, timeRemaining=${timeRemaining}ms, nextInterval=${interval}ms`
                    );

                    // Schedule the next poll
                    setTimeout(poll, interval);
                }
            } catch (error) {
                reject(error);
            }
        };

        poll();
    });
};