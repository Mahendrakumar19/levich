# Live Bidding Platform (Level 1 Challenge)

This repo contains a simple live bidding platform:

- `server`: Node.js + Express + Socket.io backend
- `client`: React + Vite frontend

Quick local run (requires Docker):

```bash
docker-compose up --build
```

Then open `http://localhost:5173` to view the client, API is at `http://localhost:3000`.

Notes:
- Server exposes `GET /items` which returns items and `serverTime` for clock sync.
- Socket events:
  - `BID_PLACED` — client -> server with `{ itemId, amount, bidderId }`
  - `UPDATE_BID` — server -> all when bid accepted
  - `BID_REJECTED` — server -> bidder when bid invalid (OUTBID / AUCTION_ENDED)
- Concurrency: server uses per-item `async-mutex` locks to ensure only the first simultaneous bid is accepted.
