# Video Translation Client Library

This client library provides functionality for polling the status of video translation jobs using two strategies: **Exponential Backoff** and **Expected Time-Based Polling**. These strategies are designed to balance delay time and server cost.

## Features

- **Create Video Translation Job**: Initiates a translation job on the server.
- **Check Job Status**: Polls the server for job status (`pending`, `completed`, or `error`).
- **Polling Strategies**:
  - **Exponential Backoff**: Gradually increases polling intervals to reduce server load over time.
  - **Expected Time-Based Polling**: Dynamically adjusts intervals based on the expected completion time.

---

## Why These Strategies Are Efficient

Polling strategies aim to strike a balance between timely updates (low delay) and reducing unnecessary server requests (low cost). Both the **Exponential Backoff** and **Expected Time-Based Polling** strategies are efficient for different scenarios:

1. **Exponential Backoff**:
   - Starts with a small interval, making frequent requests initially.
   - Gradually increases the interval, reducing the frequency of requests as time progresses.
   - This approach reduces server load significantly during long-running tasks while still ensuring updates are received in a timely manner.
   - For longer translation task, unneccessary delays increases as well, but the proportion of the delay to the actual translation time is not significantly increased.
   - Best suited for scenarios where the job duration is unpredictable or varies significantly. It’s a simple and robust approach to balance cost and delay.

2. **Expected Time-Based Polling**:
   - Dynamically adjusts polling intervals based on the time remaining until the expected completion.
   - Polls less frequently when far from the expected completion time and more frequently when near.
   - If actual data about job completion times and a mathematical formula (e.g., a regression model) are available, the strategy can be further fine-tuned to optimize server usage and reduce delays.
   - Ideal for use cases with well-defined or predictable job durations. This strategy becomes increasingly efficient when historical data or accurate completion time estimates are available, allowing fine-tuning through mathematical modeling.


By leveraging these strategies based on the context of the use case, the client library ensures a flexible and efficient solution for polling video translation job statuses.

---


## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/your-repo-name.git
   cd your-repo-name
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## Usage

### 1. Initialize the Client

The client is used to communicate with the server for job creation and status checking.

```javascript
const VideoTranslationClient = require('./client/client');
const client = new VideoTranslationClient('url'); // Replace with video translation server
```

### 2. Create a Job

Create a video translation job by providing a unique `videoID` (Random generation if not provided):

```javascript
const videoID = 'videoTest1';
const createResponse = await client.createJob(videoID);
console.log('Job created:', createResponse);
```

### 3. Poll Job Status Using Strategies

#### **a. Exponential Backoff Strategy**

Use the **Exponential Backoff Strategy** to poll job status with gradually increasing intervals. Set options; initialInterval, stableInterval

```javascript
const exponentialStrategy = require('./client/strategies/exponential');

const finalStatus = await exponentialStrategy(client, videoID, {
    initialInterval: 1000, // Start polling with a 1-second interval
    stableInterval: 8000, // Maximum interval for polling
});

console.log('Final Status:', finalStatus);
```

#### **b. Expected Time-Based Strategy**

Use the **Expected Time-Based Strategy** to poll job status based on the job's expected completion time.

```javascript
const expectedTimeStrategy = require('./client/strategies/expectedTime');

const expectedCompletionTime = 30000; // Job expected to complete in 30 seconds
const jobStartTime = Date.now();

const finalStatus = await expectedTimeStrategy(client, videoID, {
    expectedCompletionTime,
    jobStartTime,
    coefficients: { a: 1 / 30000, b: 0.01, c: 500 }, // Adjust coefficients as needed
    minimumInterval: 500, // Minimum polling interval
    maximumInterval: 3000, // Maximum polling interval
});

console.log('Final Status:', finalStatus);
```

---

## Example Application

Here’s a simple example that demonstrates how to use the client library and strategies:

