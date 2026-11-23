# Tests

Smoke tests that run `index.html` in jsdom with a mocked gist API. No real network, no real data.

```
npm i --no-save jsdom
node tests/goal-history.test.js
node tests/profile-sync.test.js
```
Every PR that touches sync or stored data should run both and say so in the PR description.
