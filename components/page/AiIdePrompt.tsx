'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, ClipboardCopy, Check, Loader2 } from 'lucide-react';

interface AiIdePromptProps {
  onGenerate: () => void;
  prompt: string;
  isGenerating: boolean;
}

export default function AiIdePrompt({ onGenerate, prompt, isGenerating }: AiIdePromptProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Bot className="text-purple-400" /> AI IDE Prompt
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {!prompt ? (
          <Button onClick={onGenerate} disabled={isGenerating} size="lg" className="bg-purple-600 hover:bg-purple-700">
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating Prompt...</>
            ) : (
              'Generate AI IDE Prompt'
            )}
          </Button>
        ) : (
          <div className="relative w-full p-4 bg-gray-900 rounded-lg text-left">
            <pre className="whitespace-pre-wrap text-sm text-gray-200 font-mono">
              <code>{prompt}</code>
            </pre>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={copyToClipboard}
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <ClipboardCopy className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