```javascript
const VideoTranslationClient = require('./client/client');
const exponentialStrategy = require('./client/strategies/exponential');
const expectedTimeStrategy = require('./client/strategies/expectedTime');

(async () => {
    const client = new VideoTranslationClient('http://localhost:3000');
    const videoID = 'exampleVideo';

    // Step 1: Create a job
    const createResponse = await client.createJob(videoID);
    console.log('Job Created:', createResponse);

    // Step 2a: Poll using Exponential Backoff
    const exponentialStatus = await exponentialStrategy(client, videoID, {
        initialInterval: 1000,
        stableInterval: 8000,
    });
    console.log('Exponential Backoff Final Status:', exponentialStatus);

    // Step 2b: Poll using Expected Time-Based Strategy
    const expectedCompletionTime = 30000; // 30 seconds
    const expectedStatus = await expectedTimeStrategy(client, videoID, {
        expectedCompletionTime,
        jobStartTime: Date.now(),
        coefficients: { a: 1 / 30000, b: 0.01, c: 500 },
        minimumInterval: 500,
        maximumInterval: 3000,
    });
    console.log('Expected Time-Based Final Status:', expectedStatus);
})();
```

---

## Testing

Run tests for the client library and strategies using Jest:

```bash
npm test
```

---

### Test Cases

#### **1. Exponential Strategy**

**Scenario**: The translation job takes 45678ms to complete. Polling starts with an initial interval of 1000ms, doubling until it reaches the maximum interval of 8000ms.

**Test Output**:
```
Translation time was 45678ms
Polling: status=pending, next interval=1000ms
Polling: status=pending, next interval=2000ms
Polling: status=pending, next interval=4000ms
Polling: status=pending, next interval=8000ms
Polling: status=pending, next interval=8000ms
Polling: status=pending, next interval=8000ms
Polling: status=pending, next interval=8000ms
Polling: status=pending, next interval=8000ms
Final Status: completed

Delayed time is 1328 ms with 9 polling
```

**Observation**:
- The strategy limits unnecessary requests by gradually increasing the interval.
- The delay after the translation completion is small, demonstrating the balance between responsiveness and efficiency.

---

#### **2. Expected Time-Based Strategy**

**Scenario**: The translation job takes 41641ms to complete, but the expected completion time is set to 30000ms. Polling intervals decrease dynamically as the job approaches the expected completion time.

**Test Output**:
```
Translation time was 41641ms and expected completion time was 30000ms
Polling: status=pending, nextInterval=3000ms
Polling: status=pending, nextInterval=3000ms
Polling: status=pending, nextInterval=3000ms
Polling: status=pending, nextInterval=3000ms
Polling: status=pending, nextInterval=3000ms
Polling: status=pending, nextInterval=3000ms
Polling: status=pending, nextInterval=3000ms
Polling: status=pending, nextInterval=3000ms
Polling: status=pending, nextInterval=2222.966033333333ms
Polling: status=pending, nextInterval=1488.2133333333334ms
Polling: status=pending, nextInterval=1180.3687ms
Polling: status=pending, nextInterval=1000ms
Polling: status=pending, nextInterval=1000ms
Polling: status=pending, nextInterval=1000ms
Polling: status=pending, nextInterval=1000ms
Polling: status=pending, nextInterval=1000ms
Polling: status=pending, nextInterval=1000ms
Polling: status=pending, nextInterval=1000ms
Polling: status=pending, nextInterval=1000ms
Polling: status=pending, nextInterval=1000ms
Polling: status=pending, nextInterval=1000ms
Polling: status=pending, nextInterval=1000ms
Polling: status=pending, nextInterval=1000ms
Polling: status=pending, nextInterval=1000ms
Final Status: completed
```

**Observation**:
- The strategy demonstrates dynamic adjustments to polling intervals based on the remaining time.
- Because the actual translation time exceeds the expected time, polling intervals stabilize at the minimum interval (`1000ms`) near completion.
- **Potential Improvement**: By incorporating historical data or regression models for better predictions, the strategy could further minimize delay and reduce the number of polling attempts.

---

#### **3. Error Case**

**Scenario**: The server randomly assigns an error status to a job with a probability of `0.03`. If this occurs during the test, the client will terminate polling and display an error message.

**Test Output** (if error occurs):
```
Error in video translation.
```

**Instructions**:
- If this error appears, it is due to the random error generation on the server.
- Re-run the test command:
  ```bash
  npm test
  ```

---