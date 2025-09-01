'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Eye, Copy, Check } from 'lucide-react';

interface MermaidDiagramProps {
  chart: string;
  title?: string;
  editable?: boolean;
  onUpdate?: (newChart: string) => void;
  prompt?: string | null;
}

export default function MermaidDiagram({ 
  chart, 
  title, 
  editable = false, 
  onUpdate,
  prompt
}: MermaidDiagramProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableChart, setEditableChart] = useState(chart);
  const [copied, setCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const cleanMermaidSyntax = (diagram: string): string => {
    console.log('Original diagram:', diagram);
    
    if (!diagram || typeof diagram !== 'string') {
      return '';
    }
    
    // Remove HTML tags like <br/>, <div>, etc.
    let cleaned = diagram.replace(/<[^>]*>/g, '');
    
    // Replace smart quotes and dashes with standard ones
    cleaned = cleaned.replace(/[\u2013\u2014\u2015]/g, '-');
    cleaned = cleaned.replace(/[\u201C\u201D]/g, '"');
    cleaned = cleaned.replace(/[\u2018\u2019]/g, "'");
    
    // Remove decorative separators
    cleaned = cleaned.replace(/^\s*-{3,}\s*$/gm, '');
    
    // Ensure proper line breaks first
    cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Split into lines for processing
    let lines = cleaned.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Process each line
    lines = lines.map((line, index) => {
      // Handle diagram type declarations - ensure they're on their own line
      if (line.match(/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|journey|gantt|pie|gitgraph)/i)) {
        // Check if there's content after the graph declaration on the same line
        const match = line.match(/^(graph\s+\w+|flowchart\s+\w+)\s+(.+)$/i);
        if (match) {
          // Split graph declaration from the rest
          const [, graphDecl, rest] = match;
          console.log('Splitting graph declaration:', line);
          // We'll handle this by returning the declaration and processing the rest separately
          lines.splice(index + 1, 0, rest); // Insert the rest as next line
          return graphDecl;
        }
        return line;
      }
      
      // Skip subgraph declarations
      if (line.match(/^\s*(subgraph|end)\s/i) || line.trim() === 'end') {
        return line;
      }
      
      // Skip style declarations
      if (line.match(/^\s*style\s+/i)) {
        return line;
      }
      
      // Fix nodes that don't have brackets
      // Handle patterns like: "User --> UserInterface" where both should have brackets
      line = line.replace(/^(\w+(?:\s+\w+)*)(?!\[)\s*(-->|---|--|==)\s*(\w+(?:\s+\w+)*)(?!\[)/g, (match, source, arrow, target) => {
        console.log('Adding missing brackets to both nodes:', match);
        return `${source}[${source}] ${arrow} ${target}[${target}]`;
      });
      
      // Fix incomplete target nodes: "Source[Source] --> Target" where "Target" should be "Target[Target]"
      line = line.replace(/(\w+(?:\s+\w+)*\[[^\]]+\])\s*(-->|---|--|==)\s*(\w+(?:\s+\w+)*)(?!\[)/g, (match, source, arrow, target) => {
        console.log('Adding missing brackets to target:', match);
        return `${source} ${arrow} ${target}[${target}]`;
      });
      
      // Fix incomplete source nodes: "Source --> Target[Target]" where "Source" should be "Source[Source]"
      line = line.replace(/^(\w+(?:\s+\w+)*)(?!\[)\s*(-->|---|--|==)\s*(\w+(?:\s+\w+)*\[[^\]]+\])/g, (match, source, arrow, target) => {
        console.log('Adding missing brackets to source:', match);
        return `${source}[${source}] ${arrow} ${target}`;
      });
      
      // Fix unclosed square brackets in existing labels
      line = line.replace(/(\w+(?:\s+\w+)*)\[([^\]]*?)(?=\s*(?:-->|---|--|==|;|$))/g, (match, nodeName, content) => {
        console.log('Fixing unclosed bracket:', match);
        return `${nodeName}[${content}]`;
      });
      
      // Fix nested parentheses in node labels
      line = line.replace(/\[([^\]]*?)\([^)]*\)([^\]]*)\]/g, (match, before, inner, after) => {
        console.log('Fixing nested parentheses:', match);
        return `[${before.trim()}${after.trim() ? ' ' + after.trim() : ''}]`;
      });
      
      // Remove any remaining parentheses from labels
      line = line.replace(/\[([^\]]*)\([^)]*\)([^\]]*)\]/g, '[$1$2]');
      
      return line;
    });
    
    // Join lines back together with proper newlines
    cleaned = lines.join('\n');
    
    // Clean up any multiple spaces within lines but preserve line structure
    cleaned = cleaned.replace(/[ \t]+/g, ' ');
    
    // Fix any remaining formatting issues
    cleaned = cleaned.replace(/\]\s*\[/g, '] ['); // Ensure space between node definitions
    
    // Ensure proper spacing around arrows
    cleaned = cleaned.replace(/\s*(-->|---|--|==)\s*/g, ' $1 ');
    
    console.log('Cleaned diagram:', cleaned);
    return cleaned.trim();
  };

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'monospace',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: false
      }
    });
  }, []);

  useEffect(() => {
    setEditableChart(chart);
  }, [chart]);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    
    const renderDiagram = async () => {
      if (!mermaidRef.current || isEditing || !editableChart.trim() || !isMounted) {
        return;
      }
      
      setIsRendering(true);
      
      try {
        // Clear previous content safely - avoid removeChild errors
        const container = mermaidRef.current;
        if (container) {
          // Use innerHTML instead of removeChild to avoid React conflicts
          container.innerHTML = '';
        }
        
        const cleanedChart = cleanMermaidSyntax(editableChart);
        console.log('Rendering cleaned chart:', cleanedChart);
        
        // Validate that we have actual content to render
        if (!cleanedChart.trim()) {
          throw new Error('No valid diagram content after cleaning');
        }
        
        // Generate a completely unique ID for this render
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        const uniqueId = `mermaid-${timestamp}-${random}`;
        
        // Render the diagram
        const renderResult = await mermaid.render(uniqueId, cleanedChart);
        
        // Check if component is still mounted and not aborted
        if (isMounted && container && !abortController.signal.aborted) {
          container.innerHTML = renderResult.svg;
        }
        
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        if (isMounted && mermaidRef.current && !abortController.signal.aborted) {
          mermaidRef.current.innerHTML = `
            <div class="text-red-400 p-4 bg-red-900/20 rounded-lg border border-red-800">
              <p class="font-semibold mb-2">⚠️ Diagram Rendering Error</p>
              <p class="text-sm text-red-300 mb-2">${error instanceof Error ? error.message : 'Invalid Mermaid syntax'}</p>
              <details class="text-xs text-red-400">
                <summary class="cursor-pointer mb-2">Show original diagram content</summary>
                <pre class="bg-red-950/50 p-2 rounded overflow-auto max-h-32">${editableChart}</pre>
              </details>
              <details class="text-xs text-red-400 mt-2">
                <summary class="cursor-pointer mb-2">Show cleaned diagram content</summary>
                <pre class="bg-red-950/50 p-2 rounded overflow-auto max-h-32">${cleanMermaidSyntax(editableChart)}</pre>
              </details>
              <p class="text-xs text-red-400 mt-2">Please check the diagram syntax or try editing it manually.</p>
            </div>
          `;
        }
      } finally {
        if (isMounted) {
          setIsRendering(false);
        }
      }
    };

    // Use longer delay to prevent rapid re-renders
    const timeoutId = setTimeout(renderDiagram, 200);
    
    return () => {
      isMounted = false;
      abortController.abort();
      clearTimeout(timeoutId);
    };
  }, [editableChart, isEditing]);

  const handleSave = () => {
    onUpdate?.(editableChart);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditableChart(chart);
    setIsEditing(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editableChart);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyPromptToClipboard = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  return (
    <Card className="w-full bg-gray-900/50 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold text-white">
          {title || 'Diagram'}
        </CardTitle>
        <div className="flex gap-2">
          {prompt && (
            <Button
              variant="outline"
              size="sm"
              onClick={copyPromptToClipboard}
              className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              {promptCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />} 
              <span className="ml-2">Copy Prompt</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />} 
            <span className="ml-2">Copy Diagram</span>
          </Button>
          {editable && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              {isEditing ? <Eye className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              <span className="ml-2">{isEditing ? 'Preview' : 'Edit'}</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <textarea
              ref={textareaRef}
              value={editableChart}
              onChange={(e) => setEditableChart(e.target.value)}
              className="w-full h-64 p-3 bg-gray-800 border border-gray-600 rounded-md text-gray-300 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Mermaid diagram syntax..."
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save Changes
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
                className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div 
            ref={mermaidRef}
            className="w-full overflow-auto bg-white rounded-lg p-4 min-h-[200px] flex items-center justify-center"
          >
            {isRendering && (
              <div className="text-gray-500 animate-pulse">Rendering diagram...</div>
            )}
            {!isRendering && !editableChart.trim() && (
              <div className="text-gray-500">No diagram content available</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}