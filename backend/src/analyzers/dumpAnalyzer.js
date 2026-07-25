/**
 * Detects repositories that were uploaded in a compressed burst rather than
 * built incrementally via Git's intended workflow.
 *
 * Detection heuristics (ANY match → flagged as dump):
 *
 * 1. SINGLE SHOT: 1 commit, repo size > 150 KB
 *    → "Uploaded folder directly instead of building incrementally"
 *
 * 2. FEW-SHOT LARGE: ≤ 3 commits, repo size > 800 KB
 *    → "Large codebase with almost no commit history"
 *
 * 3. COMPRESSED TIME DUMP: Any commit count, but all commits span ≤ 6 hours
 *    AND repo size > 300 KB
 *    → "All commits happened within 6 hours — rapid bulk push, not incremental development"
 *    → This catches repos like coupon-management-system: 8 commits in 78 minutes, 53 MB
 *
 * 4. HIGH DENSITY: Commits-per-KB ratio is extremely low (< 1 commit per 1 MB, ≥ 5 MB repo)
 *    → Catches large monolithic uploads regardless of timing
 *
 * Score range: 0 (all repos are dumps) to 100 (all incremental builds).
 */
module.exports = function analyzeCodeDumps(rawData) {
  const { repos } = rawData;
  const originalRepos = repos.filter(r => !r.isFork);
  const total = originalRepos.length;

  if (total === 0) {
    return {
      score: 100,
      label: 'Incremental Developer',
      verdict: 'No original repositories found to analyze for code dumps.',
      details: { originalCount: 0, dumpCount: 0, dumpedRepos: [] }
    };
  }

  const dumpedRepos = [];

  originalRepos.forEach(repo => {
    const commitCount = repo.commits.length;
    const sizeKB = repo.size; // KB from GitHub API
    const sizeMB = sizeKB / 1024;

    if (commitCount === 0 || sizeKB === 0) return;

    let isDump = false;
    let reason = '';

    // ── Heuristic 1: Single shot ─────────────────────────────────────────
    if (!isDump && commitCount === 1 && sizeKB > 150) {
      isDump = true;
      reason = `Single-commit upload of ${sizeMB.toFixed(1)} MB codebase`;
    }

    // ── Heuristic 2: Few-shot large ──────────────────────────────────────
    if (!isDump && commitCount <= 3 && sizeKB > 800) {
      isDump = true;
      reason = `${commitCount} commits for a ${sizeMB.toFixed(1)} MB repo — bulk upload pattern`;
    }

    // ── Heuristic 3: Compressed time dump ────────────────────────────────
    // Sort commits by date and calculate the span from first to last
    if (!isDump && sizeKB > 300 && repo.commits.length >= 2) {
      const dates = repo.commits
        .map(c => new Date(c.authorDate || c.date))
        .filter(d => !isNaN(d))
        .sort((a, b) => a - b);

      if (dates.length >= 2) {
        const firstDate = dates[0];
        const lastDate = dates[dates.length - 1];
        const spanHours = (lastDate - firstDate) / (1000 * 60 * 60);

        // All commits in < 6 hours + > 300 KB = compressed bulk push
        if (spanHours < 6) {
          isDump = true;
          const spanMinutes = Math.round(spanHours * 60);
          reason = `${commitCount} commits across ${spanMinutes < 60
            ? `${spanMinutes} minutes`
            : `${spanHours.toFixed(1)} hours`} for ${sizeMB.toFixed(1)} MB — compressed bulk upload`;
        }
      }
    }

    // ── Heuristic 4: High density (low commit-to-size ratio) ─────────────
    // < 1 commit per MB on repos ≥ 5 MB (genuine builds have many commits per MB)
    if (!isDump && sizeMB >= 5) {
      const commitsPerMB = commitCount / sizeMB;
      if (commitsPerMB < 1) {
        isDump = true;
        reason = `${commitsPerMB.toFixed(2)} commits/MB — ${sizeMB.toFixed(1)} MB repo with only ${commitCount} commits suggests folder dump`;
      }
    }

    if (isDump) {
      dumpedRepos.push({ name: repo.name, commits: commitCount, sizeKB, reason });
    }
  });

  const dumpCount = dumpedRepos.length;
  const score = Math.round(((total - dumpCount) / total) * 100);

  let label = 'Incremental Builds';
  let verdict = 'Clean commit discipline. All repositories show evidence of iterative development with regular history across their lifetime.';

  if (dumpCount === 0) {
    label = 'Incremental Developer';
    verdict = 'Excellent incremental build habits. Every repository shows meaningful commit history proportional to its size.';
  } else if (score < 50) {
    label = 'Code Dumper';
    verdict = `${dumpCount} of ${total} repositories were uploaded in compressed bulk sessions rather than built incrementally (${dumpedRepos.map(r => r.name).slice(0, 2).join(', ')}). This strongly suggests folder-zip uploads instead of genuine git development.`;
  } else if (score < 85) {
    label = 'Occasional Dumps';
    verdict = `Mostly incremental work, but ${dumpCount} repositor${dumpCount > 1 ? 'ies' : 'y'} show compressed upload patterns (${dumpedRepos.map(r => r.name).slice(0, 2).join(', ')}). Commit more frequently while working rather than uploading the final product.`;
  }

  return {
    score,
    label,
    verdict,
    details: {
      originalCount: total,
      dumpCount,
      dumpedRepos
    }
  };
};
