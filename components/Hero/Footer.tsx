/* eslint-disable @next/next/no-img-element */
"use client";

import React from 'react';
import { FaGithub, FaTwitter, FaCoffee } from 'react-icons/fa';

const Footer = () => {
  const socialLinks = [
    {
      name: 'GitHub',
      url: 'https://github.com/itzdineshx',
      icon: <FaGithub className="h-5 w-5" />,
      color: 'text-white hover:text-gray-300'
    },
    {
      name: 'Twitter',
      url: 'https://x.com/@DINESH571146562',
      icon: <FaTwitter className="h-5 w-5" />,
      color: 'text-cyan-400 hover:text-cyan-300'
    },
    {
      name: 'Buy Me a Coffee',
      url: 'https://buymeacoffee.com/dinesh_xo',
      icon: <FaCoffee className="h-5 w-5" />,
      color: 'text-yellow-400 hover:text-yellow-300'
    }
  ];

  return (
    <footer className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-transparent">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md p-8 sm:p-10 shadow-[0_0_60px_-20px_rgba(99,102,241,0.25)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-center">
          {/* Text Section with improved typography */}
          <div className="relative flex flex-col justify-center h-full space-y-8">
            <div className="space-y-8">
              <div className="relative">
                {/* Subtle text glow */}
                <div className="absolute inset-0 blur-lg">
                  <h3 className="font-sans text-4xl font-bold text-white/20">
                    NEXUS
                  </h3>
                </div>
                <h3 className="relative -tracking-wide font-sans text-4xl font-bold text-white mb-6 leading-tight">
                  NEXUS
                </h3>
                
                <p className="font-sans text-xl text-white/80 leading-relaxed max-w-lg">
                  Discover, analyze, and build amazing projects with detailed insights
                </p>
              </div>
              
              {/* Enhanced Social Links */}
              <div className="flex gap-4">
                {socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group relative w-fit rounded-xl border border-white/15 bg-white/5 p-3 backdrop-blur-md transition-all duration-500 hover:border-white/30 hover:bg-white/10 hover:scale-110 hover:-translate-y-1 ${link.color}`}
                    title={link.name}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Enhanced glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-current/0 via-current/20 to-current/0 opacity-0 group-hover:opacity-100 rounded-xl blur-md transition-all duration-500 transform group-hover:scale-150"></div>
                    <div className="absolute inset-0 bg-current opacity-0 group-hover:opacity-10 rounded-xl transition-all duration-300"></div>
                    
                    <div className="relative transform transition-transform duration-300 group-hover:rotate-6">
                      {link.icon}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          {/* Enhanced Profile Section */}
          <div className="text-center lg:text-right">
            <div className="relative group rounded-3xl border border-white/10 p-3 transition-all duration-700 hover:border-white/25 hover:shadow-2xl hover:shadow-blue-500/10">
              {/* Multi-layer hover effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-cyan-500/10 to-yellow-400/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative flex flex-col lg:flex-row items-center gap-8 overflow-hidden rounded-2xl bg-black/60 backdrop-blur-md p-8 border border-white/8 transition-all duration-500 group-hover:bg-black/40">
                {/* Enhanced Profile Image */}
                <div className="relative flex-shrink-0 order-2 lg:order-1">
                  <div className="relative w-24 h-24 lg:w-28 lg:h-28">
                    {/* Animated border */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/50 via-cyan-400/50 to-yellow-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-spin-slow blur-sm"></div>
                    
                    <div className="relative w-full h-full rounded-2xl border border-white/25 bg-white/10 p-1.5 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:scale-105 group-hover:border-white/40">
                      <img 
                        src="https://github.com/itzdineshx.png" 
                        alt="DINESH S"
                        className="w-full h-full object-cover rounded-xl transition-transform duration-700 group-hover:scale-110"
                      />
                      
                      {/* Subtle overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-xl"></div>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Profile Info */}
                <div className="flex-grow text-center lg:text-right order-1 lg:order-2 space-y-3">
                  <h3 className="relative font-sans text-2xl lg:text-3xl font-semibold text-white leading-tight transition-all duration-300 group-hover:text-white/95">
                    <span className="relative z-10">Created by DINESH S</span>
                    <div className="absolute inset-0 blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500">
                      <span className="text-blue-300">Created by DINESH S </span>
                    </div>
                  </h3>
                  <p className="font-sans text-lg text-white/75 transition-colors duration-300 group-hover:text-white/85">
                    Software Engineer & Full Stack Developer
                  </p>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Enhanced Copyright with separator */}
        <div className="mt-10">
          {/* Elegant separator */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center">
              <div className="bg-transparent px-4">
                <div className="w-2 h-2 bg-white/20 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="font-sans text-sm text-white/60 transition-colors duration-300 hover:text-white/80">
              © {new Date().getFullYear()} NEXUS. Built with ❤️ by DINESH S
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;