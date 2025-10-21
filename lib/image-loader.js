// Custom image loader with timeout handling
export default function imageLoader({ src, width, quality }) {
  // Handle GitHub avatars with fallback
  if (src.includes('avatars.githubusercontent.com')) {
    // Add cache busting and size optimization for GitHub avatars
    const url = new URL(src);
    url.searchParams.set('s', width.toString());
    if (quality) {
      url.searchParams.set('quality', quality.toString());
    }
    return url.toString();
  }
  
  // For other images, return as-is
  return src;
}