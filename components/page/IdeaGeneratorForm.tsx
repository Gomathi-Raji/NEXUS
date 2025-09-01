'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';

interface LoadingSpinnerProps {
  text: string;
}

const LoadingSpinner = ({ text }: LoadingSpinnerProps) => (
  <div className="flex items-center justify-center gap-3">
    <Loader2 className="w-5 h-5 animate-spin" />
    <span>{text}</span>
  </div>
);

interface IdeaGeneratorFormProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export default function IdeaGeneratorForm({ prompt, setPrompt, handleSubmit, isLoading }: IdeaGeneratorFormProps) {
  return (
    <Card className="bg-gray-900/50 border-gray-700 p-6 mb-12 shadow-2xl shadow-blue-500/10">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        <Input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='e.g., "a chat app with React" or "a crypto dashboard"'
          className="flex-grow bg-gray-800/70 border-gray-600 focus:ring-blue-500 text-lg h-12"
          disabled={isLoading}
        />
        <Button type="submit" size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-12 text-base" disabled={isLoading || !prompt}>
          {isLoading ? <LoadingSpinner text="Generating..." /> : <><Sparkles className="w-5 h-5 mr-2" /> Generate Idea</>}
        </Button>
      </form>
    </Card>
  );
}
