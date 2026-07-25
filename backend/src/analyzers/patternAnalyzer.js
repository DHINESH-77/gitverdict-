/**
 * Analyzes commit timelines to detect pre-deadline rushes vs. sustained activity.
 * 
 * Rules:
 * - Commit burst detection = repos where >80% of commits occurred within a 3-day window,
 *   despite the repository having a lifetime of over 10 days.
 * - Score range: 0 (completely rushed/bursty) to 100 (consistent pacing)
 */
module.exports = function analyzeCommitPattern(rawData) {
  const { repos } = rawData;
  const originalRepos = repos.filter(r => !r.isFork && r.commits.length > 0);

  if (originalRepos.length === 0) {
    return {
      score: 100,
      label: 'Consistent Pacing',
      verdict: 'No commits on original repositories to analyze.',
      details: { activeReposCount: 0, burstReposCount: 0 }
    };
  }

  let burstReposCount = 0;
  let activeReposCount = 0;
  const burstRepoNames = new Set();

  originalRepos.forEach(repo => {
    const commits = [...repo.commits].sort((a, b) => new Date(a.authorDate) - new Date(b.authorDate));
    if (commits.length < 4) return;

    activeReposCount++;
    const totalCommits = commits.length;

    const repoAgeDays = (new Date() - new Date(repo.createdAt)) / (1000 * 60 * 60 * 24);
    
    if (repoAgeDays > 10) {
      let maxCommitsInWindow = 0;
      for (let i = 0; i < commits.length; i++) {
        const startDate = new Date(commits[i].authorDate);
        const endDate = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);
        
        const countInWindow = commits.filter(c => {
          const d = new Date(c.authorDate);
          return d >= startDate && d <= endDate;
        }).length;

        if (countInWindow > maxCommitsInWindow) {
          maxCommitsInWindow = countInWindow;
        }
      }

      const burstRatio = maxCommitsInWindow / totalCommits;
      if (burstRatio >= 0.75) {
        burstReposCount++;
        burstRepoNames.add(repo.name);
      }
    }
  });

  const burstRate = activeReposCount > 0 ? (burstReposCount / activeReposCount) : 0;
  const score = Math.max(0, Math.min(100, Math.round((1 - burstRate) * 100)));

  let label = 'Steady Pace';
  let verdict = 'Sustained activity. Commits are distributed across repo lifetimes, indicating consistent incremental work.';

  if (score < 40) {
    label = 'Deadline Rush';
    verdict = `Highly compressed commit history. Most commits occurred within a 3-day window — looks like a pre-deadline rush, not sustained work.`;
  } else if (score < 75) {
    label = 'Occasional Sprints';
    verdict = 'Moderately balanced commit timeline. Showing a mix of gradual progress and occasional high-density coding bursts.';
  }

  return {
    score,
    label,
    verdict,
    details: {
      activeReposCount,
      burstReposCount,
      burstRate: Math.round(burstRate * 100) / 100,
      burstRepoNames: [...burstRepoNames]
    }
  };
};
