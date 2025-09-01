"use client";
import React, { JSX } from "react";
import { HoverBorderGradient } from "../ui/hover-border-gradient";

export function GoodText(): JSX.Element {
  return (
    <HoverBorderGradient
      containerClassName="rounded-full"
      as="span"
      className="dark:bg-black bg-white text-black dark:text-white px-5 py-2 text-3xl font-extrabold tracking-wide"
    >
      DEVELOPERS
    </HoverBorderGradient>
  );
}

export function GoodText1(): JSX.Element {
  return (
    <HoverBorderGradient
      containerClassName="rounded-full"
      as="span"
      className="dark:bg-black bg-white text-black dark:text-white px-5 py-2 text-3xl font-extrabold tracking-wide"
    >
      FEATURES
    </HoverBorderGradient>
  );
}

export function GoodTextReadme(): JSX.Element {
  return (
    <HoverBorderGradient
      containerClassName="rounded-full"
      as="span"
      className="dark:bg-black bg-white text-black dark:text-white px-5 py-2 text-3xl font-extrabold tracking-wide"
    >
      README
    </HoverBorderGradient>
  );
}

export function GoodTextTestimonials(): JSX.Element {
  return (
    <HoverBorderGradient
      containerClassName="rounded-full"
      as="span"
      className="dark:bg-black bg-white text-black dark:text-white px-5 py-2 text-3xl font-extrabold tracking-wide"
    >
      TESTIMONIALS
    </HoverBorderGradient>
  );
}

