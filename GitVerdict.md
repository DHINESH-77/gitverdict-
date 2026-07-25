# GitVerdict — What Your GitHub Actually Says About You

**One-liner:** Paste any GitHub username → get a plain-language "verdict report" that reads between the lines of your repos and commits, instead of just showing raw stats.

## Problem it solves

Recruiters skim GitHub profiles for seconds and judge by surface signals — repo count, green squares, stars. This rewards profile-gaming (forking popular repos, one-shot code dumps right before an interview, copy-pasted READMEs) over real, consistent work. Existing tools (GitHub stats cards, profile visualizers) just display numbers — they don't tell you what those numbers actually mean. GitVerdict closes that gap: same public data, but interpreted honestly.

## Core flow

1. User enters a GitHub username (no auth needed — public API only)
2. Backend fetches via GitHub REST API:
   - public repos
   - per-repo commit history
   - commit messages
   - languages
   - README content
   - fork status
   - first-commit vs total-commits ratio
   - commit timestamps
3. Backend runs a set of rule-based checks (no ML needed) on that raw data
4. Frontend renders a verdict card — not a stats table — plain-language findings

## What the report shows (data → verdict, not just data)

| Signal | Raw data pulled | Verdict generated |
|--------|-----------------|-------------------|
| Repo originality | fork status per repo | "12 repos, but only 4 are original work — the rest are untouched forks" |
| Commit pattern | commit timestamps across repo lifetime | "80% of commits happened in the last 3 days — looks like a pre-deadline rush, not sustained work" |
| Commit message quality | commit message text | "6 of 10 recent commits are generic ('update', 'fix', 'final') — low documentation discipline" |
| README authenticity | README text across repos | "3 repos share near-identical README text — likely copy-pasted, not written per project" |
| Real language usage | languages weighted by commit volume/recency | "Profile claims full-stack, but 90% of actual commits are frontend-only" |
| Dump detection | first commit size vs total repo size | "This repo's first commit contains ~95% of the final code — likely uploaded in one shot, not built incrementally" |
| Green flags | tests present, PRs to other repos, issue activity | "Has open-source PR contributions — genuine collaborative signal" |

**Final output:** an overall one-line summary (e.g. "Consistent original work with minor documentation gaps" vs "Mostly forked/dumped content, low sustained-activity signal") plus the itemized breakdown above.

## Tech stack

- **Frontend:** React — single input (username) → verdict report page
- **Backend:** Node.js/Express — GitHub REST API calls + rule-based scoring logic
- **No database required for MVP** — stateless fetch-and-analyze on each request (skip Mongo to save build time; add caching only if time allows)
- **Deploy:** Vercel (frontend) + Render (backend)

## Scoring logic (all rule-based, explainable — no black-box ML)

- Fork ratio = forked-untouched repos / total repos
- Commit burst detection = % of commits within last N days vs repo lifetime
- Message quality = flag messages matching a generic-word list ("update", "fix", "final", "changes") / total messages
- README duplication = simple text similarity check across a user's own repos
- Language-by-commit weighting = language stats API cross-referenced with commit recency, not just repo count
- Dump detection = ratio of first-commit diff size to final codebase size

## Why it fits the judging criteria

- **Problem Relevance:** directly addresses the exact issue DevsUnite's own rules mention — spotting non-genuine/dumped submissions — applied generally to any GitHub profile
- **Technical Execution:** real API integration + concrete scoring logic, not a static list
- **Deployment:** simple two-service architecture, fast to deploy
- **Innovation:** existing tools show stats; this interprets them — that's the differentiator
- **Clarity of Thought:** every verdict traces back to an explainable rule you can walk through live, no hand-waving

## Build order (for Antigravity to scaffold)

1. Express backend: GitHub API wrapper (repos, commits, languages, README fetch)
2. Scoring module: implement the 6 rule checks above as pure functions taking raw API data → verdict strings
3. React frontend: input form → loading state → verdict card UI
4. Wire frontend to backend, test on a few real usernames
5. Deploy both, do a final pass on verdict wording (needs to sound human, not robotic)
