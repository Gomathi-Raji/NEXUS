"use client"
 
import { TextScroll } from "../ui/text-scroll"
 
export function RollingText() {
  const rollingTexts = [
    "Idea to Github Repos",
    "Analyze Repos",
    "Visualize Projects",
    "Compete with Devs",
    "Find Open Source Issues",
    ""
  ];

  return (
    <div className="w-full px-4 md:px-16">
      <TextScroll
        className="font-display text-center text-2xl italic font-medium tracking-tight text-black dark:text-white md:text-5xl md:leading-[3.5rem]"
        text={rollingTexts.join("  •  ")}
        default_velocity={1.5}
      />
    </div>
  );
}