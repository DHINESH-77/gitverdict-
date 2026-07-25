const analyzeOriginality = require('./originalityAnalyzer');
const analyzeCommitPattern = require('./patternAnalyzer');
const analyzeCommitQuality = require('./qualityAnalyzer');
const analyzeReadmeAuthenticity = require('./readmeAnalyzer');
const analyzeLanguages = require('./languageAnalyzer');
const analyzeCodeDumps = require('./dumpAnalyzer');
const analyzeCollaboration = require('./collaborationAnalyzer');
const analyzeAccountAge = require('./accountAgeAnalyzer');

// In-memory score history for percentile ranking (resets on server restart)
// Pre-seeded with a realistic bell-curve distribution so the first user gets
// a meaningful percentile rather than always seeing null.
const scoreHistory = [
  28, 31, 33, 35, 37, 38, 40, 40, 42, 43, 44, 45, 45, 46, 47, 48, 49, 50,
  50, 51, 52, 52, 53, 54, 54, 55, 55, 56, 57, 57, 58, 59, 60, 60, 61, 61,
  62, 62, 63, 63, 64, 64, 65, 65, 65, 66, 66, 67, 67, 68, 68, 69, 70, 70,
  71, 71, 72, 72, 73, 74, 74, 75, 75, 76, 77, 78, 79, 80, 81, 82, 83, 85, 88
];
const MAX_HISTORY = 500;

/**
 * Scoring weights — not all signals are equal.
 * Originality and code dumps are the strongest fraud indicators.
 * Weighted average: each score × its weight / sum of weights.
 */
const WEIGHTS = {
  originality: 2.0,     // strongest signal of genuine work
  commitPattern: 1.5,   // burst detection is important
  commitQuality: 1.0,   // good but softer signal
  readmeAuthenticity: 1.0,
  codeDumps: 2.0,       // strongest fraud indicator
  collaboration: 1.5,   // green flags matter
  accountAge: 1.5       // maturity signal
};

const TOTAL_WEIGHT = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);

/**
 * Computes percentile rank of a score within session history.
 */
function getPercentile(score) {
  if (scoreHistory.length < 5) return null;
  const below = scoreHistory.filter(s => s < score).length;
  return Math.round((below / scoreHistory.length) * 100);
}

/** Human-readable names for each metric key */
const METRIC_NAMES = {
  originality: 'originality',
  commitPattern: 'commit consistency',
  commitQuality: 'commit message quality',
  readmeAuthenticity: 'README authenticity',
  codeDumps: 'incremental building',
  collaboration: 'collaboration',
  accountAge: 'account maturity'
};

/**
 * Generates a dynamic one-sentence summary that references the actual
 * highest and lowest scoring signals for this specific profile.
 * No more generic hardcoded text.
 */
function buildDynamicSummary(grade, allSignals) {
  const entries = Object.entries(allSignals).map(([k, v]) => ({ key: k, score: v.score }));
  const sorted = entries.sort((a, b) => a.score - b.score);

  const weakest = sorted.slice(0, 2).filter(e => e.score < 70);
  const strongest = sorted.slice(-2).filter(e => e.score >= 75);

  const weakParts = weakest.map(e => METRIC_NAMES[e.key]).filter(Boolean);
  const strongParts = strongest.map(e => METRIC_NAMES[e.key]).filter(Boolean);

  // Grade-tier opener
  const openers = {
    'A+': 'Exceptional developer profile.',
    'A':  'Outstanding GitHub profile.',
    'B':  'Solid developer profile.',
    'C':  'Developing profile with clear improvement areas.',
    'D':  'Profile needs significant work in core areas.',
    'F':  'Significant red flags detected across multiple signals.',
  };

  let summary = openers[grade] || 'Profile analyzed.';

  if (strongParts.length > 0) {
    summary += ` Strong signal in ${strongParts.join(' and ')}.`;
  }

  if (weakParts.length > 0) {
    summary += ` Main weakness: ${weakParts.join(' and ')}.`;
  }

  return summary;
}

/**
 * Runs all analyzers and returns a consolidated, weighted grading report.
 * @param {object} rawData - Consolidated GitHub data from services
 */
module.exports = function runAnalyzers(rawData) {
  const originality      = analyzeOriginality(rawData);
  const commitPattern    = analyzeCommitPattern(rawData);
  const commitQuality    = analyzeCommitQuality(rawData);
  const readmeAuthenticity = analyzeReadmeAuthenticity(rawData);
  const languages        = analyzeLanguages(rawData);
  const codeDumps        = analyzeCodeDumps(rawData);
  const collaboration    = analyzeCollaboration(rawData);
  const accountAge       = analyzeAccountAge(rawData);

  // Weighted composite score
  const weightedSum =
    originality.score        * WEIGHTS.originality +
    commitPattern.score      * WEIGHTS.commitPattern +
    commitQuality.score      * WEIGHTS.commitQuality +
    readmeAuthenticity.score * WEIGHTS.readmeAuthenticity +
    codeDumps.score          * WEIGHTS.codeDumps +
    collaboration.score      * WEIGHTS.collaboration +
    accountAge.score         * WEIGHTS.accountAge;

  const overallScore = Math.round(weightedSum / TOTAL_WEIGHT);

  // Track for percentile ranking
  scoreHistory.push(overallScore);
  if (scoreHistory.length > MAX_HISTORY) scoreHistory.shift();
  const percentile = getPercentile(overallScore);

  // Grade assignment
  let grade = 'F';
  if (overallScore >= 90) grade = 'A+';
  else if (overallScore >= 80) grade = 'A';
  else if (overallScore >= 70) grade = 'B';
  else if (overallScore >= 60) grade = 'C';
  else if (overallScore >= 50) grade = 'D';

  // Dynamic summary referencing actual signal strengths/weaknesses
  const allSignals = { originality, commitPattern, commitQuality, readmeAuthenticity, codeDumps, collaboration, accountAge };
  const summary = buildDynamicSummary(grade, allSignals);

  // Identify top red flags and green flags for the summary panel
  const redFlags = Object.entries(allSignals)
    .filter(([, v]) => v.score < 50)
    .map(([k, v]) => ({ key: k, label: v.label, score: v.score }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const greenFlags = Object.entries(allSignals)
    .filter(([, v]) => v.score >= 80)
    .map(([k, v]) => ({ key: k, label: v.label, score: v.score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    overallScore,
    grade,
    summary,
    percentile,
    redFlags,
    greenFlags,
    scoringWeights: WEIGHTS,
    breakdown: {
      originality,
      commitPattern,
      commitQuality,
      readmeAuthenticity,
      languages,
      codeDumps,
      collaboration,
      accountAge
    }
  };
};

