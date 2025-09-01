# Customization Guide

This guide will help you personalize this website to make it your own.

## 🎯 Quick Start

1. **Replace all placeholder values** with your actual information
2. **Update your domain and social links**
3. **Customize the branding and colors**
4. **Deploy to your preferred hosting platform**

## 📝 Required Changes

### 1. Personal Information
Replace all instances of the following placeholders:

- `your-username` → Your GitHub username
- `your-repo-name` → Your repository name
- `Your Name` → Your actual name
- `your-domain.com` → Your actual domain
- `your-website.com` → Your personal website
- `your-twitter` → Your Twitter/X handle
- `your-linkedin` → Your LinkedIn profile
- `your-user-id` → Your GitHub user ID

### 2. Files to Update

#### Core Configuration
- `package.json` - Project name
- `config/site.ts` - Site configuration
- `README.md` - Project documentation
- `LICENSE` - Copyright information

#### Components
- `components/Hero/Footer.tsx` - Footer with your social links
- `components/LiquidGlassHeader.tsx` - Header navigation
- `components/sections/hero/default.tsx` - Hero section
- `components/CompareCard.tsx` - Mock data for comparisons
- `components/Hero/ComapringThEDevCard.tsx` - Comparison card data

#### Pages
- `app/compare/page.tsx` - Social sharing links

#### GitHub Configuration
- `.github/FUNDING.yml` - Sponsorship links
- `Code_Of_Conduct.md` - Contact information

### 3. Social Media Links

Update these URLs in the footer component:
- GitHub: `https://github.com/your-username`
- Twitter/X: `https://x.com/your-twitter`
- Buy Me a Coffee: `https://buymeacoffee.com/your-username`

### 4. Profile Image

Replace the GitHub avatar URL:
```
https://github.com/your-username.png
```

### 5. Project Data

Update the mock project data in comparison components:
- Project names and descriptions
- Repository URLs
- Statistics and metrics

## 🎨 Branding Customization

### Colors
The website uses a dark theme with blue/cyan accents. You can customize colors in:
- `tailwind.config.js` - Tailwind configuration
- `app/globals.css` - Global styles

### Logo/Branding
- Update the site title in `config/site.ts`
- Modify the hero section text in `components/sections/hero/default.tsx`
- Update the footer branding

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set up environment variables:
   - `GITHUB_TOKEN` - Your GitHub personal access token
   - `GOOGLE_AI_API_KEY` - Your Google AI API key

### Other Platforms
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔧 Environment Variables

Create a `.env.local` file with:
```env
GITHUB_TOKEN=your_github_token_here
GOOGLE_AI_API_KEY=your_google_ai_key_here
```

## 📱 Features to Customize

### 1. Project Ideas
- Update the AI prompts in API routes
- Modify the project generation logic
- Customize the technology stack suggestions

### 2. Repository Analysis
- Adjust the analysis depth
- Customize the metrics displayed
- Modify the visualization styles

### 3. Developer Comparison
- Update the comparison metrics
- Customize the roast/commentary
- Modify the scoring algorithm

## 🎯 Advanced Customization

### 1. Add New Features
- Create new API routes in `app/api/`
- Add new pages in `app/`
- Create new components in `components/`

### 2. Modify Styling
- Update Tailwind classes
- Modify CSS in component files
- Add custom animations

### 3. Integrate External Services
- Add analytics (Google Analytics, Plausible)
- Integrate with other APIs
- Add authentication if needed

## 🔍 Testing

After making changes:
1. Run `npm run dev` to test locally
2. Check all pages and features
3. Test on different devices
4. Verify all links work correctly

## 📞 Support

If you need help with customization:
1. Check the original documentation
2. Review the code structure
3. Test changes incrementally
4. Use browser developer tools for debugging

## 🎉 You're Ready!

Once you've completed these customizations, your website will be uniquely yours while maintaining all the powerful features of the original project.

Remember to:
- Update your domain DNS settings
- Set up SSL certificates
- Configure your hosting environment
- Test thoroughly before going live

Happy coding! 🚀
