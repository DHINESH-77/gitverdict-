/**
 * Analyzes the user's repository list to determine original work vs forks.
 * 
 * Rules:
 * - Fork ratio = untouched forks / total repos
 * - Score range: 0 (all forks) to 100 (all original)
 */
module.exports = function analyzeOriginality(rawData) {
  const { repos, allRepos, profile } = rawData;

  // Use the real total from GitHub profile API (authoritative count of all public repos)
  const realTotal = profile.public_repos || repos.length;

  // Prefer the full allRepos list for fork ratio (up to 100 repos fetched)
  // Fall back to the detailed repos list if allRepos is unavailable
  const repoSample = allRepos && allRepos.length > 0 ? allRepos : repos;
  const sampleSize = repoSample.length;

  if (realTotal === 0) {
    return {
      score: 100,
      label: 'Neutral',
      verdict: 'No public repositories found to analyze.',
      details: { totalRepos: 0, originalCount: 0, forkCount: 0 }
    };
  }

  // Estimate fork ratio from our sample, apply to real total
  const sampleForks = repoSample.filter(r => r.isFork).length;
  const forkRatioEstimate = sampleSize > 0 ? sampleForks / sampleSize : 0;

  // Estimated counts (extrapolated from sample to real total)
  const forkCount = Math.round(forkRatioEstimate * realTotal);
  const originalCount = realTotal - forkCount;
  const score = Math.round((originalCount / realTotal) * 100);

  let label = 'High Originality';
  let verdict = `Great originality signal! ~${originalCount} of your ${realTotal} repositories appear to be original projects (estimated from top ${sampleSize} sampled repos).`;

  if (score < 40) {
    label = 'Low Originality';
    verdict = `Mostly forked work. Only ~${originalCount} of your ${realTotal} repositories are original; the remaining ~${forkCount} are forks.`;
  } else if (score < 80) {
    label = 'Mixed Originality';
    verdict = `Fair balance of work. ~${originalCount} of your ${realTotal} repositories are original creations, with ~${forkCount} projects forked.`;
  }

  return {
    score,
    label,
    verdict,
    details: {
      totalRepos: realTotal,
      sampledRepos: sampleSize,
      originalCount,
      forkCount,
      forkRatio: Math.round(forkRatioEstimate * 100) / 100
    }
  };
};
