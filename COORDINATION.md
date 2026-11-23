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

## Gist format (`winter-arc-challenge.json`)
```
{
  app: "winter-arc-challenge",
  board: { <name>: { "YYYY-MM-DD": kcal | true } },
  goal: <current kcal>,              // kept for older clients
  goalTs: <ms of newest goal change>,
  goalHistory: [ { from: "YYYY-MM-DD", kcal, ts } ]   // since PR #1
}
```
**Main invariant, don't break it:** on every sync, days missing from local `wa-meals` are first restored from `board[myName]` in the gist; then `board[myName]` is rebuilt from that phone's own `wa-meals`. Other people's columns are taken from the gist unchanged.

## In progress
- Finn's Claude: goal history, [PR #1](https://github.com/BOOMERDOOMER24/Winter-Arc/pull/1), approved, waiting to merge
- Next: Thom's Claude takes the nits from PR #1 review (lists itself here before starting)

## Open ideas / questions
- Challenge window is hard-coded `CH_START` 2026-11-30 → `CH_END` 2027-02-28. Finn would like it open-ended ("as long as we want"); Finn and Thom to decide.

## Decisions
- Architecture stays: static `index.html` + GitHub Pages + Gist sync, no backend.
- Goal is judged per day (goal history), so a new target doesn't change past days.
- Race on simultaneous syncs (~1 s window) accepted for 4 users; self-heals on the next sync.
