/**
 * Analyzes account age relative to repository output.
 * 
 * Rules:
 * - Red flag: Account < 30 days old with > 10 repos (profile gaming)
 * - Yellow flag: High repos-per-week velocity (> 5/week)
 * - Green flag: Old account with steady repo creation over time
 */
module.exports = function analyzeAccountAge(rawData) {
  const { profile, repos } = rawData;

  const accountCreatedAt = new Date(profile.created_at);
  const now = new Date();
  const accountAgeDays = Math.max(1, (now - accountCreatedAt) / (1000 * 60 * 60 * 24));
  const accountAgeMonths = accountAgeDays / 30;
  const totalRepos = profile.public_repos || repos.length;

  const reposPerMonth = totalRepos / accountAgeMonths;
  const accountAgeYears = (accountAgeDays / 365).toFixed(1);

  let score = 80; // base
  let label = 'Established Account';
  let verdict = `Account is ${accountAgeYears} years old with a natural growth of ~${reposPerMonth.toFixed(1)} repos/month — consistent with genuine long-term activity.`;

  // New account with many repos = profile gaming signal
  if (accountAgeDays < 30 && totalRepos > 8) {
    score = 20;
    label = 'Suspicious Velocity';
    verdict = `Account is only ${Math.round(accountAgeDays)} days old but already has ${totalRepos} repositories. This velocity (${reposPerMonth.toFixed(0)} repos/month) is unusually high — possible profile padding before a submission deadline.`;
  } else if (accountAgeDays < 90 && totalRepos > 15) {
    score = 45;
    label = 'High Velocity';
    verdict = `Account is ${Math.round(accountAgeDays)} days old with ${totalRepos} repositories (${reposPerMonth.toFixed(1)}/month). Slightly elevated creation rate — could be genuine activity or bulk importing.`;
  } else if (accountAgeDays > 365 && reposPerMonth < 0.5) {
    score = 70;
    label = 'Infrequent Publisher';
    verdict = `${accountAgeYears}-year-old account with low repository output (~${reposPerMonth.toFixed(1)}/month). Likely prefers private work or uses other platforms.`;
  } else if (accountAgeDays > 730 && reposPerMonth >= 0.5) {
    score = 95;
    label = 'Veteran Developer';
    verdict = `${accountAgeYears} years on GitHub with a healthy, sustained publishing rhythm of ${reposPerMonth.toFixed(1)} repos/month — hallmark of a genuine, consistent developer.`;
  }

  return {
    score,
    label,
    verdict,
    details: {
      accountAgeDays: Math.round(accountAgeDays),
      accountAgeYears: parseFloat(accountAgeYears),
      totalRepos,
      reposPerMonth: Math.round(reposPerMonth * 10) / 10
    }
  };
};
