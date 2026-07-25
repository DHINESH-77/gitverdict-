/**
 * Reviews the profile for engineering best practices and community collaboration.
 *
 * Signal sources:
 * 1. Presence of test directories or testing keywords in commit messages/READMEs
 * 2. Pull Request events on repositories the user does NOT own (external contributions)
 * 3. Issue/comment activity (bug reports, design discussions)
 * 4. GitHub followers (community recognition signal)
 * 5. Total stars received on original repos (quality signal, others found work valuable)
 *
 * Scoring calibration:
 * - Base starts at 15 (profile exists, no other signals detected)
 * - Each signal adds weighted points; maximum is capped at 100
 * - A developer with zero followers, no PRs, and no issues cannot score above 45 on this metric
 *
 * Score range: 10 (no collaboration signals) to 100 (high engagement, testing, community)
 */
module.exports = function analyzeCollaboration(rawData) {
  const { repos, events, profile } = rawData;
  const username = profile.login.toLowerCase();

  let hasTests = false;
  let hasExternalPRs = false;
  let hasIssueActivity = false;
  let externalPRCount = 0;

  const testKeywords = ['test', 'tests', 'testing', 'jest', 'mocha', 'cypress', 'pytest',
    'unittest', 'spec', 'specs', 'vitest', 'jasmine', 'enzyme', 'supertest'];

  const originalRepos = repos.filter(r => !r.isFork);

  // 1. Scan READMEs and commit messages for testing signals
  originalRepos.forEach(repo => {
    // Check README content
    if (repo.readmeText) {
      const readmeLower = repo.readmeText.toLowerCase();
      if (testKeywords.some(kw => readmeLower.includes(kw))) {
        hasTests = true;
      }
    }

    // Check commit messages for testing references
    if (!hasTests) {
      repo.commits.forEach(c => {
        if (c.message) {
          const msgLower = c.message.toLowerCase();
          // "add tests", "write unit test", "fix failing spec" etc.
          if (testKeywords.some(kw => msgLower.includes(kw))) {
            hasTests = true;
          }
        }
      });
    }
  });

  // 2. Scan event history for external PRs and issue interaction
  events.forEach(event => {
    if (event.type === 'PullRequestEvent') {
      const repoOwner = event.repo ? event.repo.split('/')[0].toLowerCase() : '';
      if (repoOwner && repoOwner !== username) {
        hasExternalPRs = true;
        externalPRCount++;
      }
    }

    if (event.type === 'IssuesEvent' || event.type === 'IssueCommentEvent') {
      hasIssueActivity = true;
    }
  });

  // ── Score calculation ──────────────────────────────────────────────────────
  // Base: 15 — just having a public profile
  let score = 15;
  const flags = [];

  // Testing evidence: +15 points (shows engineering discipline)
  if (hasTests) {
    score += 15;
    flags.push('Testing evidence found — references to unit/integration testing suites in READMEs or commit messages');
  }

  // External PR contributions: +10 to +30 based on volume
  if (hasExternalPRs) {
    const prBonus = externalPRCount >= 5 ? 30 : externalPRCount >= 2 ? 20 : 10;
    score += prBonus;
    flags.push(`Open-source contributor — ${externalPRCount} pull request(s) to external repositories in recent activity`);
  }

  // Issue engagement: +10 (communicates, participates in project discussion)
  if (hasIssueActivity) {
    score += 10;
    flags.push('Issue engagement — active participant in bug tracking and technical discussions');
  }

  // Follower tiers — graduated reputation signal
  const followers = profile.followers || 0;
  if (followers >= 1000) {
    score += 25;
    flags.push(`Widely recognized — ${followers.toLocaleString()} followers on GitHub`);
  } else if (followers >= 500) {
    score += 20;
    flags.push(`Strong community presence — ${followers} followers on GitHub`);
  } else if (followers >= 100) {
    score += 12;
    flags.push(`Established community footprint — ${followers} followers on GitHub`);
  } else if (followers >= 20) {
    score += 5;
    flags.push(`Growing community presence — ${followers} followers on GitHub`);
  }
  // 0–19 followers: +0 — no reputation signal yet

  // Star tiers — quality signal (others found the work useful enough to star)
  const totalStars = originalRepos.reduce((sum, r) => sum + (r.stargazersCount || 0), 0);
  if (totalStars >= 500) {
    score += 20;
    flags.push(`Highly acclaimed — ${totalStars} stars across repositories`);
  } else if (totalStars >= 100) {
    score += 15;
    flags.push(`Well-starred work — ${totalStars} total repository stars`);
  } else if (totalStars >= 25) {
    score += 8;
    flags.push(`Reputable repositories — ${totalStars} stars from community members`);
  } else if (totalStars > 0) {
    score += 3;
    // No flag for very low stars — not enough signal
  }

  score = Math.max(10, Math.min(100, score));

  // ── Label and verdict ───────────────────────────────────────────────────────
  let label = 'Lone Coder';
  let verdict = 'No significant collaboration signals detected. Profile activity is isolated to private/personal repositories with no visible community interaction.';

  if (score >= 80) {
    label = 'Community Leader';
    verdict = 'Strong community presence. Demonstrates genuine open-source engagement through external contributions, testing discipline, and community recognition.';
  } else if (score >= 60) {
    label = 'Active Collaborator';
    verdict = 'Visible community engagement. Shows some external contributions or recognized work, with personal projects that follow engineering best practices.';
  } else if (score >= 40) {
    label = 'Solo Builder';
    verdict = 'Self-directed builder. Focuses on personal projects with occasional community signals. Increasing external PR contributions would strengthen this signal significantly.';
  }

  return {
    score,
    label,
    verdict,
    details: {
      hasTests,
      hasExternalPRs,
      hasIssueActivity,
      followers,
      totalStars,
      externalPRCount,
      greenFlagsList: flags
    }
  };
};
