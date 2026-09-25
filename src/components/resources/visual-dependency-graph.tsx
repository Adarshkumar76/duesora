"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  GitFork,
  AlertTriangle,
  Globe,
  CreditCard,
  Cloud,
  ShieldCheck,
  Server,
  Code,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  Flame,
  ArrowRight,
  ExternalLink,
  X,
  Layers,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GraphNode, WorkspaceDependencyGraph } from "@/lib/resources/dependencies";

interface VisualDependencyGraphProps {
  initialGraph: WorkspaceDependencyGraph;
  workspaceId?: string;
  focusedResourceId?: string;
  height?: number | string;
  isCompact?: boolean;
}

interface PositionedNode extends GraphNode {
  x: number;
  y: number;
  layer: number;
}

export function VisualDependencyGraph({
  initialGraph,
  workspaceId: _workspaceId,
  focusedResourceId,
  height = 650,
  isCompact = false,
}: VisualDependencyGraphProps) {
  const [graph] = useState<WorkspaceDependencyGraph>(initialGraph);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(focusedResourceId || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [onlySPOF, setOnlySPOF] = useState(false);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync focusedResourceId if provided as prop
  useEffect(() => {
    if (focusedResourceId) {
      setSelectedNodeId(focusedResourceId);
    }
  }, [focusedResourceId]);

  // Filter nodes according to search, type, and SPOF toggles
  const filteredNodes = useMemo(() => {
    return graph.nodes.filter((node) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = node.name.toLowerCase().includes(q);
        const matchesProvider = node.provider?.toLowerCase().includes(q);
        if (!matchesName && !matchesProvider) return false;
      }
      if (typeFilter !== "all" && node.type !== typeFilter) {
        return false;
      }
      if (onlySPOF && !node.isCriticalSPOF) {
        return false;
      }
      return true;
    });
  }, [graph.nodes, searchQuery, typeFilter, onlySPOF]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  // Edges filtered to only visible nodes
  const filteredEdges = useMemo(() => {
    return graph.edges.filter(
      (edge) => filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
    );
  }, [graph.edges, filteredNodeIds]);

  // Selected node and blast radius data
  const selectedNode = useMemo(
    () => graph.nodes.find((n) => n.id === selectedNodeId) || null,
    [graph.nodes, selectedNodeId]
  );

  const downstreamImpactedSet = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    return new Set(selectedNode.downstreamNodeIds);
  }, [selectedNode]);

  const upstreamPrereqSet = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    return new Set(selectedNode.upstreamNodeIds);
  }, [selectedNode]);

  // Calculate coordinates for nodes using a topological multi-layer horizontal DAG layout
  const { positionedNodes } = useMemo(() => {
    if (filteredNodes.length === 0) {
      return { positionedNodes: [] };
    }

    const layerSpacingX = 340;
    const rowSpacingY = 140;

    // Build degree maps
    const inDegree = new Map<string, number>();
    const outEdges = new Map<string, string[]>(); // target -> list of sources (providers -> dependents)

    for (const n of filteredNodes) {
      inDegree.set(n.id, 0);
      outEdges.set(n.id, []);
    }

    for (const e of filteredEdges) {
      outEdges.get(e.target)?.push(e.source);
      inDegree.set(e.source, (inDegree.get(e.source) || 0) + 1);
    }

    // Assign layers (Root prerequisites on left layer 0, dependent consumers further right)
    const layers = new Map<string, number>();
    const queue: string[] = [];

    // Roots: inDegree === 0 (depend on nothing, e.g. root DNS, cloud accounts)
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) {
        layers.set(id, 0);
        queue.push(id);
      }
    }

    // Topological assignment with cycle safeguard
    const visited = new Set<string>(queue);
    while (queue.length > 0) {
      const u = queue.shift()!;
      const currentLayer = layers.get(u) || 0;
      const neighbors = outEdges.get(u) || [];

      for (const v of neighbors) {
        const prevLayer = layers.get(v) || 0;
        const newLayer = Math.max(prevLayer, currentLayer + 1);
        layers.set(v, newLayer);

        if (!visited.has(v)) {
          visited.add(v);
          queue.push(v);
        }
      }
    }

    // Group nodes by layer
    const nodesByLayer = new Map<number, GraphNode[]>();
    for (const node of filteredNodes) {
      const l = layers.get(node.id) || 0;
      if (!nodesByLayer.has(l)) {
        nodesByLayer.set(l, []);
      }
      nodesByLayer.get(l)!.push(node);
    }

    // Calculate positions
    const result: PositionedNode[] = [];
    nodesByLayer.forEach((nodesInLayer, layerIndex) => {
      nodesInLayer.forEach((node, rowIndex) => {
        const x = 60 + layerIndex * layerSpacingX;
        const y = 60 + rowIndex * rowSpacingY;
        result.push({
          ...node,
          x,
          y,
          layer: layerIndex,
        });
      });
    });

    return {
      positionedNodes: result,
    };
  }, [filteredNodes, filteredEdges]);

  // Fast coordinate lookup map
  const nodePositionMap = useMemo(() => {
    const map = new Map<string, PositionedNode>();
    for (const p of positionedNodes) {
      map.set(p.id, p);
    }
    return map;
  }, [positionedNodes]);

  // Pan and Zoom handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan on left click background
    if ((e.target as HTMLElement).tagName === "svg" || (e.target as HTMLElement).id === "graph-canvas") {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(2.5, z + 0.15));
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, z - 0.15));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNodeId(null);
  };

  // Helper for type icons
  function getNodeTypeIcon(type: string) {
    switch (type) {
      case "domain":
        return <Globe className="w-3.5 h-3.5 text-blue-500" />;
      case "subscription":
        return <CreditCard className="w-3.5 h-3.5 text-emerald-500" />;
      case "cloud_service":
        return <Cloud className="w-3.5 h-3.5 text-sky-500" />;
      case "ssl_certificate":
        return <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />;
      case "hosting":
        return <Server className="w-3.5 h-3.5 text-orange-500" />;
      default:
        return <Code className="w-3.5 h-3.5 text-purple-500" />;
    }
  }

  // Calculate annual cost at risk for selected node's blast radius
  const selectedNodeCostAtRisk = useMemo(() => {
    if (!selectedNode) return 0;
    return selectedNode.downstreamNodeIds.reduce((sum, depId) => {
      const dep = graph.nodes.find((n) => n.id === depId);
      if (!dep || !dep.cost) return sum;
      const mult = dep.billingCycle === "monthly" ? 12 : dep.billingCycle === "quarterly" ? 4 : 1;
      return sum + dep.cost * mult;
    }, 0);
  }, [selectedNode, graph.nodes]);

  return (
    <div className="flex flex-col rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs relative">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 border-b border-border/60 bg-muted/20 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>Interactive Dependency Network</span>
              {selectedNode && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-[11px] animate-pulse">
                  <Flame className="w-3 h-3" />
                  <span>Simulating Failure: {selectedNode.name}</span>
                </Badge>
              )}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Click any node to simulate outage & inspect downstream cascade blast radius.
            </p>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative w-44 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search resource..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs rounded-xl bg-background border-border/70"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 px-2.5 text-xs rounded-xl bg-background border border-border/70 text-foreground focus:outline-hidden"
          >
            <option value="all">All Types</option>
            <option value="domain">Domains</option>
            <option value="cloud_service">Cloud Services</option>
            <option value="subscription">Subscriptions</option>
            <option value="ssl_certificate">Certificates</option>
            <option value="hosting">Hosting</option>
          </select>

          {/* SPOF Toggle */}
          <Button
            type="button"
            variant={onlySPOF ? "default" : "outline"}
            size="sm"
            onClick={() => setOnlySPOF(!onlySPOF)}
            className={`h-8 rounded-xl text-xs gap-1.5 font-medium cursor-pointer ${
              onlySPOF ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">High-Risk SPOFs</span>
          </Button>

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5 border border-border/70 rounded-xl bg-background p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleResetView}
              className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ height }}
        className={`w-full bg-slate-900/5 dark:bg-slate-950/40 relative overflow-hidden select-none ${
          isPanning ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {/* Subtle grid pattern background */}
        <svg
          id="graph-canvas"
          width="100%"
          height="100%"
          className="absolute inset-0"
        >
          <defs>
            <pattern id="grid-dots" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" className="fill-border/60" />
            </pattern>
            {/* Arrowhead marker for normal directed edges */}
            <marker
              id="arrow-default"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" className="fill-muted-foreground/50" />
            </marker>
            {/* Arrowhead marker for blast radius active cascade */}
            <marker
              id="arrow-blast"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" className="fill-amber-500" />
            </marker>
            {/* Arrowhead marker for upstream dependency */}
            <marker
              id="arrow-upstream"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" className="fill-purple-500" />
            </marker>
          </defs>

          {/* Grid background */}
          <rect width="100%" height="100%" fill="url(#grid-dots)" />

          {/* Transformed graph group */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Render Directed Edges */}
            {filteredEdges.map((edge) => {
              const sourceNode = nodePositionMap.get(edge.source);
              const targetNode = nodePositionMap.get(edge.target);
              if (!sourceNode || !targetNode) return null;

              // target is upstream prerequisite, source is dependent consumer
              // We draw arrow from prerequisite (target) -> dependent (source) to indicate dependency impact flow
              const startX = targetNode.x + 220; // right side of target
              const startY = targetNode.y + 45;
              const endX = sourceNode.x; // left side of source
              const endY = sourceNode.y + 45;

              const isBlastImpact =
                selectedNode &&
                (selectedNode.id === targetNode.id || downstreamImpactedSet.has(targetNode.id)) &&
                downstreamImpactedSet.has(sourceNode.id);

              const isUpstreamTrace =
                selectedNode &&
                selectedNode.id === sourceNode.id &&
                upstreamPrereqSet.has(targetNode.id);

              const isDimmed =
                selectedNode && !isBlastImpact && !isUpstreamTrace;

              // Cubic bezier curve path
              const dx = Math.abs(endX - startX) * 0.5;
              const pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

              return (
                <g key={edge.id} className="transition-opacity duration-300">
                  <path
                    d={pathData}
                    fill="none"
                    stroke={
                      isBlastImpact
                        ? "#F59E0B"
                        : isUpstreamTrace
                        ? "#A855F7"
                        : "currentColor"
                    }
                    strokeWidth={isBlastImpact || isUpstreamTrace ? 2.5 : 1.5}
                    strokeDasharray={isBlastImpact ? "4 2" : undefined}
                    className={`${
                      isBlastImpact
                        ? "animate-pulse"
                        : isDimmed
                        ? "text-border/40 opacity-20"
                        : "text-border/80 dark:text-border"
                    }`}
                    markerEnd={
                      isBlastImpact
                        ? "url(#arrow-blast)"
                        : isUpstreamTrace
                        ? "url(#arrow-upstream)"
                        : "url(#arrow-default)"
                    }
                  />
                  {isBlastImpact && (
                    <circle r="3.5" fill="#F59E0B">
                      <animateMotion dur="2.2s" repeatCount="indefinite" path={pathData} />
                    </circle>
                  )}
                  {isUpstreamTrace && (
                    <circle r="3" fill="#A855F7">
                      <animateMotion dur="2.6s" repeatCount="indefinite" path={pathData} />
                    </circle>
                  )}
                  {edge.notes && (
                    <text
                      x={(startX + endX) / 2}
                      y={(startY + endY) / 2 - 8}
                      textAnchor="middle"
                      className="text-[9px] fill-muted-foreground font-mono"
                    >
                      {edge.notes}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Render Node Cards as SVG foreignObject */}
            {positionedNodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isImpactedDownstream = downstreamImpactedSet.has(node.id);
              const isUpstreamPrereq = upstreamPrereqSet.has(node.id);
              const isDimmed =
                selectedNode && !isSelected && !isImpactedDownstream && !isUpstreamPrereq;

              return (
                <foreignObject
                  key={node.id}
                  x={node.x}
                  y={node.y}
                  width={220}
                  height={96}
                  className="overflow-visible"
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(isSelected ? null : node.id);
                    }}
                    className={`group w-[220px] h-[92px] p-2.5 rounded-xl border transition-all duration-200 cursor-pointer relative shadow-xs ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500 ring-4 ring-amber-500/20 shadow-md"
                        : isImpactedDownstream
                        ? "bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/70 ring-2 ring-amber-500/20"
                        : isUpstreamPrereq
                        ? "bg-purple-500/5 dark:bg-purple-950/20 border-purple-500/70 ring-2 ring-purple-500/20"
                        : isDimmed
                        ? "opacity-25 bg-card border-border/40"
                        : "bg-card hover:bg-card/90 border-border hover:border-primary/60 hover:shadow-sm"
                    }`}
                  >
                    {/* Top Row: Type Icon & Name & SPOF Badge */}
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-5 h-5 rounded-md bg-muted/60 flex items-center justify-center shrink-0">
                          {getNodeTypeIcon(node.type)}
                        </div>
                        <span className="text-xs font-bold text-foreground truncate" title={node.name}>
                          {node.name}
                        </span>
                      </div>

                      {node.isCriticalSPOF && (
                        <span
                          title="Critical Single Point of Failure: 2+ downstream services depend on this"
                          className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0 flex items-center gap-0.5"
                        >
                          <Flame className="w-2.5 h-2.5" />
                          <span>SPOF</span>
                        </span>
                      )}
                    </div>

                    {/* Middle Row: Provider & Cost */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                      <span className="truncate max-w-[110px]">
                        {node.provider || node.type.replace("_", " ")}
                      </span>
                      <span className="font-semibold text-foreground">
                        {node.cost !== null ? `${node.currency} ${node.cost.toLocaleString()}` : "Free"}
                      </span>
                    </div>

                    {/* Bottom Row: Blast Radius Indicator & Status Badge */}
                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px]">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <GitFork className="w-3 h-3 text-purple-500" />
                        <span
                          className={
                            node.totalBlastRadiusCount > 0
                              ? "font-semibold text-amber-600 dark:text-amber-400"
                              : ""
                          }
                        >
                          {node.totalBlastRadiusCount} blast
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            node.status === "active"
                              ? "bg-emerald-500"
                              : node.status === "expiring"
                              ? "bg-amber-500 animate-ping"
                              : "bg-muted-foreground"
                          }`}
                        />
                        <span className="capitalize text-muted-foreground">{node.status}</span>
                      </div>
                    </div>
                  </div>
                </foreignObject>
              );
            })}
          </g>
        </svg>

        {/* Empty state when no nodes match */}
        {filteredNodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <Layers className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <h4 className="text-sm font-bold text-foreground">No Resources Found</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              No mapped services matched your search or type filters. Clear filters to see full network.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setTypeFilter("all");
                setOnlySPOF(false);
              }}
              className="mt-3 text-xs rounded-xl"
            >
              Reset Filters
            </Button>
          </div>
        )}

        {/* Floating Quick Legend (Bottom Left) */}
        {!isCompact && (
          <div className="absolute left-3 bottom-3 p-2 rounded-xl bg-card/90 backdrop-blur-md border border-border/70 shadow-xs text-[10px] text-muted-foreground space-y-1 hidden md:block">
            <div className="font-semibold text-foreground text-[11px] flex items-center gap-1 mb-1">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>Legend</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-500/20 border border-purple-500" />
              <span>Purple: Upstream Prerequisite</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/20 border border-amber-500" />
              <span>Amber: Downstream Blast Radius</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/20 border border-rose-500" />
              <span>SPOF: Single Point of Failure (2+ dependents)</span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Blast Radius Simulation Report Drawer */}
      {selectedNode && (
        <div className="p-4 border-t border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>Outage Simulation:</span>
                  <span className="text-amber-600 dark:text-amber-400">{selectedNode.name}</span>
                </h4>
                <Link
                  href={`/resources/${selectedNode.id}`}
                  className="text-xs text-primary hover:underline flex items-center gap-0.5 ml-1"
                >
                  <span>View Details</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">
                If this service goes offline or expires,{" "}
                <strong className="text-foreground">
                  {selectedNode.totalBlastRadiusCount} downstream service
                  {selectedNode.totalBlastRadiusCount === 1 ? "" : "s"}
                </strong>{" "}
                will directly or indirectly fail. Total cascading annual spend at risk:{" "}
                <strong className="text-foreground">
                  {selectedNode.currency} {Math.round(selectedNodeCostAtRisk).toLocaleString()}
                </strong>
                .
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedNodeId(null)}
              className="rounded-xl text-xs gap-1.5 h-8 shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>Exit Simulation</span>
            </Button>
          </div>

          {/* Impacted Services Chips */}
          {selectedNode.downstreamNodeIds.length > 0 && (
            <div className="mt-3 pt-3 border-t border-amber-500/20 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground mr-1">
                Impacted Services:
              </span>
              {selectedNode.downstreamNodeIds.map((depId) => {
                const dep = graph.nodes.find((n) => n.id === depId);
                if (!dep) return null;
                return (
                  <Link
                    key={dep.id}
                    href={`/resources/${dep.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-background border border-amber-500/40 text-[11px] font-medium hover:border-amber-500 transition-colors shadow-2xs"
                  >
                    <ArrowRight className="w-2.5 h-2.5 text-amber-500" />
                    <span>{dep.name}</span>
                    <span className="text-[9px] text-muted-foreground capitalize">
                      ({dep.type.replace("_", " ")})
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
