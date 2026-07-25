const githubService = require('../services/githubService');
const runAnalyzers = require('../analyzers');

/**
 * GET /api/verdict/:username
 * Fetches user statistics and executes rule-based analysis.
 */
exports.getVerdict = async (req, res, next) => {
  try {
    const { username } = req.params;
    if (!username || username.trim() === '') {
      return res.status(400).json({ error: 'GitHub username is required.' });
    }

    const cleanUsername = username.trim();

    // 1. Fetch raw profile, repository, commit history, and activity data
    const rawData = await githubService.fetchUserData(cleanUsername);

    // 2. Perform score audits and compile textual verdicts
    const verdictReport = runAnalyzers(rawData);

    // 3. Build sorted repository list (by commit count descending — most active first)
    const dumpedNames = new Set(
      (verdictReport.breakdown?.codeDumps?.details?.dumpedRepos || []).map(r => r.name)
    );
    const burstNames = new Set(
      verdictReport.breakdown?.commitPattern?.details?.burstRepoNames || []
    );

    const repositories = rawData.repos
      .filter(r => !r.isFork) // Only show original repos
      .map(repo => {
        // Compute top language from language byte counts
        const langEntries = Object.entries(repo.languages || {});
        const totalBytes = langEntries.reduce((sum, [, b]) => sum + b, 0);
        const languageBreakdown = langEntries
          .sort(([, a], [, b]) => b - a) // Sort by bytes descending
          .map(([lang, bytes]) => ({
            name: lang,
            bytes,
            percentage: totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0
          }));

        const topLanguage = languageBreakdown[0]?.name || repo.language || 'Unknown';

        // Get last commit date from commits list
        const sortedCommits = [...(repo.commits || [])].sort(
          (a, b) => new Date(b.authorDate) - new Date(a.authorDate)
        );
        const lastCommitDate = sortedCommits[0]?.authorDate || repo.pushedAt;
        const firstCommitDate = sortedCommits[sortedCommits.length - 1]?.authorDate || repo.createdAt;

        return {
          name: repo.name,
          description: repo.description || '',
          url: `https://github.com/${cleanUsername}/${repo.name}`,
          commitCount: repo.commits.length,
          stars: repo.stargazersCount || 0,
          sizeKB: repo.size || 0,
          topLanguage,
          languageBreakdown,
          createdAt: repo.createdAt,
          lastCommitDate,
          firstCommitDate,
          isDump: dumpedNames.has(repo.name),
          isBurst: burstNames.has(repo.name),
          openIssues: repo.openIssuesCount || 0
        };
      })
      // Sort by commit count descending — most committed repo first
      .sort((a, b) => b.commitCount - a.commitCount);

    // 4. Return payload including profile details, metrics, and repo list
    return res.status(200).json({
      username: rawData.profile.login,
      avatarUrl: rawData.profile.avatar_url,
      htmlUrl: rawData.profile.html_url,
      bio: rawData.profile.bio,
      publicReposCount: rawData.profile.public_repos,
      followers: rawData.profile.followers,
      repositories,
      ...verdictReport
    });
  } catch (error) {
    next(error);
  }
};
