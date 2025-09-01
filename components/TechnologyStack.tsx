/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { Workflow, AlertCircle, Package, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TechnologyStackProps {
  repoFullName: string;
}

interface Technology {
  name: string;
  type: 'framework' | 'library' | 'language' | 'tool' | 'database' | 'hosting';
  version?: string;
  description: string;
  website?: string;
  icon?: string;
}

interface DependencyGroup {
  name: string;
  dependencies: Record<string, string>;
}

export function TechnologyStack({ repoFullName }: TechnologyStackProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [packageJson, setPackageJson] = useState<any>(null);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [languages, setLanguages] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const fetchTechStack = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch repository structure which includes package.json if available
        const response = await fetch(`/api/get-repo-structure?repo=${repoFullName}`);
        const data = await response.json();
        
        if (response.ok) {
          setLanguages(data.languages || {});
          
          // Try to find package.json in the file tree
          const fileTree = data.tree || [];
          const packageJsonFile = fileTree.find((file: any) => 
            file.type === 'file' && file.path === 'package.json'
          );
          
          if (packageJsonFile) {
            // Fetch the package.json content
            const contentResponse = await fetch(`/api/get-file-content?repo=${repoFullName}&path=package.json`);
            const contentData = await contentResponse.json();
            
            if (contentResponse.ok && contentData.content) {
              try {
                const parsedPackageJson = JSON.parse(contentData.content);
                setPackageJson(parsedPackageJson);
                
                // Extract technologies from package.json
                const extractedTech = extractTechnologiesFromPackageJson(parsedPackageJson);
                setTechnologies(extractedTech);
              } catch (parseError) {
                console.error('Error parsing package.json:', parseError);
              }
            }
          } else {
            // If no package.json, infer technologies from languages
            const inferredTech = inferTechnologiesFromLanguages(data.languages || {});
            setTechnologies(inferredTech);
          }
        } else {
          setError(data.error || 'Failed to fetch repository structure');
        }
      } catch (err) {
        console.error('Error fetching tech stack:', err);
        setError('An error occurred while analyzing the technology stack');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (repoFullName) {
      fetchTechStack();
    }
  }, [repoFullName]);
  
  // Extract technologies from package.json
  const extractTechnologiesFromPackageJson = (pkg: any): Technology[] => {
    const tech: Technology[] = [];
    
    // Add framework detection
    if (pkg.dependencies?.['react'] || pkg.devDependencies?.['react']) {
      tech.push({
        name: 'React',
        type: 'framework',
        version: pkg.dependencies?.['react'] || pkg.devDependencies?.['react'],
        description: 'A JavaScript library for building user interfaces',
        website: 'https://reactjs.org'
      });
      
      // Check for Next.js
      if (pkg.dependencies?.['next'] || pkg.devDependencies?.['next']) {
        tech.push({
          name: 'Next.js',
          type: 'framework',
          version: pkg.dependencies?.['next'] || pkg.devDependencies?.['next'],
          description: 'The React Framework for Production',
          website: 'https://nextjs.org'
        });
      }
    }
    
    // Check for Vue.js
    if (pkg.dependencies?.['vue'] || pkg.devDependencies?.['vue']) {
      tech.push({
        name: 'Vue.js',
        type: 'framework',
        version: pkg.dependencies?.['vue'] || pkg.devDependencies?.['vue'],
        description: 'The Progressive JavaScript Framework',
        website: 'https://vuejs.org'
      });
      
      // Check for Nuxt.js
      if (pkg.dependencies?.['nuxt'] || pkg.devDependencies?.['nuxt']) {
        tech.push({
          name: 'Nuxt.js',
          type: 'framework',
          version: pkg.dependencies?.['nuxt'] || pkg.devDependencies?.['nuxt'],
          description: 'The Intuitive Vue Framework',
          website: 'https://nuxtjs.org'
        });
      }
    }
    
    // Check for Angular
    if (pkg.dependencies?.['@angular/core'] || pkg.devDependencies?.['@angular/core']) {
      tech.push({
        name: 'Angular',
        type: 'framework',
        version: pkg.dependencies?.['@angular/core'] || pkg.devDependencies?.['@angular/core'],
        description: 'Platform for building mobile and desktop web applications',
        website: 'https://angular.io'
      });
    }
    
    // Check for Express
    if (pkg.dependencies?.['express'] || pkg.devDependencies?.['express']) {
      tech.push({
        name: 'Express',
        type: 'framework',
        version: pkg.dependencies?.['express'] || pkg.devDependencies?.['express'],
        description: 'Fast, unopinionated, minimalist web framework for Node.js',
        website: 'https://expressjs.com'
      });
    }
    
    // Check for TypeScript
    if (pkg.dependencies?.['typescript'] || pkg.devDependencies?.['typescript']) {
      tech.push({
        name: 'TypeScript',
        type: 'language',
        version: pkg.dependencies?.['typescript'] || pkg.devDependencies?.['typescript'],
        description: 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript',
        website: 'https://www.typescriptlang.org'
      });
    }
    
    // Check for UI libraries
    if (pkg.dependencies?.['tailwindcss'] || pkg.devDependencies?.['tailwindcss']) {
      tech.push({
        name: 'Tailwind CSS',
        type: 'library',
        version: pkg.dependencies?.['tailwindcss'] || pkg.devDependencies?.['tailwindcss'],
        description: 'A utility-first CSS framework',
        website: 'https://tailwindcss.com'
      });
    }
    
    if (pkg.dependencies?.['@mui/material'] || pkg.dependencies?.['@material-ui/core']) {
      tech.push({
        name: 'Material UI',
        type: 'library',
        version: pkg.dependencies?.['@mui/material'] || pkg.dependencies?.['@material-ui/core'],
        description: 'React components for faster and easier web development',
        website: 'https://mui.com'
      });
    }
    
    // Check for state management
    if (pkg.dependencies?.['redux'] || pkg.devDependencies?.['redux']) {
      tech.push({
        name: 'Redux',
        type: 'library',
        version: pkg.dependencies?.['redux'] || pkg.devDependencies?.['redux'],
        description: 'Predictable state container for JavaScript apps',
        website: 'https://redux.js.org'
      });
    }
    
    if (pkg.dependencies?.['mobx'] || pkg.devDependencies?.['mobx']) {
      tech.push({
        name: 'MobX',
        type: 'library',
        version: pkg.dependencies?.['mobx'] || pkg.devDependencies?.['mobx'],
        description: 'Simple, scalable state management',
        website: 'https://mobx.js.org'
      });
    }
    
    // Check for testing frameworks
    if (pkg.dependencies?.['jest'] || pkg.devDependencies?.['jest']) {
      tech.push({
        name: 'Jest',
        type: 'tool',
        version: pkg.dependencies?.['jest'] || pkg.devDependencies?.['jest'],
        description: 'Delightful JavaScript Testing Framework',
        website: 'https://jestjs.io'
      });
    }
    
    if (pkg.dependencies?.['cypress'] || pkg.devDependencies?.['cypress']) {
      tech.push({
        name: 'Cypress',
        type: 'tool',
        version: pkg.dependencies?.['cypress'] || pkg.devDependencies?.['cypress'],
        description: 'JavaScript End to End Testing Framework',
        website: 'https://www.cypress.io'
      });
    }
    
    // Check for databases
    if (pkg.dependencies?.['mongoose'] || pkg.dependencies?.['mongodb']) {
      tech.push({
        name: 'MongoDB',
        type: 'database',
        version: pkg.dependencies?.['mongoose'] || pkg.dependencies?.['mongodb'],
        description: 'NoSQL database',
        website: 'https://www.mongodb.com'
      });
    }
    
    if (pkg.dependencies?.['pg'] || pkg.dependencies?.['sequelize']) {
      tech.push({
        name: 'PostgreSQL',
        type: 'database',
        version: pkg.dependencies?.['pg'] || pkg.dependencies?.['sequelize'],
        description: 'Open source relational database',
        website: 'https://www.postgresql.org'
      });
    }
    
    if (pkg.dependencies?.['mysql'] || pkg.dependencies?.['mysql2']) {
      tech.push({
        name: 'MySQL',
        type: 'database',
        version: pkg.dependencies?.['mysql'] || pkg.dependencies?.['mysql2'],
        description: 'Open source relational database',
        website: 'https://www.mysql.com'
      });
    }
    
    return tech;
  };
  
  // Infer technologies from languages
  const inferTechnologiesFromLanguages = (langs: Record<string, number>): Technology[] => {
    const tech: Technology[] = [];
    
    if (langs['JavaScript']) {
      tech.push({
        name: 'JavaScript',
        type: 'language',
        description: 'High-level, interpreted programming language'
      });
    }
    
    if (langs['TypeScript']) {
      tech.push({
        name: 'TypeScript',
        type: 'language',
        description: 'Typed superset of JavaScript that compiles to plain JavaScript'
      });
    }
    
    if (langs['Python']) {
      tech.push({
        name: 'Python',
        type: 'language',
        description: 'Interpreted, high-level, general-purpose programming language'
      });
    }
    
    if (langs['Java']) {
      tech.push({
        name: 'Java',
        type: 'language',
        description: 'Class-based, object-oriented programming language'
      });
    }
    
    if (langs['Go']) {
      tech.push({
        name: 'Go',
        type: 'language',
        description: 'Statically typed, compiled programming language'
      });
    }
    
    if (langs['Ruby']) {
      tech.push({
        name: 'Ruby',
        type: 'language',
        description: 'Dynamic, open source programming language'
      });
    }
    
    if (langs['PHP']) {
      tech.push({
        name: 'PHP',
        type: 'language',
        description: 'Server-side scripting language'
      });
    }
    
    if (langs['C#']) {
      tech.push({
        name: 'C#',
        type: 'language',
        description: 'Multi-paradigm programming language'
      });
    }
    
    if (langs['C++']) {
      tech.push({
        name: 'C++',
        type: 'language',
        description: 'General-purpose programming language'
      });
    }
    
    if (langs['Rust']) {
      tech.push({
        name: 'Rust',
        type: 'language',
        description: 'Multi-paradigm, high-level, general-purpose programming language'
      });
    }
    
    return tech;
  };
  
  // Group dependencies by type
  const dependencyGroups: DependencyGroup[] = packageJson ? [
    {
      name: 'Dependencies',
      dependencies: packageJson.dependencies || {}
    },
    {
      name: 'Dev Dependencies',
      dependencies: packageJson.devDependencies || {}
    }
  ] : [];
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[300px]">
        <div className="text-center">
                          <Workflow className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-4" />
          <p className="text-white/70">Analyzing technology stack...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="text-red-500 font-medium">Error Analyzing Technology Stack</h3>
            <p className="text-white/70 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Main technologies */}
      {technologies.length > 0 && (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-4">
          <h3 className="text-white font-medium mb-4">Core Technologies</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {technologies.map((tech, index) => (
              <div 
                key={index} 
                className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">{tech.name}</h4>
                  <Badge 
                    className={`
                      ${tech.type === 'framework' ? 'bg-purple-500/20 text-purple-300' : ''}
                      ${tech.type === 'library' ? 'bg-amber-500/20 text-amber-300' : ''}
                      ${tech.type === 'language' ? 'bg-yellow-500/20 text-yellow-300' : ''}
                      ${tech.type === 'tool' ? 'bg-green-500/20 text-green-300' : ''}
                      ${tech.type === 'database' ? 'bg-red-500/20 text-red-300' : ''}
                      ${tech.type === 'hosting' ? 'bg-amber-500/20 text-amber-300' : ''}
                    `}
                  >
                    {tech.type}
                  </Badge>
                </div>
                
                <p className="text-white/70 text-sm mb-2">{tech.description}</p>
                
                <div className="flex items-center justify-between">
                  {tech.version && (
                    <span className="text-white/50 text-xs">v{tech.version.replace(/[^0-9.]/g, '')}</span>
                  )}
                  
                  {tech.website && (
                    <a 
                      href={tech.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1"
                    >
                      <span>Documentation</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Languages */}
      {Object.keys(languages).length > 0 && (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-4">
          <h3 className="text-white font-medium mb-3">Language Distribution</h3>
          
          <div className="space-y-3">
            {Object.entries(languages)
              .sort(([, a], [, b]) => b - a)
              .map(([language, bytes]) => {
                const totalBytes = Object.values(languages).reduce((sum, val) => sum + val, 0);
                const percentage = Math.round((bytes / totalBytes) * 100);
                
                return (
                  <div key={language} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">{language}</span>
                      <span className="text-white/60 text-xs">{percentage}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-amber-500 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
      
      {/* Dependencies */}
      {dependencyGroups.length > 0 && dependencyGroups.some(group => Object.keys(group.dependencies).length > 0) && (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-4">
          <h3 className="text-white font-medium mb-4">Dependencies</h3>
          
          <div className="space-y-6">
            {dependencyGroups.map((group, groupIndex) => {
              const deps = Object.entries(group.dependencies);
              if (deps.length === 0) return null;
              
              return (
                <div key={groupIndex}>
                  <h4 className="text-white/80 text-sm font-medium mb-3">{group.name} ({deps.length})</h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {deps.map(([name, version], index) => (
                      <div 
                        key={index} 
                        className="bg-white/5 border border-white/10 rounded p-2 text-sm"
                      >
                        <div className="truncate text-white/80">{name}</div>
                        <div className="text-white/50 text-xs">{version}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}