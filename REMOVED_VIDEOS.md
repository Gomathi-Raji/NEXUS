# Removed video elements

## What changed

- Replaced `video` usage in `components/Hero/Features.tsx` with Next.js `Image` components so only images are loaded and displayed.
- This prevents 404 requests for `/videos/compare-devs.mp4` and `/videos/generate-readme.mp4` which were causing console errors.

## Why

- Videos were missing and resulted in 404 errors and slower page loads. Using images provides a consistent preview while improving performance and avoiding missing-file errors.

## How to revert

- If you want to restore video previews, update `premiumFeatures` to point to valid `.mp4` files under `/public/videos/` and revert the conditional render to use the video element. Ensure the video files exist in `public/videos/`.

## Verification

- Start dev server: `npm run dev` and navigate to the home page. You should no longer see XHR/GET 404 errors for `/videos/*.mp4`.
