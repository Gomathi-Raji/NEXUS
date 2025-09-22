/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import ReactFlow, {
  Node as RFNode,
  Edge as RFEdge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Eye, Copy, Check, Download, Maximize2, Code, FileText, Minimize2, X, Zap } from 'lucide-react';

interface FlowDiagramProps {
  chart: string;
  title?: string;
  editable?: boolean;
  onUpdate?: (newChart: string) => void;
  prompt?: string | null;
}

interface ParsedNode {
  id: string;
  label: string;
  layer?: number; // derived from mermaid subgraphs to improve readability
}

interface ParsedEdge {
  source: string;
  target: string;
  label?: string;
}

type NodeData = {
  label: string;
  layer?: number;
};

const FlowDiagramInner = ({
  chart,
  title,
  editable = false,
  onUpdate,
  prompt
}: FlowDiagramProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editableChart, setEditableChart] = useState(chart);
  const [copied, setCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [density, setDensity] = useState<'compact' | 'cozy' | 'spacious'>('cozy');
  const [direction, setDirection] = useState<'TB' | 'LR'>('TB');
  const [animateEdges, setAnimateEdges] = useState(true);
  const [showDensityMenu, setShowDensityMenu] = useState(false);
  const [showFlowMenu, setShowFlowMenu] = useState(false);
  const { getNodes, getEdges, getViewport } = useReactFlow();
  const downloadRef = useRef<HTMLDivElement>(null);
  const densityRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);

  const parseMermaidToFlow = React.useCallback((mermaidText: string) => {
    const lines = mermaidText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const parsedNodes: ParsedNode[] = [];
    const parsedEdges: ParsedEdge[] = [];
    const nodeSet = new Set<string>();
    const nodeLayer = new Map<string, number>();
    const layerStack: number[] = [];
    let layerCounter = -1;

    for (const line of lines) {
      // manage subgraph blocks to infer visual layers
      if (/^subgraph\b/i.test(line)) {
        layerCounter += 1;
        layerStack.push(layerCounter);
        continue;
      }
      if (/^end\b/i.test(line)) {
        layerStack.pop();
        continue;
      }
      if (/^(graph|flowchart|style)\b/i.test(line)) {
        continue;
      }

      // Support mermaid connection with optional label: A --|label|--> B, A --> B, A -- B, A --- B, A -.-> B
      const connectionMatch = line.match(/^(.+?)\s*-(?:-|\.)>\s*(.+)$|^(.+?)\s*--\s*(?:\|([^|]+)\|\s*)?>\s*(.+)$/);
      if (connectionMatch) {
        // Two patterns: 1) group1->group2 simple  2) group3 --|label|> group5
        const simpleTarget = connectionMatch[2];
        const sourceSimple = connectionMatch[1];
        const labeledSource = connectionMatch[3];
        const betweenLabel = connectionMatch[4];
        const labeledTarget = connectionMatch[5];

        const srcRaw = labeledSource || sourceSimple || '';
        const tgtRaw = labeledTarget || simpleTarget || '';
        const label = (betweenLabel || '').trim() || (line.includes(':') ? line.split(':').slice(1).join(':').trim() : undefined);
        
        const extractNode = (nodeStr: string) => {
          const s = nodeStr.trim();
          // id is token up to first bracket/space
          const idMatch = s.match(/^([A-Za-z0-9_.-]+)/);
          const id = idMatch ? idMatch[1] : s;
          // Support [label], (label), {label}, ((label))
          const box = s.match(/\[([^\]]+)\]/);
          const round = s.match(/\(([^)]+)\)/);
          const curly = s.match(/\{([^}]+)\}/);
          const nodeLabel = (box?.[1] || curly?.[1] || round?.[1] || '').trim();
          return { id, label: nodeLabel || id };
        };

        const sourceNode = extractNode(srcRaw);
        const targetNode = extractNode(tgtRaw);

        if (!nodeSet.has(sourceNode.id)) {
          parsedNodes.push({ ...sourceNode, layer: layerStack.length ? layerStack[layerStack.length-1] : undefined });
          nodeSet.add(sourceNode.id);
          if (layerStack.length) nodeLayer.set(sourceNode.id, layerStack[layerStack.length-1]);
        }
        if (!nodeSet.has(targetNode.id)) {
          parsedNodes.push({ ...targetNode, layer: layerStack.length ? layerStack[layerStack.length-1] : undefined });
          nodeSet.add(targetNode.id);
          if (layerStack.length) nodeLayer.set(targetNode.id, layerStack[layerStack.length-1]);
        }

        parsedEdges.push({
          source: sourceNode.id,
          target: targetNode.id,
          label: label || undefined
        });
      }

      const standaloneMatch = line.match(/^([A-Za-z0-9_.-]+)(?:\[([^\]]+)\])?$/);
      if (standaloneMatch && !line.includes('-->') && !line.includes('--')) {
        const [, id, nodeLabel] = standaloneMatch;
        if (!nodeSet.has(id)) {
          const lyr = layerStack.length ? layerStack[layerStack.length-1] : undefined;
          parsedNodes.push({ id, label: nodeLabel || id, layer: lyr });
          nodeSet.add(id);
          if (lyr !== undefined) nodeLayer.set(id, lyr);
        }
      }
    }

    // Filter isolated nodes (no degree) to reduce noise
    const degree = new Map<string, number>();
    for (const n of parsedNodes) degree.set(n.id, 0);
    for (const e of parsedEdges) {
      degree.set(e.source, (degree.get(e.source) || 0) + 1);
      degree.set(e.target, (degree.get(e.target) || 0) + 1);
    }
    const filteredNodes = parsedNodes.filter(n => (degree.get(n.id) || 0) > 0);
    const validSet = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = parsedEdges.filter(e => validSet.has(e.source) && validSet.has(e.target));

    return { nodes: filteredNodes, edges: filteredEdges };
  }, []);

  // Compute a layered layout using a simple topological algorithm
  const layoutElements = React.useCallback((baseNodes: RFNode[], baseEdges: RFEdge[]) => {
    const levelGap = density === 'compact' ? 110 : density === 'spacious' ? 240 : 180;
    const nodeGap = density === 'compact' ? 150 : density === 'spacious' ? 280 : 210;

    const idToIndex = new Map<string, number>();
    baseNodes.forEach((n, i) => idToIndex.set(n.id, i));

    // Build indegree map
    const indeg = new Map<string, number>();
    baseNodes.forEach((n) => indeg.set(n.id, 0));
    baseEdges.forEach((e) => indeg.set(e.target, (indeg.get(e.target) || 0) + 1));

    // Prefer explicit layers (from subgraphs) if present
    const anyLayer = baseNodes.some((n) => (n.data as NodeData | undefined)?.layer !== undefined);
    if (anyLayer) {
      // Collect by layer index found on our parsed nodes (attached later below when creating baseNodes)
      const byLayer = new Map<number, string[]>();
      baseNodes.forEach((n) => {
        const lyr = (n.data as NodeData | undefined)?.layer;
        const id = n.id;
        const key = typeof lyr === 'number' ? lyr : 0;
        if (!byLayer.has(key)) byLayer.set(key, []);
        byLayer.get(key)!.push(id);
      });
      const sortedLayers = Array.from(byLayer.keys()).sort((a,b)=>a-b);
      const posNodes = baseNodes.map(n => ({ ...n }));
      sortedLayers.forEach((layerIdx, idx) => {
        const layer = byLayer.get(layerIdx)!;
        layer.sort();
        layer.forEach((id, i) => {
          const nodeIndex = idToIndex.get(id)!;
          const xLR = idx * levelGap;
          const yLR = i * nodeGap;
          const xTB = i * nodeGap;
          const yTB = idx * levelGap;
          posNodes[nodeIndex].position = direction === 'LR' ? { x: xLR, y: yLR } : { x: xTB, y: yTB };
        });
      });
      return posNodes;
    }

    // Kahn's algorithm for levels
    const queue: string[] = [];
    indeg.forEach((v, k) => { if (v === 0) queue.push(k); });
    const levels: string[][] = [];
    const remainingEdges = baseEdges.map(e => ({ ...e }));

    const outgoing = new Map<string, string[]>();
    baseEdges.forEach(e => {
      if (!outgoing.has(e.source)) outgoing.set(e.source, []);
      outgoing.get(e.source)!.push(e.target);
    });

    const placed = new Set<string>();
    while (queue.length) {
      const layer: string[] = [];
      const size = queue.length;
      for (let i = 0; i < size; i++) {
        const id = queue.shift()!;
        if (placed.has(id)) continue;
        placed.add(id);
        layer.push(id);
        for (const t of outgoing.get(id) || []) {
          indeg.set(t, (indeg.get(t) || 0) - 1);
          if ((indeg.get(t) || 0) === 0) queue.push(t);
        }
      }
      if (layer.length) levels.push(layer);
      if (levels.length > 200) break; // guard
    }

    // Fallback if cycle: keep previous positions but spread
    if (placed.size !== baseNodes.length) {
      return baseNodes.map((n, i) => ({
        ...n,
        position: { x: (i % 6) * nodeGap, y: Math.floor(i / 6) * levelGap }
      }));
    }

    // Assign positions per level
    const posNodes = baseNodes.map(n => ({ ...n }));
    levels.forEach((layer, layerIdx) => {
      const count = layer.length;
      layer.sort();
      layer.forEach((id, i) => {
        const idx = idToIndex.get(id)!;
        const xLR = layerIdx * levelGap;
        const yLR = i * nodeGap;
        const xTB = i * nodeGap;
        const yTB = layerIdx * levelGap;
        posNodes[idx].position = direction === 'LR' ? { x: xLR, y: yLR } : { x: xTB, y: yTB };
      });
    });

    return posNodes;
  }, [density, direction]);

  const createFlowElements = React.useCallback((parsedNodes: ParsedNode[], parsedEdges: ParsedEdge[]) => {
    const baseNodes: RFNode<NodeData>[] = parsedNodes.map((node) => ({
      id: node.id,
      type: 'default',
      position: { x: 0, y: 0 },
      data: { label: node.label, ...(node.layer !== undefined ? { layer: node.layer } : {}) },
      style: {
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(20px) saturate(200%)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        padding: '12px 16px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        minWidth: '140px',
        minHeight: '40px',
        textAlign: 'center',
        transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
    }));

    const baseEdges: RFEdge[] = parsedEdges.map((edge, index) => ({
      id: `edge-${index}`,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: 'smoothstep',
      style: { 
        stroke: 'rgba(255, 255, 255, 0.4)',
        strokeWidth: 2,
        strokeDasharray: edge.label ? undefined : '6,4',
        filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.2))',
      },
      labelStyle: { 
        fill: '#e8eaed', 
        fontSize: '11px',
        fontWeight: '500',
      },
      labelBgStyle: {
        fill: 'rgba(0, 0, 0, 0.7)',
        fillOpacity: 1,
        rx: 8,
        ry: 8,
        stroke: 'rgba(255, 255, 255, 0.1)',
        strokeWidth: 1,
        backdropFilter: 'blur(20px)'
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 'rgba(255, 255, 255, 0.5)',
        width: 18,
        height: 18
      },
      animated: animateEdges && !edge.label
    }));

    const flowNodes = layoutElements(baseNodes, baseEdges);
    return { nodes: flowNodes, edges: baseEdges };
  }, [animateEdges, density, direction, layoutElements]);

  useEffect(() => {
    try {
      const { nodes: parsedNodes, edges: parsedEdges } = parseMermaidToFlow(editableChart);
      const { nodes: flowNodes, edges: flowEdges } = createFlowElements(parsedNodes, parsedEdges);
      
      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error('Error parsing diagram:', error);
    }
  }, [editableChart, density, direction, animateEdges, createFlowElements, parseMermaidToFlow, setNodes, setEdges]);

  useEffect(() => {
    if (chart !== editableChart) {
      setEditableChart(chart);
    }
  }, [chart, editableChart]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleSave = () => {
    onUpdate?.(editableChart);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditableChart(chart);
    setIsEditing(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editableChart);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadImage = useCallback(async () => {
    if (!downloadRef.current) return;
    
    setDownloading(true);
    
    try {
      const dataUrl = await toPng(downloadRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#0a0a0c',
        // Filter out <style> tags to avoid oklab/oklch serialization issues
        filter: (node) => {
          return !(node instanceof Element && node.tagName === 'STYLE');
        },
      });

      const link = document.createElement('a');
      link.download = `${title || 'architecture-diagram'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error downloading image:', error);
    } finally {
      setDownloading(false);
    }
  }, [title]);

  const copyPromptToClipboard = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Toggle a body class so the global layout/header can react to fullscreen state
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const cls = 'visualize-fullscreen';
      if (isFullscreen) {
        document.body.classList.add(cls);
      } else {
        document.body.classList.remove(cls);
      }
      return () => {
        document.body.classList.remove(cls);
      };
    }
  }, [isFullscreen]);

  // Close dropdowns on outside click or ESC
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = (e.target as unknown) as Element | null;
      if (t) {
        if (densityRef.current && !densityRef.current.contains(t)) setShowDensityMenu(false);
        if (flowRef.current && !flowRef.current.contains(t)) setShowFlowMenu(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowDensityMenu(false); setShowFlowMenu(false); }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Fullscreen overlay
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-gray-900/10 to-black/20" />
        
        {/* Fullscreen Header */}
        <div className="relative z-10 flex items-center justify-between p-6 border-b border-white/10 backdrop-blur-2xl bg-black/20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
              <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse delay-75"></div>
              <div className="w-1 h-1 bg-white/40 rounded-full animate-pulse delay-150"></div>
            </div>
            <h2 className="text-xl font-medium text-white/90 tracking-wide">
              {title || 'Architecture Diagram'}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Density selector (custom dropdown) */}
            <div ref={densityRef} className="hidden md:flex items-center gap-2 mr-2 relative">
              <span className="text-white/60 text-xs">Density</span>
              <button
                onClick={() => { setShowDensityMenu((v)=>!v); setShowFlowMenu(false); }}
                className="flex items-center gap-2 bg-black/40 border border-white/20 text-white/80 text-xs rounded-lg px-3 py-2 hover:bg-black/50 hover:border-white/30 transition-all"
              >
                {density === 'compact' && 'Compact'}
                {density === 'cozy' && 'Cozy'}
                {density === 'spacious' && (
                  <span className="inline-flex items-center gap-1">
                    Spacious
                    <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-pink-500/40 border border-white/20 text-white/90 shadow-[0_0_15px_rgba(168,85,247,0.35)]">
                      <Zap className="w-3 h-3" /> Crazy
                    </span>
                  </span>
                )}
              </button>
              {showDensityMenu && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-black/70 backdrop-blur-2xl border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-1">
                    <button
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${density==='compact' ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10'}`}
                      onClick={() => { setDensity('compact'); setShowDensityMenu(false); }}
                    >
                      Compact — tighter spacing
                    </button>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all mt-1 ${density==='cozy' ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10'}`}
                      onClick={() => { setDensity('cozy'); setShowDensityMenu(false); }}
                    >
                      Cozy — balanced spacing
                    </button>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all mt-1 group relative ${density==='spacious' ? 'bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-white border border-white/10' : 'text-white/90 hover:bg-white/10'}`}
                      onClick={() => { setDensity('spacious'); setShowDensityMenu(false); }}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500/30 to-pink-500/30 border border-white/20 shadow-inner">
                          <Zap className="w-3.5 h-3.5" />
                        </span>
                        <span>
                          <span className="font-semibold">Spacious</span> — go big
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Direction toggle (custom dropdown) */}
            <div ref={flowRef} className="hidden md:flex items-center gap-2 mr-2 relative">
              <span className="text-white/60 text-xs">Flow</span>
              <button
                onClick={() => { setShowFlowMenu((v)=>!v); setShowDensityMenu(false); }}
                className="flex items-center gap-2 bg-black/40 border border-white/20 text-white/80 text-xs rounded-lg px-3 py-2 hover:bg-black/50 hover:border-white/30 transition-all"
              >
                {direction === 'TB' ? 'Top-Bottom' : 'Left-Right'}
              </button>
              {showFlowMenu && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-black/70 backdrop-blur-2xl border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-1">
                    <button
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${direction==='TB' ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10'}`}
                      onClick={() => { setDirection('TB'); setShowFlowMenu(false); }}
                    >
                      Top-Bottom
                    </button>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all mt-1 ${direction==='LR' ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10'}`}
                      onClick={() => { setDirection('LR'); setShowFlowMenu(false); }}
                    >
                      Left-Right
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Edge animation toggle */}
            <div className="hidden md:flex items-center gap-2 mr-2">
              <label htmlFor="animate-edges" className="text-white/60 text-xs">Animate</label>
              <input id="animate-edges" aria-label="Toggle animated edges" type="checkbox" checked={animateEdges} onChange={(e)=>setAnimateEdges(e.target.checked)} />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadImage}
              disabled={downloading}
              className="h-10 px-4 bg-black/30 border border-white/20 text-white/80 hover:bg-black/40 hover:border-white/30 transition-all duration-300 backdrop-blur-xl rounded-xl shadow-lg hover:text-white"
            >
              {downloading ? (
                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="h-10 px-4 bg-black/30 border border-white/20 text-white/80 hover:bg-black/40 hover:border-white/30 transition-all duration-300 backdrop-blur-xl rounded-xl shadow-lg hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Fullscreen Content */}
        <div 
          ref={downloadRef}
          className="relative flex-1 h-[calc(100vh-88px)] bg-gradient-to-br from-black/50 via-gray-900/30 to-black/50 backdrop-blur-2xl"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            className="bg-transparent"
            proOptions={{ hideAttribution: true }}
            fitViewOptions={{
              padding: 0.2,
              includeHiddenNodes: false,
              maxZoom: 2,
              minZoom: 0.1,
            }}
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
            panOnDrag={true}
            zoomOnScroll={true}
            zoomOnPinch={true}
            zoomOnDoubleClick={false}
          >
            <Controls 
              className="!bg-white/[0.03] !border-white/10 backdrop-blur-2xl !shadow-2xl [&>button]:!bg-white/[0.05] [&>button]:!border-white/10 [&>button]:!text-white/80 [&>button:hover]:!bg-white/[0.08] [&>button:hover]:!border-white/20 [&>button]:!transition-all [&>button]:!duration-300 !rounded-2xl !m-6 hover:!shadow-indigo-500/10"
              showZoom={true}
              showFitView={true}
              showInteractive={false}
            />
            <MiniMap 
              className="!bg-black/60 !border-white/30 backdrop-blur-2xl !rounded-xl !shadow-2xl !m-6"
              maskColor="rgba(0, 0, 0, 0.8)"
              nodeColor="rgba(255, 255, 255, 0.2)"
              nodeStrokeColor="rgba(255, 255, 255, 0.4)"
              nodeBorderRadius={12}
              nodeStrokeWidth={1}
              pannable={true}
              zoomable={true}
            />
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={30} 
              size={1.5} 
              color="rgba(255, 255, 255, 0.1)" 
              className="opacity-30"
            />
          </ReactFlow>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Main Container */}
      <div className="relative overflow-hidden rounded-2xl bg-black/20 backdrop-blur-2xl border border-white/20 shadow-2xl shadow-black/20">
        {/* Ambient background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-gray-800/5 to-black/10 pointer-events-none" />
        
        {/* Header */}
        <div className="relative p-6 border-b border-white/10 backdrop-blur-2xl bg-black/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Title Section */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-white/60 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse delay-75"></div>
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse delay-150"></div>
              </div>
              <h2 className="text-lg sm:text-xl font-medium text-white/90 tracking-wide">
                {title || 'Repository Architecture'}
              </h2>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {prompt && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyPromptToClipboard}
                  className="h-10 px-4 bg-black/30 border border-white/20 text-white/70 hover:bg-black/40 hover:border-white/30 transition-all duration-300 backdrop-blur-xl rounded-xl text-sm font-medium shadow-lg hover:text-white/90"
                >
                  {promptCopied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Prompt</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-10 px-4 bg-black/30 border border-white/20 text-white/70 hover:bg-black/40 hover:border-white/30 transition-all duration-300 backdrop-blur-xl rounded-xl text-sm font-medium shadow-lg hover:text-white/90"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Code className="w-4 h-4" />
                )}
                <span className="ml-2 hidden sm:inline">Code</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadImage}
                disabled={downloading}
                className="h-10 px-4 bg-black/30 border border-white/20 text-white/70 hover:bg-black/40 hover:border-white/30 transition-all duration-300 backdrop-blur-xl rounded-xl text-sm font-medium shadow-lg hover:text-white/90 disabled:opacity-50"
              >
                {downloading ? (
                  <div className="w-4 h-4 border-2 border-white/50 border-t-indigo-400 rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span className="ml-2 hidden sm:inline">Save</span>
              </Button>
              {editable && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="h-10 px-4 bg-black/30 border border-white/20 text-white/70 hover:bg-black/40 hover:border-white/30 transition-all duration-300 backdrop-blur-xl rounded-xl text-sm font-medium shadow-lg hover:text-white/90"
                >
                  {isEditing ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <Edit className="w-4 h-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">{isEditing ? 'Preview' : 'Edit'}</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative p-6">
          {isEditing ? (
            <div className="space-y-6">
              <div className="relative">
                <textarea
                  value={editableChart}
                  onChange={(e) => setEditableChart(e.target.value)}
                  className="w-full h-64 sm:h-80 p-6 bg-black/20 border border-white/20 rounded-2xl text-white/90 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/40 transition-all duration-300 backdrop-blur-2xl placeholder:text-white/40 shadow-inner"
                  placeholder={`Enter Mermaid diagram syntax...

Example:
graph TD
    A[Client] --> B[Load Balancer]
    B --> C[Server 1]
    B --> D[Server 2]
    C --> E[Database]
    D --> E`}
                />
                <div className="absolute top-4 right-4 text-xs text-white/50 bg-black/30 px-3 py-1.5 rounded-xl backdrop-blur-xl border border-white/20 font-medium">
                 
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSave}
                  size="sm"
                  className="bg-gradient-to-r from-gray-600/80 to-gray-700/80 hover:from-gray-600/90 hover:to-gray-700/90 text-white font-medium px-8 py-3 transition-all duration-300 rounded-xl border-0 shadow-lg"
                >
                  Save Changes
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="ghost"
                  size="sm"
                  className="bg-black/30 border border-white/20 text-white/70 hover:bg-black/40 hover:border-white/30 transition-all duration-300 backdrop-blur-xl font-medium px-8 py-3 rounded-xl hover:text-white/90 shadow-lg"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div 
              ref={downloadRef}
              className="w-full h-[400px] sm:h-[500px] lg:h-[600px] bg-black/10 rounded-2xl border border-white/20 overflow-hidden shadow-2xl relative backdrop-blur-2xl"
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                className="bg-transparent"
                proOptions={{ hideAttribution: true }}
                fitViewOptions={{
                  padding: 0.2,
                  includeHiddenNodes: false,
                  maxZoom: 1.2,
                  minZoom: 0.4,
                }}
                nodesDraggable={true}
                nodesConnectable={true}
                elementsSelectable={true}
                panOnDrag={true}
                zoomOnScroll={true}
                zoomOnPinch={true}
                zoomOnDoubleClick={false}
              >
                <Controls 
                  className="!bg-white/10 !border-white/40 backdrop-blur-2xl !shadow-2xl [&>button]:!bg-white/20 [&>button]:!border-white/50 [&>button]:!text-white [&>button:hover]:!bg-white/30 [&>button:hover]:!border-white/60 [&>button:hover]:!text-white [&>button]:!transition-all [&>button]:!duration-300 !rounded-2xl !m-6 [&>button]:!shadow-2xl [&>button]:!w-12 [&>button]:!h-12 [&>button]:!text-lg [&>button]:!font-bold"
                  showZoom={true}
                  showFitView={true}
                  showInteractive={false}
                />
                <MiniMap 
                  className="!bg-white/5 !border-white/30 backdrop-blur-2xl !rounded-2xl !shadow-2xl !m-6 !w-48 !h-32"
                  maskColor="rgba(0, 0, 0, 0.8)"
                  nodeColor="rgba(255, 255, 255, 0.4)"
                  nodeStrokeColor="rgba(255, 255, 255, 0.6)"
                  nodeBorderRadius={8}
                  nodeStrokeWidth={2}
                  pannable={true}
                  zoomable={true}
                />
                <Background 
                  variant={BackgroundVariant.Dots} 
                  gap={30} 
                  size={1.5} 
                  color="rgba(255, 255, 255, 0.1)" 
                  className="opacity-30"
                />
                <Panel position="top-right" className="m-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="h-12 w-12 p-0 bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 hover:border-white/70 hover:text-white transition-all duration-300 backdrop-blur-xl rounded-2xl shadow-2xl hover:shadow-white/20 hover:scale-105"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </Panel>
              </ReactFlow>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function FlowDiagram(props: FlowDiagramProps) {
  return (
    <ReactFlowProvider>
      <FlowDiagramInner {...props} />
    </ReactFlowProvider>
  );
}