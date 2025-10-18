// GitHub Issues API 集成服务

class GitHubAPI {
    constructor(owner, repo, token = null) {
        this.owner = owner;
        this.repo = repo;
        this.token = token;
        this.baseURL = 'https://api.github.com';
    }

    // 获取所有带quote标签的issues
    async getQuotes() {
        try {
            const url = `${this.baseURL}/repos/${this.owner}/${this.repo}/issues?labels=quote&state=open`;
            const response = await fetch(url, {
                headers: this.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const issues = await response.json();
            return issues.map(issue => this.parseQuoteFromIssue(issue));
        } catch (error) {
            console.error('获取内容时出错:', error);
            return [];
        }
    }

    // 解析issue为quote对象
    parseQuoteFromIssue(issue) {
        // 从issue body中解析出处和门派信息
        let source = '';
        let school = '';
        
        if (issue.body) {
            // 假设body格式为: "出处: xxx\n门派: yyy\n\n内容详情..."
            const lines = issue.body.split('\n');
            for (const line of lines) {
                if (line.startsWith('出处:')) {
                    source = line.substring(3).trim();
                } else if (line.startsWith('门派:')) {
                    school = line.substring(3).trim();
                }
            }
        }
        
        return {
            id: issue.id,
            number: issue.number,
            text: issue.title,
            author: issue.user.login,
            source: source || issue.body || '',
            school: school || '未知',
            votes: {
                upvotes: issue.reactions && issue.reactions['+1'] ? issue.reactions['+1'] : 0,
                downvotes: issue.reactions && issue.reactions['-1'] ? issue.reactions['-1'] : 0
            },
            comments_count: issue.comments,
            created_at: issue.created_at
        };
    }

    // 获取特定issue的评论
    async getComments(issueNumber) {
        try {
            const url = `${this.baseURL}/repos/${this.owner}/${this.repo}/issues/${issueNumber}/comments`;
            const response = await fetch(url, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const comments = await response.json();
            return comments.map(comment => ({
                id: comment.id,
                author: comment.user.login,
                body: comment.body,
                created_at: comment.created_at
            }));
        } catch (error) {
            console.error('获取评论时出错:', error);
            return [];
        }
    }

    // 添加评论到issue
    async addComment(issueNumber, body) {
        try {
            const url = `${this.baseURL}/repos/${this.owner}/${this.repo}/issues/${issueNumber}/comments`;
            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ body })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const comment = await response.json();
            return {
                id: comment.id,
                author: comment.user.login,
                body: comment.body,
                created_at: comment.created_at
            };
        } catch (error) {
            console.error('添加评论时出错:', error);
            return null;
        }
    }

    // 为issue添加reaction（投票）
    async addReaction(issueNumber, content) {
        try {
            const url = `${this.baseURL}/repos/${this.owner}/${this.repo}/issues/${issueNumber}/reactions`;
            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ content })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reaction = await response.json();
            return reaction;
        } catch (error) {
            console.error('添加反应时出错:', error);
            return null;
        }
    }

    // 创建新的issue（用于个人修道记录）
    async createIssue(title, body) {
        try {
            const url = `${this.baseURL}/repos/${this.owner}/${this.repo}/issues`;
            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ 
                    title, 
                    body,
                    labels: ['record'] // 标记为个人记录
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const issue = await response.json();
            return issue;
        } catch (error) {
            console.error('创建issue时出错:', error);
            return null;
        }
    }

    // 更新issue（用于编辑个人修道记录）
    async updateIssue(issueNumber, title, body) {
        try {
            const url = `${this.baseURL}/repos/${this.owner}/${this.repo}/issues/${issueNumber}`;
            const response = await fetch(url, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify({ title, body })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const issue = await response.json();
            return issue;
        } catch (error) {
            console.error('更新issue时出错:', error);
            return null;
        }
    }

    // 删除issue（通过关闭issue实现）
    async deleteIssue(issueNumber) {
        try {
            const url = `${this.baseURL}/repos/${this.owner}/${this.repo}/issues/${issueNumber}`;
            const response = await fetch(url, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify({ state: 'closed' })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const issue = await response.json();
            return issue;
        } catch (error) {
            console.error('关闭issue时出错:', error);
            return null;
        }
    }

    // 获取请求头
    getHeaders() {
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `token ${this.token}`;
        }

        return headers;
    }
}

// 导出类供其他组件使用
export default GitHubAPI;