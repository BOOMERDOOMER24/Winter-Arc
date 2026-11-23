# Coordination

Shared notes for everyone working on Winter Arc: Finn, Thom, and their Claudes.
Read this after every `git pull`. Keep it short and current, and delete entries once they're done.

## Rules
- **One change at a time.** Before editing `index.html`, put your name under *In progress*.
- **Pull requests only.** Never push straight to `main`. The other side reviews the PR, then it gets merged. Pages deploys from `main`.
- **Small commits** with clear messages.
- **Gist format changes are additive only.** Never rename or remove fields, because phones may still be running an older cached `index.html`.
- **No secrets in the repo.** Tokens and gist IDs stay on the phones (localStorage `wa-sync`).
- After a merge that changes sync logic, all four phones fully close and reopen the home-screen app.

## Gist format: two files in one gist
A gist `PATCH` only touches the files it names. Old cached clients only ever rewrite the board file, so they can never wipe accounts.

`winter-arc-challenge.json` (board):
```
{
  app: "winter-arc-challenge",
  board: { <name>: { "YYYY-MM-DD": kcal | true } },
  goal: <current kcal>,              // kept for older clients
  goalTs: <ms of newest goal change>,
  goalHistory: [ { from: "YYYY-MM-DD", kcal, ts } ]   // since PR #1
}
```
`winter-arc-profiles.json` (accounts, since PR #6):
```
{
  app: "winter-arc-profiles",
  profiles: { <name>: {
    v: 1, ts,
    sec:  { "<localStorage key>": { v, ts } },   // wa-profile, wa-mymeals, wa-weights, wa-lifts,
                                                 // wa-liftnames, wa-shop, wa-recent, wa-rot
    days: { "YYYY-MM-DD": { v: <wa-meals day>, ts } }
  } }
}
```
New shared data (library #7, people #5, …) gets **its own file or goes into the profiles file, never into the board file**.

**Privacy (Thom's decision):** every account is readable by everyone with the token. That's intended.

**Account sync (PR #6):** a device only writes `profiles[myName]`. Per section and per day, newest `ts` wins (local `wa-sects-ts` / `wa-meals-ts`). Data applied from the gist is written with `LS.raw` (no new timestamp); every app edit goes through `LS.set`, which stamps it.

**Main invariant, don't break it:** on every sync, days missing from local `wa-meals` are first restored from `board[myName]` in the gist; then `board[myName]` is rebuilt from that phone's own `wa-meals`. Other people's columns are taken from the gist unchanged.

## In progress
- Thom's Claude: finishing PR #6 (profiles moved to their own file + one-sync-at-a-time guard). **`index.html` locked** until it's merged. Thom asked Thom's Claude to do the pushes from now on.
- Queued, in order: refactor/split (#3) → workout mode (#8) → libraries (#7) → people list + id accounts (#5) → FIT import. Nits from #1/#4 reviews go in with the refactor.

## Open ideas / questions
- Challenge window is hard-coded `CH_START` 2026-11-30 → `CH_END` 2027-02-28. Finn would like it open-ended ("as long as we want"); Finn and Thom to decide.

## Decisions
- Architecture stays: static `index.html` + GitHub Pages + Gist sync, no backend.
- Goal is judged per day (goal history), so a new target doesn't change past days.
- Race on simultaneous syncs (~1 s window) accepted for 4 users; self-heals on the next sync. On one device, syncs never overlap (in-flight guard).
- Accounts will be keyed by a fixed `id` (with #5); names are display only.
