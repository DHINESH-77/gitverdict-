/**
 * Evaluates the languages used, weighted by commit count and recency.
 * 
 * Rules:
 * - Weight of a repo's languages = (number of commits) * (recency factor)
 * - Recency factor decays from 1.0 (committed today) to 0.1 (committed over 1 year ago)
 * - Highlights difference between static repo counts and active code volume.
 */
module.exports = function analyzeLanguages(rawData) {
  const { repos } = rawData;
  const originalRepos = repos.filter(r => !r.isFork);

  if (originalRepos.length === 0) {
    return {
      score: 100,
      label: 'Specialized',
      verdict: 'No original repositories found to perform language weighting.',
      details: { languages: [], rawCount: {} }
    };
  }

  const weightedLanguages = {};
  const rawLangCounts = {};
  let totalWeight = 0;

  originalRepos.forEach(repo => {
    // Count raw primary languages for comparison
    if (repo.language) {
      rawLangCounts[repo.language] = (rawLangCounts[repo.language] || 0) + 1;
    }

    const commitsCount = repo.commits.length;
    if (commitsCount === 0 || !repo.languages) return;

    // Calculate recency factor (decay based on age of last commit, up to 1 year)
    let recencyFactor = 0.1;
    if (repo.pushedAt) {
      const daysSincePush = (new Date() - new Date(repo.pushedAt)) / (1000 * 60 * 60 * 24);
      recencyFactor = Math.max(0.1, Math.min(1.0, 1 - (daysSincePush / 365)));
    }

    const repoWeight = commitsCount * recencyFactor;
    totalWeight += repoWeight;

    // Distribute repo weight across its languages relative to their byte sizes
    const repoLanguages = repo.languages;
    const totalLangBytes = Object.values(repoLanguages).reduce((sum, bytes) => sum + bytes, 0);

    if (totalLangBytes > 0) {
      Object.entries(repoLanguages).forEach(([lang, bytes]) => {
        const share = bytes / totalLangBytes;
        const weightedShare = share * repoWeight;
        weightedLanguages[lang] = (weightedLanguages[lang] || 0) + weightedShare;
      });
    }
  });

  // Calculate percentages
  const languagesList = Object.entries(weightedLanguages)
    .map(([name, weight]) => {
      const percentage = totalWeight > 0 ? Math.round((weight / totalWeight) * 100) : 0;
      return { name, percentage };
    })
    .sort((a, b) => b.percentage - a.percentage)
    .filter(lang => lang.percentage > 0);

  const topLanguage = languagesList[0] ? languagesList[0].name : 'N/A';
  const topPercentage = languagesList[0] ? languagesList[0].percentage : 0;

  // Compute a profile focus consistency rating
  // specialized: 1 main language takes >60% focus.
  // full-stack/polyglot: balanced distribution.
  let label = 'Polyglot';
  let verdict = `Balanced skill profile. Active commits are distributed across multiple technologies.`;
  let score = 85;

  if (topPercentage > 75) {
    label = `${topLanguage} Specialist`;
    verdict = `Highly focused developer. Over ${topPercentage}% of active commit energy is dedicated to ${topLanguage} code.`;
    score = 95;
  } else if (languagesList.length === 0) {
    label = 'Undetermined';
    verdict = 'Unable to establish language focus. Ensure code commits contain recognized programming files.';
    score = 100;
  }

  // Check if primary languages count differs from active commit workload
  // e.g. lots of HTML repos but actual work is Python
  const primaryLangs = Object.entries(rawLangCounts).sort((a, b) => b[1] - a[1]);
  const primaryTop = primaryLangs[0] ? primaryLangs[0][0] : null;

  if (primaryTop && primaryTop !== topLanguage && topPercentage > 50) {
    verdict += ` Note: Although you have more repositories classified as ${primaryTop}, your commit volume shows you spend ${topPercentage}% of your time in ${topLanguage}.`;
  }

  return {
    score,
    label,
    verdict,
    details: {
      languages: languagesList,
      rawCount: rawLangCounts,
      topLanguage,
      topPercentage
    }
  };
};
