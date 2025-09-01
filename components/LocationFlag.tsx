/* eslint-disable @typescript-eslint/no-unused-vars */
// Minimal city-to-country fallback for Indian cities
const indianCities = [
  'kolkata', 'mumbai', 'delhi', 'bengaluru', 'bangalore', 'hyderabad', 'chennai', 'pune'
];
import React from 'react';
import Image from 'next/image';

interface LocationFlagProps {
  location?: string;
}

// Function to convert country code (e.g. 'IN') to flag emoji
function countryCodeToFlagEmoji(code: string) {
  if (!code || code.length !== 2) return '';
  // Convert to uppercase and map to regional indicator symbols
  return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)));
}

function getFlag(location?: string): string | null {
  if (!location) return null;
  const locLower = location.toLowerCase();
  // Fallback for Indian cities
  if (indianCities.some(city => locLower.includes(city))) {
    return countryCodeToFlagEmoji('IN');
  }
  // Try to extract country code at the start of the string (e.g. 'IN kolkata', 'OR Portland, OR')
  const startCodeMatch = location.trim().match(/^([A-Z]{2,3})\b/);
  if (startCodeMatch && startCodeMatch[1].length === 2) {
    return countryCodeToFlagEmoji(startCodeMatch[1]);
  }
  // Try to extract country code elsewhere in the string
  const codeMatch = location.match(/\b([A-Z]{2,3})\b/g);
  if (codeMatch) {
    for (const code of codeMatch) {
      // Only use 2-letter codes for emoji
      if (code.length === 2) {
        return countryCodeToFlagEmoji(code);
      }
      // Special cases
      if (code === 'USA') return countryCodeToFlagEmoji('US');
      if (code === 'UK') return countryCodeToFlagEmoji('GB');
    }
  }
  // Try to match country name
  const countryNames: Record<string, string> = {
    india: 'IN', "united states": 'US', usa: 'US', uk: 'GB', canada: 'CA', germany: 'DE', france: 'FR', japan: 'JP', china: 'CN', australia: 'AU', russia: 'RU', brazil: 'BR', spain: 'ES', italy: 'IT', netherlands: 'NL', singapore: 'SG', "south korea": 'KR', mexico: 'MX', sweden: 'SE', switzerland: 'CH', turkey: 'TR', egypt: 'EG', nigeria: 'NG', pakistan: 'PK', bangladesh: 'BD', poland: 'PL', ukraine: 'UA', argentina: 'AR', "south africa": 'ZA'
  };
  for (const name in countryNames) {
    if (locLower.includes(name)) {
      return countryCodeToFlagEmoji(countryNames[name]);
    }
  }
  return null;
}


const LocationFlag: React.FC<LocationFlagProps> = ({ location }) => {
  if (!location) return null;
  // Remove country code from location string if present at the start
  let displayLocation = location.trim();
  const startCodeMatch = displayLocation.match(/^([A-Z]{2,3})\b[ ,]*/);
  if (startCodeMatch) {
    displayLocation = displayLocation.replace(/^([A-Z]{2,3})\b[ ,]*/, '').trim();
  }
  const flag = getFlag(location);
  return (
    <div className="flex items-center gap-1 text-white/80 text-xs mt-1">
      {flag && <span className="text-lg align-middle">{flag}</span>}
      <span className="truncate max-w-[120px]">{displayLocation}</span>
    </div>
  );
};

export default LocationFlag;
