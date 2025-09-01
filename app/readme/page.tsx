"use client";

import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { default as ReactMarkdown } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import type { Components } from "react-markdown";

import {
  Github,
  Eye,
  Pencil,
  KeyRound,
  Copy,
  Download,
  RefreshCw,
  Loader2,
  Wand2,
  Check,
  ChevronsDown,
} from "lucide-react";

// Ensure clean GitHub-flavored Markdown spacing and no stray HTML wrappers
function normalizeMarkdown(input: string): string {
  let s = input || "";
  // Convert common HTML headings to Markdown
  s = s.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level: string, text: string) => {
    const hashes = "#".repeat(Number(level));
    return `\n${hashes} ${text.trim()}\n`;
  });
  // Strip simple center wrappers/divs
  s = s.replace(/<div[^>]*>\s*/gi, "\n").replace(/\s*<\/div>/gi, "\n");
  // Replace <br> with line breaks
  s = s.replace(/<br\s*\/?>(\s*)/gi, "\n");
  // Ensure a blank line before/after block elements (headings, lists, code, tables, images)
  s = s
    // Ensure space after list markers
    .replace(/^(\s*)([-*+])(\S)/gm, "$1$2 $3")
    // Blank line before headings
    .replace(/([^\n])\n(#{1,6} )/g, "$1\n\n$2")
    // Ensure blank lines before common blocks
    .replace(/([^\n])\n(#{1,6} )/g, "$1\n\n$2")
    .replace(/([^\n])\n(\s*[-*+] )/g, "$1\n\n$2")
    .replace(/([^\n])\n(```)/g, "$1\n\n$2")
    .replace(/([^\n])\n(> )/g, "$1\n\n$2");
  // Collapse 3+ blank lines to 2
  s = s.replace(/\n{3,}/g, "\n\n");
  // Ensure blank line between plain text lines (not lists/quotes/headings/code/tables)
  s = s.replace(
    /^(?!\|)(?!\s*[>#\-\*\+0-9]+[\.\)]\s)(?!#{1,6}\s)(?!```)([^\n]+)\n(?!\|)(?!\s*[>#\-\*\+0-9]+[\.\)]\s)(?!#{1,6}\s)(?!```)([^\n]+)/gm,
    (m, a, b) => `${a.trim()}\n\n${b.trim()}`
  );
  // Ensure code fences are isolated lines
  s = s
    .replace(/\s*```(\w+)?\s*\n?/g, (m) => `\n\n${m.trim()}\n`)
    .replace(/\n\n\n+/g, "\n\n");
  // Ensure tables have blank lines around, but collapse accidental blank lines within tables
  s = s
    .replace(/\n([^\n]*\|[^\n]*\n\s*\|?\s*[-: ]+\|[-:| ]+[^\n]*\n[\s\S]*?(?=\n\n|$))/g, (m, tbl) => `\n\n${tbl.replace(/\n\n\|/g, '\n|')}\n\n`)
    .replace(/\n\n\|/g, '\n|');
  // Trim trailing whitespace
  s = s.replace(/[ \t]+$/gm, "");
  return s.trim() + "\n";
}

export default function ReadmePage() {
  const [repo, setRepo] = useState("");
  const [userNotes, setUserNotes] = useState<string>("");
  const [githubToken, setGithubToken] = useState("");
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [markdown, setMarkdown] = useState<string>("\n# README\n\nStart by generating a README from your repository, then edit here. ✨\n");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geminiKey, setGeminiKey] = useState<string>("");
  const [showGeminiDialog, setShowGeminiDialog] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState<string>("Improve clarity and conciseness while preserving meaning.");
  const [isRefining, setIsRefining] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [showRefineTip, setShowRefineTip] = useState(false);
  const [flashEditor, setFlashEditor] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animLabel, setAnimLabel] = useState<string | null>(null);
  // Store the full target content to allow resuming the typing animation
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
  const [showToolbarRefine, setShowToolbarRefine] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [followBottom, setFollowBottom] = useState(false);
  
  // Helpers: sticky auto-scroll only when user is near the bottom
  const isNearBottom = (el: HTMLElement, threshold = 80) => {
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };
  const stickToBottomIfNeeded = (el: HTMLElement | null) => {
    if (!el) return;
    if (isNearBottom(el)) {
      // Use rAF to avoid layout thrash during rapid updates
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  };

  // When user enables follow mode, keep scrolling to bottom smoothly on updates
  useEffect(() => {
    if (!followBottom) return;
    const id = requestAnimationFrame(() => {
      if (editorRef.current) {
        editorRef.current.scrollTop = editorRef.current.scrollHeight;
      }
      if (previewRef.current) {
        previewRef.current.scrollTop = previewRef.current.scrollHeight;
      }
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(id);
  }, [followBottom, markdown]);

  // Auto-disable follow when work is done
  useEffect(() => {
    if (!isGenerating && !isAnimating && !pendingTarget) setFollowBottom(false);
  }, [isGenerating, isAnimating, pendingTarget]);
  // PR flow state
  const [isCreatingPr, setIsCreatingPr] = useState(false);
  const [showPrDialog, setShowPrDialog] = useState(false);
  const [prUrl, setPrUrl] = useState<string>("");

  // Load token from localStorage for convenience
  useEffect(() => {
    try {
      const saved = localStorage.getItem("wtb_github_token");
      if (saved) setGithubToken(saved);
      const g = localStorage.getItem("wtb_gemini_key");
      if (g) setGeminiKey(g);
      const savedMd = localStorage.getItem("wtb_readme_markdown");
      if (savedMd) setMarkdown(savedMd);
      const savedNotes = localStorage.getItem("wtb_readme_user_notes");
      if (savedNotes) setUserNotes(savedNotes);
    } catch {}
  }, []);

  // Track selection presence on the textarea
  const updateSelectionState = () => {
    const el = editorRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    setHasSelection(end > start && !!markdown.slice(start, end).trim());
  };

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const handlers: Array<"select" | "keyup" | "mouseup" | "input"> = ["select", "keyup", "mouseup", "input"]; // update on common events
    handlers.forEach((evt) => el.addEventListener(evt, updateSelectionState));
    return () => {
      handlers.forEach((evt) => el.removeEventListener(evt, updateSelectionState));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorRef.current, markdown]);

  const handleSaveToken = () => {
    try {
      if (githubToken) localStorage.setItem("wtb_github_token", githubToken);
      else localStorage.removeItem("wtb_github_token");
    } catch {}
    setShowTokenDialog(false);
  };

  // Persist markdown drafts
  useEffect(() => {
    try {
      localStorage.setItem("wtb_readme_markdown", markdown);
    } catch {}
  }, [markdown]);

  // Utility: sleep
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));


  // Animate replacing a selection with a per-character typing effect
  const animateRefineReplace = async (start: number, end: number, refined: string, baseStepMs = 8) => {
    const before = markdown.slice(0, start);
    const after = markdown.slice(end);
    const text = refined.replace(/\r\n/g, "\n");
    setIsAnimating(true);
    setAnimLabel("Refining… typing");

    // Start by clearing selection (so we type into empty space)
    setMarkdown(before + after);
    await new Promise((r) => setTimeout(r, 0));

    let acc = "";
    const total = text.length;
    for (let i = 0; i < total; i++) {
      acc += text[i];
      setMarkdown(before + acc + after);
      // Move caret to end of typed text to show a live cursor in the textarea
      if (editorRef.current) {
        const pos = before.length + acc.length;
        editorRef.current.selectionStart = pos;
        editorRef.current.selectionEnd = pos;
        stickToBottomIfNeeded(editorRef.current);
      }
      // Also keep preview stuck to bottom if user hasn't scrolled up
      stickToBottomIfNeeded(previewRef.current);
      // Natural typing cadence: slightly slower after newlines/periods
      const ch = text[i];
      const extra = ch === '\n' ? 10 : ch === '.' ? 6 : ch === ',' ? 3 : 0;
      const jitter = Math.floor(Math.random() * 4); // 0-3ms
      await delay(baseStepMs + extra + jitter);
      // Fast path for very long outputs: occasionally batch-write chunks
      if (total > 1500 && i % 20 === 0) await delay(0);
    }

    setIsAnimating(false);
    setAnimLabel(null);
    // Place caret at end
    setTimeout(() => {
      if (!editorRef.current) return;
      const pos = before.length + text.length;
      editorRef.current.selectionStart = pos;
      editorRef.current.selectionEnd = pos;
      editorRef.current.focus();
    }, 0);
  };

  // Animate initial README generation with per-character typing effect
  const animateSetMarkdown = async (content: string, baseStepMs = 6) => {
    const text = content.replace(/\r\n/g, "\n");
    setIsAnimating(true);
    setAnimLabel("Generating Readme...");
    setMarkdown("");
    await new Promise((r) => setTimeout(r, 0));
    let acc = "";
    for (let i = 0; i < text.length; i++) {
      acc += text[i];
      setMarkdown(acc);
      if (editorRef.current) {
        const pos = acc.length;
        editorRef.current.selectionStart = pos;
        editorRef.current.selectionEnd = pos;
        stickToBottomIfNeeded(editorRef.current);
      }
      stickToBottomIfNeeded(previewRef.current);
      const ch = text[i];
      const extra = ch === '\n' ? 8 : ch === '.' ? 4 : ch === ',' ? 2 : 0;
      const jitter = Math.floor(Math.random() * 4);
      await delay(baseStepMs + extra + jitter);
      if (text.length > 1800 && i % 20 === 0) await delay(0);
    }
    setIsAnimating(false);
    setAnimLabel(null);
    setTimeout(() => {
      if (!editorRef.current) return;
      const end = acc.length;
      editorRef.current.selectionStart = end;
      editorRef.current.selectionEnd = end;
    }, 0);
  };

  // Continue typing into the editor from the current content up to the stored target
  const animateContinueToTarget = async (baseStepMs = 6) => {
    if (!pendingTarget) return;
    const text = pendingTarget.replace(/\r\n/g, "\n");
    const startIndex = markdown.length;
    if (!text.startsWith(markdown)) {
      // If diverged, just replace with target and exit
      setMarkdown(text);
      setPendingTarget(null);
      return;
    }
    setIsAnimating(true);
    setAnimLabel("Resuming...");
    for (let i = startIndex; i < text.length; i++) {
      setMarkdown(text.slice(0, i + 1));
      if (editorRef.current) {
        const pos = i + 1;
        editorRef.current.selectionStart = pos;
        editorRef.current.selectionEnd = pos;
        stickToBottomIfNeeded(editorRef.current);
      }
      stickToBottomIfNeeded(previewRef.current);
      const ch = text[i];
      const extra = ch === '\n' ? 8 : ch === '.' ? 4 : ch === ',' ? 2 : 0;
      const jitter = Math.floor(Math.random() * 4);
      await delay(baseStepMs + extra + jitter);
      if (text.length > 1800 && i % 20 === 0) await delay(0);
    }
    setIsAnimating(false);
    setAnimLabel(null);
    setPendingTarget(null);
  };

  // Persist user notes
  useEffect(() => {
    try {
      localStorage.setItem("wtb_readme_user_notes", userNotes);
    } catch {}
  }, [userNotes]);

  const handleSaveGeminiKey = () => {
    try {
      if (geminiKey) localStorage.setItem("wtb_gemini_key", geminiKey);
      else localStorage.removeItem("wtb_gemini_key");
    } catch {}
    setShowGeminiDialog(false);
  };

  const handleGenerate = async () => {
    if (!repo.trim()) {
      setError("Please enter a GitHub repo URL or owner/repo.");
      setShowErrorDialog(true);
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-readme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo, githubToken: githubToken || undefined, userNotes: userNotes || undefined }),
      });
      const result = await res.json();
      const raw = (result.markdown || result.content || "") as string;
      const formatted = normalizeMarkdown(raw);
      // Store full target so we can resume if animation is interrupted
      setPendingTarget(formatted);
      // Hide loading overlay before typing animation starts
      setIsGenerating(false);
      // Animate first paint with typing effect
      await animateSetMarkdown(formatted);
      // Clear target when finished
      setPendingTarget(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
      setShowErrorDialog(true);
    } finally {
      // Ensure overlay is off (already turned off before typing)
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(markdown);
      } else {
        // Fallback for insecure contexts
        const ta = document.createElement('textarea');
        ta.value = markdown;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      setError('Failed to copy to clipboard');
      setShowErrorDialog(true);
      console.error(e);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "README.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Create README PR via server API using user's GitHub token
  const handleCreatePr = async () => {
    if (!repo.trim()) {
      setError("Please enter a GitHub repo URL or owner/repo.");
      setShowErrorDialog(true);
      return;
    }
    if (!githubToken) {
      setShowTokenDialog(true);
      return;
    }
    setIsCreatingPr(true);
    setError(null);
    try {
      const res = await fetch('/api/create-readme-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo,
          markdown,
          token: githubToken,
          commitMessage: 'chore(readme): update README via WhatToBuild',
          prTitle: 'Update README via WhatToBuild',
          prBody: 'This PR updates the README generated/refined in WhatToBuild.'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to create PR');
      setPrUrl(data.url as string);
      setShowPrDialog(true);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create PR';
      setError(message);
      setShowErrorDialog(true);
    } finally {
      setIsCreatingPr(false);
    }
  };

  // Refine selected text in editor using user-provided Gemini key (client-side)
  const handleRefineSelection = async () => {
    if (!editorRef.current) return;
    const textarea = editorRef.current;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selected = markdown.slice(start, end);
    if (!selected || !selected.trim()) {
      setError("Select some text in the editor to refine.");
      setShowRefineTip(true);
      setFlashEditor(true);
      setTimeout(() => setFlashEditor(false), 900);
      return;
    }
    if (!geminiKey) {
      setShowGeminiDialog(true);
      return;
    }
    setIsRefining(true);
    setError(null);
    try {
      const prompt = `Rewrite the following Markdown selection according to the instruction.\nInstruction: ${refineInstruction}\nSelection:\n\n${selected}`;
      const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': geminiKey,
        },
        body: JSON.stringify({
          contents: [ { parts: [ { text: prompt } ] } ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          }
        })
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Gemini error ${resp.status}: ${text}`);
      }
      const data = await resp.json();
      const refined = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!refined) throw new Error('Empty response from Gemini');
      // Animate replace selection
      await animateRefineReplace(start, end, refined);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to refine selection';
      setError(message);
    } finally {
      setIsRefining(false);
    }
  };

  // Typed ReactMarkdown components to satisfy TS for `inline` on code
  const markdownComponents: Components = {
    h1: (props) => (
      <h1
        {...props}
        className="mt-0 mb-4 text-3xl md:text-4xl font-extrabold tracking-tight border-b border-white/10 pb-2"
      />
    ),
    h3: (props) => (
      <h3
        {...props}
        className="mt-6 mb-2 text-xl md:text-2xl font-semibold"
      />
    ),
    h4: (props) => (
      <h4
        {...props}
        className="mt-5 mb-2 text-lg md:text-xl font-semibold"
      />
    ),
    h2: (props) => (
      <h2
        {...props}
        className="mt-8 mb-3 text-2xl md:text-3xl font-bold border-b border-white/10 pb-1"
      />
    ),
    table: ({ children }) => (
      <div className="my-6 overflow-x-auto rounded-xl border border-white/10 bg-white/5">
        <table className="w-full text-left text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-white/5">{children}</thead>,
    th: (props) => <th {...props} className="px-3 py-2 font-semibold text-white/90" />,
    td: (props) => <td {...props} className="px-3 py-2 align-top text-white/80" />,
    tr: (props) => <tr {...props} className="border-t border-white/10" />,
    blockquote: (props) => (
      <blockquote {...props} className="border-l-4 border-indigo-400/40 bg-white/5 px-4 py-3 rounded-r-lg" />
    ),
    code: (props) => {
      const { inline, children, ...rest } = props as React.ComponentProps<'code'> & { inline?: boolean };
      return inline ? (
        <code {...rest} className="bg-white/10 px-1.5 py-0.5 rounded">{children}</code>
      ) : (
        <code {...rest}>{children}</code>
      );
    },
    pre: (props: React.ComponentProps<'pre'>) => <pre {...props} className="bg-white/5 rounded-lg p-4 overflow-auto" />,
    hr: () => <hr className="my-8 border-white/10" />,
    ul: (props: React.ComponentProps<'ul'>) => (
      <ul {...props} className="list-disc pl-6 my-4 marker:text-white/60 space-y-1 [&>li>a]:leading-7 [&>li>a]:underline-offset-4" />
    ),
    ol: (props: React.ComponentProps<'ol'>) => (
      <ol {...props} className="list-decimal pl-6 my-4 marker:text-white/60 space-y-1 [&>li>a]:leading-7 [&>li>a]:underline-offset-4" />
    ),
    a: (props: React.ComponentProps<'a'>) => <a {...props} className="text-indigo-300 hover:text-indigo-200 underline" />,
    // We intentionally allow raw <img> tags inside rendered README markdown, since these may come
    // from external sources and Next/Image optimization isn't always applicable here.
  
    img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
      <img {...props} alt={props.alt ?? ''} className="inline-block align-middle mr-2 mb-2 rounded" />
    ),
    p: (props: React.ComponentProps<'p'>) => {
      const childrenArray = React.Children.toArray(props.children);
      const isAllImages =
        childrenArray.length > 0 &&
        childrenArray.every((c) => React.isValidElement(c) && typeof c.type === 'string' && c.type === 'img');
      if (isAllImages) {
        return <div className="flex flex-wrap items-center gap-2 my-3">{props.children}</div>;
      }
      return <p {...props} />;
    },
  };

  return (
    <div className="container mx-auto p-4 md:p-8 pt-24 md:pt-32">
      {/* Ambient background effects to match search page */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-black/80 via-gray-900/60 to-black/80 pointer-events-none" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent opacity-60 pointer-events-none" />

      <header className="text-center mt-24 md:mt-32 mb-8 md:mb-12">
        <div className="relative inline-block">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            Generate a Great README
          </h1>
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 blur-xl opacity-50 -z-10"></div>
        </div>
        <p className="mt-4 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
          Paste a GitHub repository URL or owner/repo. Analyze the codebase and draft a polished README. Edit and preview live.
        </p>
      </header>

      <main>
        {/* Repo input */}
        <div className="relative max-w-3xl mx-auto mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-black/30 backdrop-blur-2xl border border-white/20 shadow-2xl shadow-black/20 group transition-all duration-300 hover:border-white/30 hover:bg-black/40 focus-within:border-white/40 focus-within:bg-black/50">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none" />
            <div className="flex items-center gap-2 p-1">
              <Github className="w-5 h-5 text-white/60 ml-3" />
              <Input
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="e.g., facebook/react or https://github.com/facebook/react"
                className="flex-grow p-6 text-lg bg-transparent border-0 text-white/90 placeholder:text-white/40 focus-visible:ring-0 focus-visible:outline-none"
              />
              <Button
                onClick={() => setShowTokenDialog(true)}
                className="m-2 bg-black/50 hover:bg-black/70 text-white/90 font-medium border border-white/20 hover:border-white/30 backdrop-blur-xl px-4"
                type="button"
              >
                <KeyRound className="w-4 h-4 mr-2" /> Private
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="m-2 bg-black/50 hover:bg-black/70 text-white/90 font-medium border border-white/20 hover:border-white/30 backdrop-blur-xl px-6"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" /> Generate
                  </>
                )}
              </Button>
            </div>
            <div className="absolute -inset-1 bg-gradient-to-r from-white/0 via-white/10 to-white/0 blur-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500 -z-10"></div>
          </div>
          <div className="text-center mt-3 text-sm text-white/50">
            Repos that are private require a GitHub token with repo read access. We never send your token to the client API provider; it is only used server-side to read your repo.
          </div>
        </div>

        {/* Optional notes to guide README */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="rounded-2xl bg-black/30 backdrop-blur-2xl border border-white/20 p-4">
            <label className="block text-sm text-white/60 mb-2">Optional notes or preferences</label>
            <textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Anything specific to include (badges, tech stack, deployment steps, screenshots, etc.)"
              className="w-full min-h-24 resize-y bg-transparent text-white/90 placeholder:text-white/40 outline-none"
            />
          </div>
        </div>

        {/* Editor + Preview */}
        <section className="relative grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <div className="relative rounded-2xl bg-black/30 backdrop-blur-2xl border border-white/20 p-4 flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-y-2 mb-3">
              <div className="flex items-center gap-2 text-white/80">
                <Pencil className="w-4 h-4" />
                <span className="text-sm font-medium">Editor</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 max-w-full">
                <Button variant="ghost" className="text-white/70 hover:text-white shrink-0 px-2 py-1" onClick={handleCopy}>
                  <Copy className="w-4 h-4 mr-1" /> Copy
                </Button>
                <Button variant="ghost" className="text-white/70 hover:text-white shrink-0 px-2 py-1" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-1" /> Download
                </Button>
                {/* Replace Beautify with AI Refine in toolbar */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    onClick={() => setShowToolbarRefine((v) => !v)}
                    disabled={isGenerating}
                    className="rounded-full bg-amber-600/25 hover:bg-amber-600/35 text-amber-100 border border-amber-400/40 backdrop-blur px-3 py-2 shadow shrink-0"
                    title={geminiKey ? "Refine selected text with AI" : "Add your Gemini API key to enable refine"}
                  >
                    {isRefining ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Wand2 className="w-4 h-4 mr-1" />}
                    AI Refine
                  </Button>
                  {/* Resume typing button appears when we have a pending target and current text is a prefix */}
                  {!isAnimating && pendingTarget && markdown.length < pendingTarget.length && pendingTarget.startsWith(markdown) && (
                    <Button
                      variant="ghost"
                      onClick={() => { void animateContinueToTarget(); }}
                      className="ml-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur px-3 py-2 shrink-0"
                      title="Continue typing the generated README"
                    >
                      Resume typing
                    </Button>
                  )}
                  {showToolbarRefine && (
                    <div className="absolute top-full right-0 mt-2 w-[90vw] max-w-sm sm:w-[360px] rounded-2xl border border-white/20 bg-black/80 backdrop-blur-2xl p-4 shadow-2xl ring-1 ring-white/10 z-30 overflow-hidden">
                      <div className="text-sm sm:text-base text-white/80 font-medium mb-2">Instruction</div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <input
                          value={refineInstruction}
                          onChange={(e) => setRefineInstruction(e.target.value)}
                          placeholder="e.g., Improve clarity and conciseness"
                          className="min-w-0 flex-1 rounded-md border border-white/25 bg-black/40 px-3 py-2.5 text-base sm:text-lg leading-6 text-white placeholder:text-white/50 outline-none focus:border-amber-400/40 focus:ring-2 focus:ring-amber-400/20"
                        />
                        <Button
                          onClick={async () => {
                            await handleRefineSelection();
                            setShowToolbarRefine(false);
                          }}
                          disabled={isGenerating || isRefining}
                          className="bg-white/10 hover:bg-white/20 text-white shrink-0 px-3.5 py-2 text-sm sm:text-base"
                          title="Run AI Refine on selected text"
                        >
                          {isRefining ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                          Go
                        </Button>
                      </div>
                      {!geminiKey && (
                        <div className="mt-2 text-[11px] text-amber-300/90">Add your Gemini API key to enable refine.</div>
                      )}
                      {!hasSelection && (
                        <div className="mt-1 text-[11px] text-white/70">Tip: select some text in the editor.</div>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  onClick={handleCreatePr}
                  disabled={isGenerating || isCreatingPr}
                  className="text-emerald-300/90 hover:text-emerald-200 shrink-0 px-2 py-1"
                  title="Create a PR that updates README.md in your repo"
                >
                  {isCreatingPr ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Github className="w-4 h-4 mr-1" />}
                  Create PR
                </Button>
                {/* AI Refine controls moved to floating action inside editor */}
                <div className="hidden" />
              </div>
            </div>
            <Separator className="bg-white/10 mb-3" />
            {isGenerating ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-2/3 bg-white/10" />
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-11/12 bg-white/10" />
                <Skeleton className="h-4 w-5/6 bg-white/10" />
                <Skeleton className="h-64 md:h-[28rem] w-full bg-white/10" />
              </div>
            ) : (
              <>
                <textarea
                  value={markdown}
                  onChange={(e) => {
                    setMarkdown(e.target.value);
                    setShowRefineTip(false);
                  }}
                  ref={editorRef}
                  onSelect={updateSelectionState}
                  onKeyUp={updateSelectionState}
                  onMouseUp={updateSelectionState}
                  className={`flex-1 w-full resize-none min-h-[420px] md:min-h-[620px] bg-transparent text-white/90 placeholder:text-white/40 outline-none pb-16 pr-12 ${
                    flashEditor ? "ring-2 ring-amber-400/70 rounded-md" : ""
                  }`}
                  placeholder="# Your Awesome Project\n\nWrite your README here..."
                />
                {isAnimating && (
                  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                    <div className="flex items-center gap-2 rounded-full bg-black/60 border border-white/10 backdrop-blur px-3 py-1.5 shadow-lg">
                      <Loader2 className="h-3.5 w-3.5 text-white/90 animate-spin" />
                      <span className="text-xs text-white/85" aria-live="polite">{animLabel || "typing…"}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div ref={previewRef} className="relative rounded-2xl bg-black/30 backdrop-blur-2xl border border-white/20 p-4 overflow-auto">
            <div className="flex items-center gap-2 text-white/80 mb-3">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">Preview</span>
            </div>
            <Separator className="bg-white/10 mb-3" />
            {isGenerating ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-1/2 bg-white/10" />
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-10/12 bg-white/10" />
                <Skeleton className="h-4 w-9/12 bg-white/10" />
                <Skeleton className="h-64 md:h-[28rem] w-full bg-white/10" />
              </div>
            ) : (
              <article className="prose prose-invert max-w-none leading-relaxed prose-headings:mt-8 prose-headings:mb-4 prose-p:my-4 prose-ul:my-4 prose-ol:my-4 prose-li:my-1.5 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-pre:my-5 prose-pre:bg-white/5 prose-pre:rounded-lg prose-table:my-6 prose-th:px-3 prose-td:px-3">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  components={markdownComponents}
                >
                  {markdown}
                </ReactMarkdown>
              </article>
            )}
          </div>
        </section>

        {/* Popup when AI Refine clicked without a selection */}
        <Dialog open={showRefineTip} onOpenChange={setShowRefineTip}>
          <DialogContent className="bg-black/60 backdrop-blur-xl border border-white/15">
            <DialogHeader>
              <DialogTitle className="text-white">Select text to refine</DialogTitle>
              <DialogDescription className="text-white/80">
                Highlight some Markdown in the editor, then click <span className="font-medium">AI Refine</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setShowRefineTip(false);
                  setTimeout(() => editorRef.current?.focus(), 0);
                }}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                Got it
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      {/* Error dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="bg-black/70 backdrop-blur-xl border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Something went wrong</DialogTitle>
            <DialogDescription className="text-white/70">
              {error || 'An unexpected error occurred.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button className="bg-white/10 hover:bg-white/20 text-white" onClick={() => setShowErrorDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

        {error && (
          <div className="max-w-3xl mx-auto mt-6 text-center text-sm text-red-400">
            {error}
          </div>
        )}
      </main>

      {/* Copied toast */}
      {copied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-100 backdrop-blur px-4 py-2 text-sm shadow-lg">
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/30 border border-emerald-400/40">
              <Check className="h-3.5 w-3.5 animate-pulse" />
            </span>
            Copied!
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Ambient overlay */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" />

          {/* Floating glow orbs */}
          <div className="absolute w-72 h-72 rounded-full bg-amber-500/20 blur-3xl -top-10 -left-10 animate-pulse" />
          <div className="absolute w-72 h-72 rounded-full bg-purple-500/20 blur-3xl bottom-10 right-10 animate-pulse" />

          {/* Glass card */}
          <div className="relative mx-4 md:mx-0 w-full max-w-md rounded-2xl border border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl overflow-hidden">
            {/* Animated border shimmer */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -inset-[1px] bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.15),transparent)] animate-spin-slow" />
            </div>

            <div className="relative p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/5">
                <Loader2 className="h-6 w-6 text-white/90 animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-white">Analyzing Repository</h3>
              <p className="mt-1 text-sm text-white/70">Reading project structure and drafting a polished README…</p>
              <div className="mt-6 flex items-center gap-2 justify-center text-xs text-white/60">
                <div className="h-1.5 w-1.5 rounded-full bg-white/50 animate-bounce" />
                <div className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:150ms]" />
                <div className="h-1.5 w-1.5 rounded-full bg-white/30 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Token dialog */}
      <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
        <DialogContent className="bg-black/70 backdrop-blur-xl border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Connect GitHub (Private Repos)</DialogTitle>
            <DialogDescription className="text-white/60">
              Provide a GitHub Personal Access Token with read access to the repository. We use it server-side only to fetch your code for analysis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block text-sm text-white/70">Personal Access Token</label>
            <Input
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="ghp_************************************"
              className="bg-black/40 border-white/20 text-white"
            />
            <div className="text-xs text-white/50">
              Create a token at Settings → Developer settings → Personal access tokens. Scope required: repo (read). You can remove it after use.
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" className="text-white/80" onClick={() => setShowTokenDialog(false)}>
                Cancel
              </Button>
              <Button className="bg-white/10 hover:bg-white/20 text-white" onClick={handleSaveToken}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PR created dialog */}
      <Dialog open={showPrDialog} onOpenChange={setShowPrDialog}>
        <DialogContent className="bg-black/70 backdrop-blur-xl border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Pull Request Created</DialogTitle>
            <DialogDescription className="text-white/60">
              Your README changes were pushed to a branch and a PR was opened. You can review and merge it on GitHub.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3">
            <a
              href={prUrl || '#'}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-300 hover:text-emerald-200 underline"
            >
              {prUrl || 'View PR'}
            </a>
          </div>
          <div className="flex justify-end">
            <Button className="bg-white/10 hover:bg-white/20 text-white" onClick={() => setShowPrDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gemini key dialog for AI refine */}
      <Dialog open={showGeminiDialog} onOpenChange={setShowGeminiDialog}>
        <DialogContent className="bg-black/70 backdrop-blur-xl border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Enable AI Refine (Gemini)</DialogTitle>
            <DialogDescription className="text-white/60">
              Enter your personal Gemini API key to refine selected parts of your README on-device. We never store or send your key to our server.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block text-sm text-white/70">Gemini API Key</label>
            <Input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIza********************************"
              className="bg-black/40 border-white/20 text-white"
            />
            <div className="text-xs text-white/50">
              Get a key from Google AI Studio. The key stays in your browser (localStorage) and requests go directly from your device to Gemini.
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" className="text-white/80" onClick={() => setShowGeminiDialog(false)}>
                Cancel
              </Button>
              <Button className="bg-white/10 hover:bg-white/20 text-white" onClick={handleSaveGeminiKey}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sticky scroll-to-bottom button: always visible */}
      <button
        type="button"
        onClick={() => {
          setFollowBottom(true);
          if (editorRef.current) editorRef.current.scrollTop = editorRef.current.scrollHeight;
          if (previewRef.current) previewRef.current.scrollTop = previewRef.current.scrollHeight;
          window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
        }}
        className="fixed bottom-6 right-6 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur text-white shadow-lg"
        title="Scroll to bottom and follow until done"
        aria-label="Scroll to bottom"
      >
        <ChevronsDown className="h-5 w-5" />
      </button>
 
    </div>
  );
}
