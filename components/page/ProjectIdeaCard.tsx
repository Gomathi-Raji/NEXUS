'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProjectIdea } from '@/lib/gemini';
import { BrainCircuit, Wand2, Loader2 } from 'lucide-react';

interface ProjectIdeaCardProps {
  projectIdea: ProjectIdea;
  onGeneratePlan: () => void;
  isPlanning: boolean;
}

export default function ProjectIdeaCard({ projectIdea, onGeneratePlan, isPlanning }: ProjectIdeaCardProps) {
  return (
    <Card className="bg-gray-900/50 border-gray-700 animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl text-white">
          <BrainCircuit className="text-blue-400" /> {projectIdea.title}
        </CardTitle>
        <CardDescription className="text-gray-300 pt-2">{projectIdea.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-400">Difficulty</h4>
            <p className="text-lg font-bold text-white">{projectIdea.difficulty}</p>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg col-span-2">
            <h4 className="font-semibold text-gray-400">Primary Tech</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {projectIdea.techStack.map(tech => <Badge key={tech} variant="secondary">{tech}</Badge>)}
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-gray-400 mb-2">Keywords for GitHub Search</h4>
          <div className="flex flex-wrap gap-2">
            {projectIdea.keywords.map(kw => <Badge key={kw} variant="outline">{kw}</Badge>)}
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-gray-400 mb-2">Core Features</h4>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            {projectIdea.mustHaveFeatures.map((feature, i) => <li key={`must-${i}`}>{feature}</li>)}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-gray-400 mb-2">Nice-to-Have Features</h4>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            {projectIdea.niceToHaveFeatures.map((feature, i) => <li key={`nice-${i}`}>{feature}</li>)}
          </ul>
        </div>
        <div className="text-center pt-4">
          <Button onClick={onGeneratePlan} size="lg" className="bg-green-600 hover:bg-green-700" disabled={isPlanning}>
            {isPlanning ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating Plan...</>
            ) : (
              <><Wand2 className="w-5 h-5 mr-2" /> Generate Step-by-Step Plan</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
