interface GithubResourceData {
  token: string;
  apiUrl: string;
  repoOwner: string;
  author: string;
}

class Github {
  private githubData: GithubResourceData;

  constructor(ghData: GithubResourceData) {
    this.githubData = ghData;
  }

  private async getRepos() {}
}
