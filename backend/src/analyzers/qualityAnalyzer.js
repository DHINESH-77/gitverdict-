/**
 * Audits commit message history for descriptive vs. generic, low-effort messages.
 *
 * Classification rules (applied in priority order):
 * 1. Repos with fewer than 3 commits are excluded — too small to judge message quality.
 * 2. First commit of each repo is excluded — "initial commit" / "first commit" are standard.
 * 3. Messages ≤ 5 characters are flagged as generic (e.g., "fix", "wip").
 * 4. 1-2 word messages are flagged only if they match an exact generic keyword.
 * 5. Messages 3+ words are treated as descriptive (never flagged) — intent is clear.
 *
 * Score range: 0 (all generic) to 100 (fully descriptive).
 */
module.exports = function analyzeCommitQuality(rawData) {
  const { repos } = rawData;
  const originalRepos = repos.filter(r => !r.isFork);

  // Generic single-word or short-phrase commit templates to flag.
  // Deliberately narrow list — only flag messages that add zero information.
  // 'commit', 'test', 'fix' alone (as full message) are meaningless; but
  // "fix login redirect bug" or "test user registration flow" are descriptive.
  const GENERIC_EXACT = new Set([
    'update', 'updates', 'updated',
    'fix', 'fixes', 'fixed',
    'bugfix', 'hotfix',
    'final', 'final version', 'final commit',
    'changes', 'change',
    'wip',
    'debug',
    'stuff', 'things',
    'done', 'finished',
    'save', 'saved',
    'checkpoint',
    'asdf', 'asd',
    'temp', 'tmp',
    'no message',
    'minor', 'minor fix', 'minor update', 'minor changes',
    'refactor',
    'cleanup', 'clean up',
    'misc',
    'test',
    'push',
  ]);

  // Patterns that, even in longer messages, indicate zero information
  const GENERIC_PATTERNS = [
    /^(update|fix|change|save|done|wip)\s*\d*$/i,     // "update 2", "fix3"
    /^\.+$/,                                             // "...", "."
    /^-+$/,                                              // "---"
    /^[a-z]{1,2}$/,                                     // single/double char
  ];

  const qualifiedMessages = [];

  originalRepos.forEach(repo => {
    if (repo.commits.length < 3) return; // Skip repos too small to judge

    // Sort commits chronologically so we can identify the very first commit
    const sorted = [...repo.commits].sort(
      (a, b) => new Date(a.authorDate) - new Date(b.authorDate)
    );
    const firstSha = sorted[0]?.sha;

    sorted.forEach(c => {
      if (!c.message) return;
      // Skip the repo's very first commit — "initial commit" is standard convention
      if (c.sha === firstSha) return;

      const raw = c.message.trim();
      // Take only the subject line (first line before any blank line)
      const subject = raw.split(/\n/)[0].trim().toLowerCase();
      qualifiedMessages.push(subject);
    });
  });

  const totalCommits = qualifiedMessages.length;

  if (totalCommits === 0) {
    return {
      score: 100,
      label: 'Not Enough Data',
      verdict: 'Insufficient commit history to evaluate message quality (repos with fewer than 3 commits are excluded).',
      details: { totalCommits: 0, genericCount: 0, genericRatio: 0 }
    };
  }

  let genericCount = 0;
  const genericExamples = [];

  qualifiedMessages.forEach(msg => {
    let isGeneric = false;

    // Rule: very short message (≤5 chars)
    if (msg.length <= 5) {
      isGeneric = true;
    }

    // Rule: matches a known zero-information pattern
    if (!isGeneric) {
      for (const pattern of GENERIC_PATTERNS) {
        if (pattern.test(msg)) { isGeneric = true; break; }
      }
    }

    // Rule: 1-2 word message where the entire message (stripped of punctuation/numbers)
    // is an exact generic keyword
    if (!isGeneric) {
      const words = msg.split(/\s+/).filter(Boolean);
      if (words.length <= 2) {
        const cleanedFull = msg.replace(/[^a-z\s]/g, '').trim();
        if (GENERIC_EXACT.has(cleanedFull)) {
          isGeneric = true;
        } else {
          // Also check each individual word when there's only 1 word
          if (words.length === 1) {
            const w = words[0].replace(/[^a-z]/g, '');
            if (GENERIC_EXACT.has(w)) isGeneric = true;
          }
        }
      }
      // 3+ word messages are ALWAYS treated as descriptive — they demonstrate intent
    }

    if (isGeneric) {
      genericCount++;
      if (genericExamples.length < 4) genericExamples.push(`'${msg}'`);
    }
  });

  const genericRatio = genericCount / totalCommits;
  const score = Math.max(0, Math.min(100, Math.round((1 - genericRatio) * 100)));

  let label = 'Descriptive Commits';
  let verdict = `Strong commit discipline. ${totalCommits} commit messages analyzed — clear intent descriptions make history easy to trace.`;

  if (score < 50) {
    label = 'Low Documentation';
    verdict = `${Math.round(genericRatio * 100)}% of commit messages are single-word or zero-information (e.g., ${genericExamples.join(', ')}). Describe the "what" and "why" in each message.`;
  } else if (score < 80) {
    label = 'Basic Summaries';
    verdict = `Mostly clear messages, but ${genericCount} of ${totalCommits} commits use generic one-word labels (${genericExamples.slice(0, 2).join(', ')}). Small improvement would significantly boost this signal.`;
  }

  return {
    score,
    label,
    verdict,
    details: {
      totalCommits,
      genericCount,
      genericRatio: Math.round(genericRatio * 100) / 100,
      genericExamples
    }
  };
};
