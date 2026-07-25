const githubClient = require('../config/github');

/**
 * Aggregates all public information necessary for GitVerdict analysis
 * @param {string} username - GitHub username to scan
 */
exports.fetchUserData = async (username) => {
  // 1. Fetch main user profile data
  const { data: profile } = await githubClient.get(`/users/${username}`);

  // 2. Fetch public repos sorted by most recently updated
  // Fetch up to 100 repos for more accurate fork ratio & pattern analysis
  const { data: repos } = await githubClient.get(`/users/${username}/repos`, {
    params: {
      sort: 'updated',
      per_page: 100
    }
  });

  // 3. Iterate over repos and gather granular data: commits, readme files, languages
  // Limit deep analysis to top 30 non-fork repos to avoid rate limits while keeping accuracy
  const reposToAnalyze = repos.slice(0, 30);

  const reposDetailedPromises = reposToAnalyze.map(async (repo) => {
    let commits = [];
    let readmeText = '';
    let languages = {};

    // For forks or tiny repos, we can bypass deep lookups to save rate limit usage
    if (!repo.fork) {
      // Get commits — fetch up to 50 for more accurate burst/pattern detection
      try {
        const { data: commitsRes } = await githubClient.get(`/repos/${username}/${repo.name}/commits`, {
          params: { per_page: 50 }
        });
        commits = commitsRes.map(c => ({
          sha: c.sha,
          message: c.commit.message,
          authorDate: c.commit.author.date,
          stats: c.stats || null
        }));
      } catch (err) {
        // Silently skip - no commits or repo is empty
      }

      // Get languages
      try {
        const { data: langRes } = await githubClient.get(`/repos/${username}/${repo.name}/languages`);
        languages = langRes;
      } catch (err) {
        // Silently skip
      }

      // Get README file
      try {
        const { data: readmeRes } = await githubClient.get(`/repos/${username}/${repo.name}/contents/README.md`);
        if (readmeRes && readmeRes.content) {
          readmeText = Buffer.from(readmeRes.content, 'base64').toString('utf8');
        }
      } catch (err) {
        // Silently skip - no README
      }
    }

    return {
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      isFork: repo.fork,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
      size: repo.size,
      stargazersCount: repo.stargazers_count,
      watchersCount: repo.watchers_count,
      forksCount: repo.forks_count,
      openIssuesCount: repo.open_issues_count,
      language: repo.language,
      commits,
      readmeText,
      languages
    };
  });

  const reposDetailed = await Promise.all(reposDetailedPromises);

  // 4. Fetch recent public events to spot PRs / issue comments / contributions
  let events = [];
  try {
    const { data: eventsRes } = await githubClient.get(`/users/${username}/events/public`, {
      params: { per_page: 50 }
    });
    events = eventsRes.map(e => ({
      id: e.id,
      type: e.type,
      repo: e.repo ? e.repo.name : '',
      createdAt: e.created_at,
      payload: e.payload || {}
    }));
  } catch (err) {
    // Silently skip - events list lookup failed
  }

  // Build a lightweight summary of ALL fetched repos for originality fork-ratio estimation
  // (reposDetailed only covers top 30; full repos list gives us the full fork picture)
  const allReposSummary = repos.map(r => ({
    id: r.id,
    name: r.name,
    isFork: r.fork,
    size: r.size,
    stargazersCount: r.stargazers_count,
    language: r.language,
    commits: [], readmeText: '', languages: {}
  }));

  return {
    profile,
    // reposDetailed has commits/readme/languages for top 30 repos
    repos: reposDetailed,
    // allRepos is used for originality ratio (all 100 fetched)
    allRepos: allReposSummary,
    events
  };
};
