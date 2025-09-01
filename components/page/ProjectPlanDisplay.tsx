'use client';

import React, { useState } from 'react';
import { ProjectPlan, Step } from '@/lib/gemini';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FileCode2, ClipboardCopy, Check } from 'lucide-react';

interface ProjectPlanDisplayProps {
  projectPlan: ProjectPlan;
}

export default function ProjectPlanDisplay({ projectPlan }: ProjectPlanDisplayProps) {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [id]: true }));
    setTimeout(() => setCopiedStates(prev => ({ ...prev, [id]: false })), 2000);
  };

  const renderStepContent = (step: Step, index: number) => (
    <div className="space-y-4 bg-gray-800/50 p-4 rounded-b-lg">
      <p className="text-gray-300 whitespace-pre-wrap">{step.explanation}</p>
      {step.code && (
        <div>
          <h5 className="font-semibold mb-2 text-gray-200">Code Snippet:</h5>
          <div className="relative group">
            <SyntaxHighlighter language={step.code.language} style={vscDarkPlus} customStyle={{ background: '#1E293B', borderRadius: '0.5rem', padding: '1rem' }}>
              {step.code.snippet}
            </SyntaxHighlighter>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => copyToClipboard(step.code!.snippet, `code-${index}`)}
            >
              {copiedStates[`code-${index}`] ? <Check className="h-4 w-4 text-green-500" /> : <ClipboardCopy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
      {step.shellCommand && (
        <div>
          <h5 className="font-semibold mb-2 text-gray-200">Shell Command:</h5>
          <div className="relative group bg-gray-900 p-4 rounded-lg font-mono text-sm text-gray-200">
            <code>{step.shellCommand}</code>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => copyToClipboard(step.shellCommand!, `shell-${index}`)}
            >
              {copiedStates[`shell-${index}`] ? <Check className="h-4 w-4 text-green-500" /> : <ClipboardCopy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <FileCode2 /> Step-by-Step Builder
      </h2>
      <Accordion type="single" collapsible className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-4">
        {projectPlan.steps.map((step, index) => (
          <AccordionItem value={`item-${index}`} key={index} className="border-b-gray-700">
            <AccordionTrigger className="hover:no-underline text-lg text-left">
              <span className="font-semibold">Step {index + 1}:</span> {step.title}
            </AccordionTrigger>
            <AccordionContent>
              {renderStepContent(step, index)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
