# GitHub Token Setup Guide

## 🔐 Setting up GitHub Authentication

The NEXUS application requires a GitHub Personal Access Token to fetch repository data and issues. Follow these steps to set it up:

### Step 1: Create a GitHub Personal Access Token

1. Go to [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token" → "Generate new token (classic)"
3. Give your token a descriptive name (e.g., "NEXUS App Token")
4. Set expiration (recommended: 90 days or custom)
5. Select the following scopes:
   - ✅ **public_repo** (Access public repositories)
   - ✅ **read:user** (Read user profile data)
   - ✅ **user:email** (Access user email addresses)

### Step 2: Add Token to Environment

1. Copy the generated token (you won't see it again!)
2. Open the `.env.local` file in your project root
3. Replace `your_github_token_here` with your actual token:

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Restart Development Server

```bash
npm run dev
```

## 🚨 Security Notes

- ⚠️ Never commit your `.env.local` file to git
- 🔒 Keep your token secure and don't share it
- 🔄 Rotate tokens regularly for security
- 📝 Use minimal required permissions

## 📊 Rate Limits

- **Without token**: 60 requests/hour
- **With token**: 5,000 requests/hour

## 🛠️ Troubleshooting

### 401 Unauthorized Error
- Check if token is correctly set in `.env.local`
- Verify token has required scopes
- Ensure token hasn't expired

### Rate Limit Exceeded
- Wait for rate limit reset
- Use authenticated requests (with token)
- Implement request caching if needed

### Token Not Working
- Regenerate token with correct scopes
- Check for typos in `.env.local`
- Restart development server after changes