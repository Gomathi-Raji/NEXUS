"use client";

import React from "react";
import Image from "next/image";
import { ContainerScroll } from "../ui/container-scroll-animation";

export function HeroScrollDemo() {
  return (
    <div className="flex flex-col overflow-hidden">
      <ContainerScroll
        titleComponent={
          <>
            <h1 className="text-4xl font-semibold text-white">
              Find Your Next <br />
              <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none bg-gradient-to-r from-golden-400 to-golden-500 bg-clip-text text-transparent">
                Project
              </span>
            </h1>
            <p className="text-xl text-gray-300 mt-4 max-w-2xl">
              Discover and analyze relevant open-source projects with AI-powered search
            </p>
          </>
        }
      >
        <Image
          src="/GithubImages/search.png"
          alt="Project search interface"
          height={720}
          width={1500}
          className="mx-auto rounded-2xl object-cover h-full object-left-top shadow-2xl border border-gray-800"
          draggable={false}
        />
      </ContainerScroll>
    </div>
  );
}
