#!/usr/bin/env node

const targetBaseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:3000';
const requestCount = Number(process.env.SMOKE_REQUEST_COUNT || 105);

const run = async () => {
  let saw429 = false;

  for (let i = 0; i < requestCount; i += 1) {
    const response = await fetch(`${targetBaseUrl}/api/test-db`);

    if (response.status === 429) {
      saw429 = true;
      console.log(
        `✅ Rate limiter triggered on request ${i + 1} with status ${response.status}`
      );
      break;
    }
  }

  if (!saw429) {
    throw new Error(
      `Expected to see HTTP 429 within ${requestCount} requests to ${targetBaseUrl}/api/test-db`
    );
  }
};

run().catch((error) => {
  console.error(`❌ Rate limit smoke check failed: ${error.message}`);
  process.exitCode = 1;
});
