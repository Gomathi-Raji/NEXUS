'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="bg-gray-800/50 border-gray-700 text-white">
      <CardHeader className="flex flex-col items-center text-center">
        <div className="mb-4 p-3 rounded-full bg-gray-700">
          {icon}
        </div>
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center text-gray-400">
        <p>{description}</p>
      </CardContent>
    </Card>
  );
}
