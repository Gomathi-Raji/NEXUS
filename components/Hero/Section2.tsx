/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect } from 'react';
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { 
  FaRocket, FaSearch, FaChartLine, FaGithub, FaCode, FaStar, 
  FaUsers, FaBrain, FaEye, FaFilter, FaLightbulb, FaBalanceScale,
  FaPlay, FaArrowRight, FaExternalLinkAlt
} from 'react-icons/fa';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';


const Section2 = () => {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Main feature cards showcasing your website's capabilities
  const mainFeatures = [
    {
      id: 'search',
      title: "Smart Repository Search",
      description: "Search through millions of GitHub repositories with AI-powered filters and instant results.",
      icon: <FaSearch className="h-6 w-6" />,
      href: "/search",
      demo: "Try searching for 'react dashboard' or 'python ml'",
      features: [
        { icon: <FaFilter />, text: "Advanced Filters" },
        { icon: <FaRocket />, text: "Instant Results" },
        { icon: <FaBrain />, text: "AI-Powered" },
        { icon: <FaStar />, text: "Quality Ranking" }
      ],
      gradient: "from-blue-600/20 via-cyan-500/20 to-blue-600/20"
    },
    {
      id: 'analyze',
      title: "Deep Code Analysis",
      description: "Get comprehensive insights into repository structure, dependencies, and code quality metrics.",
      icon: <FaChartLine className="h-6 w-6" />,
      href: "/analyze",
      demo: "Analyze any GitHub repository in seconds",
      features: [
        { icon: <FaCode />, text: "File Structure" },
        { icon: <FaChartLine />, text: "Metrics & Stats" },
        { icon: <FaUsers />, text: "Contributor Insights" },
        { icon: <FaEye />, text: "Visual Diagrams" }
      ],
      gradient: "from-purple-600/20 via-pink-500/20 to-purple-600/20"
    },
    {
      id: 'compare',
      title: "Developer Showdown",
      description: "Compare GitHub developers with fun roasts, detailed stats, and interactive animations.",
      icon: <FaBalanceScale className="h-6 w-6" />,
      href: "/compare",
      demo: "Compare any two GitHub developers",
      features: [
        { icon: <FaUsers />, text: "Head-to-Head" },
        { icon: <FaChartLine />, text: "Detailed Stats" },
        { icon: <FaLightbulb />, text: "AI Roasts" },
        { icon: <FaRocket />, text: "Animations" }
      ],
      gradient: "from-green-600/20 via-teal-500/20 to-green-600/20"
    }
  ];

  // Secondary feature cards for additional capabilities
  const secondaryFeatures = [
    {
      title: "Project Ideas Generator",
      description: "Get AI-powered project suggestions tailored to your skills and interests.",
      icon: <FaLightbulb className="h-5 w-5" />,
      badge: "AI-Powered"
    },
    {
      title: "Repository Visualization",
      description: "Interactive flow diagrams and dependency graphs for better understanding.",
      icon: <FaEye className="h-5 w-5" />,
      badge: "Visual"
    },
    {
      title: "Open Source Discovery",
      description: "Find the best repositories to contribute to based on your expertise.",
      icon: <FaGithub className="h-5 w-5" />,
      badge: "Community"
    },
    {
      title: "Code Quality Insights",
      description: "Comprehensive analysis of code patterns, best practices, and improvements.",
      icon: <FaCode className="h-5 w-5" />,
      badge: "Analysis"
    }
  ];

  const floatingElements = [
    { icon: <FaGithub />, x: '10%', y: '15%', delay: '0s', duration: '8s' },
    { icon: <FaCode />, x: '90%', y: '20%', delay: '1s', duration: '6s' },
    { icon: <FaStar />, x: '15%', y: '80%', delay: '2s', duration: '7s' },
    { icon: <FaRocket />, x: '85%', y: '75%', delay: '1.5s', duration: '9s' },
    { icon: <FaBrain />, x: '50%', y: '10%', delay: '0.5s', duration: '5s' },
    { icon: <FaUsers />, x: '5%', y: '50%', delay: '2.5s', duration: '6.5s' }
  ];

  return (
    <section className="relative overflow-hidden pt-8 pb-10 md:pt-10 md:pb-12 px-4 sm:px-6 lg:px-8">

      <div className="max-w-7xl mx-auto relative z-10">
        
        <div className="text-center">
          <CardSpotlight
            className="h-auto w-full max-w-2xl mx-auto group"
            radius={500}
            color="#1e40af"
          >
            <div className="relative z-10 text-center py-6 md:py-7">
             
              <h3 className="text-3xl font-bold text-white mb-4">
                Ready to Build Something Amazing?
              </h3>
              <p className="text-white/70 mb-6 md:mb-7 text-lg">
                Start exploring repositories, analyzing code, and discovering your next great project.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/search">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                    <FaSearch className="mr-2 h-5 w-5" />
                    Start Searching
                  </Button>
                </Link>
                <Link href="/compare">
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8">
                    <FaBalanceScale className="mr-2 h-5 w-5" />
                    Compare Developers
                  </Button>
                </Link>
              </div>
            </div>
          </CardSpotlight>
        </div>
      </div>

      {/* Background removed intentionally for a clean, transparent section */}
    </section>
  );
};

export default Section2;