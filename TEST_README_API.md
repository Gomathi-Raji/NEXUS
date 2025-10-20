# Testing README Generator API

## Current Status
- Server running on port 3001
- Model: gemini-1.5-flash
- Enhanced logging added

## Test the API

### Using cURL:
```bash
curl -X POST http://localhost:3001/api/generate-readme \
  -H "Content-Type: application/json" \
  -d '{"repo": "facebook/react"}'
```

### Using Fetch (Browser Console):
```javascript
fetch('http://localhost:3001/api/generate-readme', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ repo: 'facebook/react' })
})
.then(r => r.json())
.then(data => console.log(data))
.catch(err => console.error('Error:', err));
```

## Check Server Logs

The server should now log:
1. ✅ "Generate README request: { repo, hasToken }"
2. ✅ "Parsed repo: { owner, repoName }"
3. ✅ "Calling Gemini API with X files, prompt length: Y"
4. ✅ "Gemini response received, candidates: Z"
5. ✅ "README generated successfully, length: ABC"

OR errors at any step.

## Common Issues

### 500 Error Causes:
1. **Invalid Model Name** - FIXED (now using gemini-1.5-flash)
2. **Missing API Key** - Check .env file
3. **Invalid API Key** - Verify Gemini key is valid
4. **Prompt Too Large** - We limit to 40 files, 600KB
5. **Gemini API Quota** - Check if you've exceeded limits

### Debug Steps:
1. Check browser Network tab for the actual error message
2. Check terminal/console for logged errors
3. Verify the request body contains valid repo name
4. Test with a simple repo first (e.g., "facebook/react")
