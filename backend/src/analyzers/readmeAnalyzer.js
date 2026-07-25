/**
 * Analyzes README content uniqueness across repositories to identify copy-pasted boilerplate.
 * 
 * Rules:
 * - README duplication = simple text similarity check across the user's original repositories.
 * - Score range: 0 (all identical) to 100 (entirely unique readmes)
 */
module.exports = function analyzeReadmeAuthenticity(rawData) {
  const { repos } = rawData;
  const originalRepos = repos.filter(r => !r.isFork);

  // Extract readmes that actually contain content
  const reposWithReadme = originalRepos
    .filter(r => r.readmeText && r.readmeText.trim().length > 50)
    .map(r => ({
      name: r.name,
      readme: r.readmeText,
      wordSet: getWordSet(r.readmeText)
    }));

  const totalReadmesCount = reposWithReadme.length;

  if (totalReadmesCount <= 1) {
    return {
      score: 100,
      label: 'Unique Documentation',
      verdict: totalReadmesCount === 1 
        ? 'Only one repository has a README, no cross-duplication possible.' 
        : 'No repository READMEs found to analyze.',
      details: { totalReadmesCount, duplicateRepoNames: [] }
    };
  }

  // Find duplicates
  const duplicateRepos = new Set();
  const duplicatePairs = [];

  for (let i = 0; i < reposWithReadme.length; i++) {
    for (let j = i + 1; j < reposWithReadme.length; j++) {
      const sim = calculateJaccardSimilarity(reposWithReadme[i].wordSet, reposWithReadme[j].wordSet);
      
      // If similarity exceeds 75%, flag as copy-pasted / duplicate boilerplate
      if (sim > 0.75) {
        duplicateRepos.add(reposWithReadme[i].name);
        duplicateRepos.add(reposWithReadme[j].name);
        duplicatePairs.push({
          repoA: reposWithReadme[i].name,
          repoB: reposWithReadme[j].name,
          similarity: Math.round(sim * 100) / 100
        });
      }
    }
  }

  const duplicateCount = duplicateRepos.size;
  const score = Math.round(((totalReadmesCount - duplicateCount) / totalReadmesCount) * 100);

  let label = 'Authentic Writeups';
  let verdict = 'Project documentation is tailored and unique, describing the scope of each repository individually.';

  if (score < 50) {
    label = 'Boilerplate Duplication';
    verdict = `${duplicateCount} repositories share near-identical README text (${[...duplicateRepos].slice(0, 3).join(', ')}). Likely template copies rather than project-specific notes.`;
  } else if (score < 90) {
    label = 'Minor Boilerplate';
    verdict = `Generally custom READMEs, with minor overlapping template layouts or boilerplate text across a couple of repositories.`;
  }

  return {
    score,
    label,
    verdict,
    details: {
      totalReadmesCount,
      duplicateCount,
      duplicateRepoNames: [...duplicateRepos],
      duplicatePairs
    }
  };
};

/**
 * Parses and tokenizes a body of text into a unique Set of descriptive words.
 */
function getWordSet(text) {
  // Strip code blocks and markdown formatting to compare raw descriptions
  const cleanText = text
    .replace(/```[\s\S]*?```/g, '') // remove code fences
    .replace(/`.*?`/g, '')          // remove inline code
    .toLowerCase();

  const words = cleanText.split(/[^a-zA-Z]+/);
  // Keep descriptive words of length > 3
  return new Set(words.filter(w => w.length > 3));
}

/**
 * Computes Jaccard Similarity Coefficient between two sets.
 */
function calculateJaccardSimilarity(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  
  let intersectionCount = 0;
  for (const element of setA) {
    if (setB.has(element)) {
      intersectionCount++;
    }
  }

  const unionSize = setA.size + setB.size - intersectionCount;
  return intersectionCount / unionSize;
}
