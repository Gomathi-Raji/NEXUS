'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// This function aggressively cleans and fixes common AI-generated Mermaid syntax errors.
const cleanMermaidSyntax = (diagram: string): string => {
  if (!diagram) return '';

  let cleaned = diagram;

  // 1. Remove any HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, '');

  // 2. Normalize quotes and dashes
  cleaned = cleaned.replace(/[\u201C\u201D]/g, '"');
  cleaned = cleaned.replace(/[\u2018\u2019]/g, "'");
  cleaned = cleaned.replace(/[\u2013\u2014]/g, '-');

  // 3. Fix unclosed brackets/parentheses in node labels - THIS IS THE KEY FIX
  // Example: `Ad Networks[AdMob MoPub` -> `Ad Networks[AdMob MoPub]`
  cleaned = cleaned.replace(/(\[[^\]]*?)(?=\s|--|-->|---|;|$)/g, (match, content) => {
    const openBrackets = (content.match(/\(/g) || []).length;
    const closeBrackets = (content.match(/\)/g) || []).length;
    if (openBrackets > closeBrackets) {
      return content + ')'.repeat(openBrackets - closeBrackets);
    }
    const openSquare = (content.match(/\[/g) || []).length;
    const closeSquare = (content.match(/\]/g) || []).length;
    if (openSquare > closeSquare) {
      return content + ']'.repeat(openSquare - closeSquare);
    }
    return content;
  });

  
  cleaned = cleaned.split('\n').filter(line => !/^[=-]{3,}$/.test(line.trim())).join('\n');

 
  cleaned = cleaned.split('\n').map(line => line.trim()).filter(Boolean).join('\n');

  return cleaned;
};

interface MermaidRendererProps {
  chart: string;
}

export function MermaidRenderer({ chart }: MermaidRendererProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const container = mermaidRef.current;

    if (!chart || !container) return;

    const render = async () => {
      try {
        const cleanedChart = cleanMermaidSyntax(chart);
        const uniqueId = `mermaid-graph-${Date.now()}`;
        
        
        const { svg } = await mermaid.render(uniqueId, cleanedChart);
        if (isMounted) {
          container.innerHTML = svg;
          setError(null);
        }
      } catch (e) {
        if (isMounted) {
          console.error('Failed to render Mermaid diagram:', e);
          setError(e instanceof Error ? e.message : 'Invalid diagram syntax.');
          container.innerHTML = ''; // Clear previous diagram on error
        }
      }
    };

    // Use a timeout to ensure the DOM is ready and to batch renders.
    const timer = setTimeout(render, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-700 rounded-md text-red-300">
        <p className="font-bold">Diagram Parsing Error</p>
        <pre className="mt-2 text-xs whitespace-pre-wrap font-mono">{error}</pre>
      </div>
    );
  }

  return <div ref={mermaidRef} className="mermaid-diagram-container w-full" />;
}
