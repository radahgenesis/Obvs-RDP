import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import { RemoteMachine } from "../types";
import { 
  Globe, 
  Settings, 
  MapPin, 
  Activity, 
  Server, 
  Wifi, 
  Terminal, 
  Radio, 
  Layers, 
  RefreshCw,
  Cpu,
  Tv
} from "lucide-react";

interface GlobalMapViewProps {
  machines: RemoteMachine[];
  onSelectMachine: (machine: RemoteMachine, mode: "terminal" | "desktop") => void;
}

export default function GlobalMapView({ machines, onSelectMachine }: GlobalMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Custom interactive controls
  const [showArcs, setShowArcs] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Default Console HQ (San Francisco or user's custom location)
  const hq = { city: "San Francisco (Console HQ)", country: "USA", lat: 37.7749, lng: -122.4194 };

  // Observe container size for fluid responsiveness
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      // Maintain 2:1 aspect ratio, min height 320px, max height 450px
      const height = Math.max(320, Math.min(450, width * 0.45));
      setDimensions({ width, height });
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Fetch World GeoJSON (optimized ~114KB world simplified map)
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    // Fetch from a reliable, lightweight public JSdelivr CDN
    fetch("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (active) {
          setGeoData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch world map GeoJSON:", err);
        if (active) {
          setError("Network timeout fetching map outlines. Using secure offline radar projection fallback.");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [retryCount]);

  // Compute map projection properties
  const { width, height } = dimensions;
  
  // Mercator projection centered on the globe
  const projection = d3.geoMercator()
    .scale(Math.max(50, Math.min(150, width / 6.2))) // Dynamic scale matching dimensions
    .translate([width / 2, height / 2 + 20]);

  const pathGenerator = d3.geoPath().projection(projection);
  const graticule = d3.geoGraticule();

  // Get coordinates of all machines
  const mappedNodes = machines
    .filter((m) => m.location && typeof m.location.lat === "number" && typeof m.location.lng === "number")
    .map((m) => {
      const coords = projection([m.location!.lng, m.location!.lat]);
      return {
        machine: m,
        coords,
        location: m.location!
      };
    })
    .filter((node) => node.coords !== null) as Array<{
      machine: RemoteMachine;
      coords: [number, number];
      location: { city: string; country: string; lat: number; lng: number };
    }>;

  // Get coordinates for HQ
  const hqCoords = projection([hq.lng, hq.lat]);

  // Helper to draw clean geodesic curves / arcs from HQ to registered node
  const calculateArcPath = (start: [number, number], end: [number, number]) => {
    const [sx, sy] = start;
    const [ex, ey] = end;
    
    // Draw Bezier quadratic curve with control point bent upwards
    const dx = ex - sx;
    const dy = ey - sy;
    const dr = Math.sqrt(dx * dx + dy * dy);
    
    // Control point offsets
    const mx = (sx + ex) / 2;
    const my = (sy + ey) / 2 - dr * 0.15; // bend amount
    
    return `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`;
  };

  const selectedNode = mappedNodes.find(n => n.machine.id === selectedNodeId);

  return (
    <div className="bg-slate-950 border border-white/10 rounded-lg p-5 mb-8 overflow-hidden relative group">
      
      {/* Decorative Tech Grid Border & Corner Accents */}
      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-indigo-500" />
      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-indigo-500" />
      <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-indigo-500" />
      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-indigo-500" />

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
            <Globe className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-white font-mono flex items-center gap-1.5">
              Global Deployment Radar
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            </h2>
            <p className="text-[10px] font-mono text-white/40 mt-0.5">
              Geographical distribution map of tunnels and secure node hosts
            </p>
          </div>
        </div>

        {/* Action Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
          <button
            onClick={() => setShowArcs(!showArcs)}
            className={`px-2 py-1 border transition-colors flex items-center gap-1.5 ${
              showArcs 
                ? "bg-indigo-600/10 border-indigo-500 text-indigo-300" 
                : "bg-white/5 border-white/10 text-white/40 hover:text-white"
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>Tunnel Lines: {showArcs ? "ON" : "OFF"}</span>
          </button>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2 py-1 border transition-colors flex items-center gap-1.5 ${
              showGrid 
                ? "bg-emerald-600/10 border-emerald-500 text-emerald-300" 
                : "bg-white/5 border-white/10 text-white/40 hover:text-white"
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Graticule Grid: {showGrid ? "ON" : "OFF"}</span>
          </button>

          {error && (
            <button
              onClick={() => setRetryCount(prev => prev + 1)}
              className="px-2 py-1 bg-red-600/20 border border-red-500 text-red-300 flex items-center gap-1 hover:bg-red-600 hover:text-white transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry Radar Connection</span>
            </button>
          )}
        </div>
      </div>

      {/* Map Stage Container */}
      <div 
        ref={containerRef} 
        className="w-full relative bg-black/40 border border-white/5 flex items-center justify-center min-h-[320px] rounded overflow-hidden"
      >
        
        {/* Sat Sync Details Info HUD */}
        <div className="absolute top-3 left-3 bg-black/80 border border-white/10 p-2 text-[9px] font-mono text-white/60 z-10 rounded backdrop-blur flex flex-col gap-1 pointer-events-none">
          <div className="text-white font-bold uppercase border-b border-white/5 pb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            SECURE SAT-CON LINK
          </div>
          <div>HQ LOC: San Francisco, CA</div>
          <div>REGISTERED HOSTS PLOTTED: {mappedNodes.length}</div>
          <div>RADAR FREQ: 92.4 GHz [SEC]</div>
          <div>SYS STATUS: <span className="text-emerald-400 font-bold">ONLINE</span></div>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
            <div className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/50 animate-pulse">
              Syncing Geolocation Coordinates via SSL-Radar...
            </div>
          </div>
        )}

        {/* Interactive World SVG */}
        <svg 
          width={width} 
          height={height} 
          className="select-none"
          onClick={() => setSelectedNodeId(null)}
        >
          {/* Subtle background graticule if enabled */}
          {showGrid && (
            <g className="graticule">
              <path
                d={pathGenerator(graticule()) || ""}
                fill="none"
                stroke="rgba(255, 255, 255, 0.03)"
                strokeWidth={1}
              />
              {/* Outer boundary sphere */}
              <path
                d={pathGenerator(graticule.outline()) || ""}
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth={1.2}
              />
            </g>
          )}

          {/* Fallback Grid Map if we have no GeoJSON outlines */}
          {error && !geoData && (
            <g className="offline-grid-lines">
              {/* Horizontal / Vertical Radar rings and crosshairs */}
              <line x1={width / 2} y1={0} x2={width / 2} y2={height} stroke="rgba(255, 255, 255, 0.03)" strokeWidth={1} />
              <line x1={0} y1={height / 2 + 20} x2={width} y2={height / 2 + 20} stroke="rgba(255, 255, 255, 0.03)" strokeWidth={1} />
              <circle cx={width / 2} cy={height / 2 + 20} r={50} fill="none" stroke="rgba(99, 102, 241, 0.03)" strokeWidth={1} />
              <circle cx={width / 2} cy={height / 2 + 20} r={120} fill="none" stroke="rgba(99, 102, 241, 0.03)" strokeWidth={1} />
              <circle cx={width / 2} cy={height / 2 + 20} r={200} fill="none" stroke="rgba(99, 102, 241, 0.03)" strokeWidth={1} />
              <circle cx={width / 2} cy={height / 2 + 20} r={280} fill="none" stroke="rgba(99, 102, 241, 0.02)" strokeWidth={1} />
            </g>
          )}

          {/* Render World Map Country outlines if available */}
          {geoData && (
            <g className="countries">
              {geoData.features.map((d: any, i: number) => (
                <path
                  key={`country-${i}`}
                  d={pathGenerator(d) || ""}
                  className="transition-colors duration-300"
                  fill="rgba(30, 41, 59, 0.45)"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth={0.6}
                  onMouseEnter={(e) => {
                    d3.select(e.currentTarget)
                      .attr("fill", "rgba(79, 70, 229, 0.15)")
                      .attr("stroke", "rgba(99, 102, 241, 0.25)");
                  }}
                  onMouseLeave={(e) => {
                    d3.select(e.currentTarget)
                      .attr("fill", "rgba(30, 41, 59, 0.45)")
                      .attr("stroke", "rgba(255, 255, 255, 0.08)");
                  }}
                />
              ))}
            </g>
          )}

          {/* Render SSL-Proxy Tunnel lines / curves */}
          {showArcs && hqCoords && (
            <g className="tunnels">
              {mappedNodes.map((node, i) => {
                const isOnline = node.machine.status === "online";
                const isSelected = selectedNodeId === node.machine.id;
                
                // Construct the arc path
                const pathD = calculateArcPath(hqCoords, node.coords);
                
                return (
                  <g key={`tunnel-arc-${node.machine.id}`}>
                    {/* Shadow wider curve for glow */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={isOnline ? "rgb(99, 102, 241)" : "rgb(148, 163, 184)"}
                      strokeWidth={isSelected ? 3 : 1.2}
                      className="opacity-15 transition-all"
                    />
                    
                    {/* Active dynamic animation line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={isOnline ? "rgb(52, 211, 153)" : "rgb(71, 85, 105)"}
                      strokeWidth={isSelected ? 1.8 : 0.8}
                      strokeDasharray={isOnline ? "6, 12" : "3, 6"}
                      className={isOnline ? "animate-dash-travel" : "opacity-40"}
                      style={{
                        strokeDashoffset: isOnline ? 100 : 0,
                      }}
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* Plot Gateway Console HQ */}
          {hqCoords && (
            <g className="console-hq">
              {/* Pulsing ring */}
              <circle
                cx={hqCoords[0]}
                cy={hqCoords[1]}
                r={10}
                fill="none"
                stroke="#6366f1"
                strokeWidth={1}
                className="animate-ping"
                style={{ transformOrigin: `${hqCoords[0]}px ${hqCoords[1]}px` }}
              />
              <circle
                cx={hqCoords[0]}
                cy={hqCoords[1]}
                r={5}
                fill="#818cf8"
                stroke="#4338ca"
                strokeWidth={1.5}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNodeId("CONSOLE-HQ");
                }}
              />
            </g>
          )}

          {/* Plot Machine nodes */}
          <g className="nodes">
            {mappedNodes.map((node) => {
              const [cx, cy] = node.coords;
              const isOnline = node.machine.status === "online";
              const isRebooting = node.machine.status === "rebooting";
              const isSelected = selectedNodeId === node.machine.id;
              
              // Color settings based on status
              const ringColor = isOnline ? "#34d399" : isRebooting ? "#f59e0b" : "#f87171";
              const coreColor = isOnline ? "#10b981" : isRebooting ? "#d97706" : "#ef4444";
              
              return (
                <g 
                  key={`node-point-${node.machine.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodeId(node.machine.id);
                  }}
                  className="cursor-pointer group/node"
                >
                  {/* Glowing background anchor */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 16 : 8}
                    fill={ringColor}
                    className="opacity-15 animate-pulse transition-all duration-300"
                  />

                  {/* Pulsing radar expansion wave */}
                  {isOnline && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 22 : 12}
                      fill="none"
                      stroke={ringColor}
                      strokeWidth={1}
                      className="animate-ping"
                      style={{ transformOrigin: `${cx}px ${cy}px` }}
                    />
                  )}

                  {/* Core solid dot */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 6 : 4}
                    fill={coreColor}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? 1.5 : 0.8}
                    className="transition-all duration-300 group-hover/node:scale-125"
                  />

                  {/* Small label above the point */}
                  <text
                    x={cx}
                    y={cy - 12}
                    textAnchor="middle"
                    fill="rgba(255, 255, 255, 0.75)"
                    className="font-mono text-[8px] font-semibold uppercase tracking-wider select-none bg-black/90 pointer-events-none"
                    style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
                  >
                    {node.machine.name.split("-").pop() || node.machine.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Visual Error/Radar fallback alert overlay */}
        {error && (
          <div className="absolute bottom-3 left-3 right-3 bg-red-950/90 border border-red-500/30 px-3 py-1.5 text-[9px] font-mono text-red-300 flex items-center justify-between rounded z-10 backdrop-blur">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
              {error}
            </span>
          </div>
        )}

        {/* Interactive Floating Tooltip HUD Panel */}
        {selectedNodeId && (
          <div className="absolute bottom-4 right-4 bg-slate-950/95 border border-indigo-500 p-4 w-72 text-xs text-white z-20 rounded shadow-2xl backdrop-blur animate-fade-in flex flex-col gap-2.5">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span className="font-mono font-bold tracking-wider uppercase text-[10px] text-indigo-400">
                  {selectedNodeId === "CONSOLE-HQ" ? "Console Gateway" : "Node Details"}
                </span>
              </div>
              <button 
                onClick={() => setSelectedNodeId(null)}
                className="text-white/40 hover:text-white font-bold"
              >
                ×
              </button>
            </div>

            {selectedNodeId === "CONSOLE-HQ" ? (
              // HQ Details Info
              <div className="font-mono text-[10px] flex flex-col gap-1.5 text-slate-300">
                <div className="text-white font-bold uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  Console HQ Control Terminal
                </div>
                <div>Location: <span className="text-white">{hq.city}, {hq.country}</span></div>
                <div>Coordinates: <span className="text-indigo-400">{hq.lat.toFixed(4)}° N, {hq.lng.toFixed(4)}° W</span></div>
                <div className="border-t border-white/5 pt-1.5 mt-1.5 text-[9px] text-white/50">
                  Secure local browser instance tunneling connections out to remote endpoints.
                </div>
              </div>
            ) : selectedNode ? (
              // Node Details Info
              <div className="flex flex-col gap-2 font-mono">
                
                {/* Node Name & Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white uppercase tracking-wider">
                    {selectedNode.machine.name}
                  </span>
                  <span className={`px-2 py-0.5 text-[8px] font-bold border uppercase tracking-wider ${
                    selectedNode.machine.status === "online" 
                      ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400" 
                      : selectedNode.machine.status === "rebooting"
                        ? "bg-amber-950/40 border-amber-500/30 text-amber-400"
                        : "bg-red-950/40 border-red-500/30 text-red-400"
                  }`}>
                    {selectedNode.machine.status}
                  </span>
                </div>

                {/* Sub Metadata details */}
                <div className="text-[10px] text-slate-400 flex flex-col gap-1 border-b border-white/5 pb-2">
                  <div className="flex justify-between">
                    <span>IP Address:</span>
                    <span className="text-white font-bold">{selectedNode.machine.ip}:{selectedNode.machine.port}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Geographic City:</span>
                    <span className="text-emerald-400 font-bold">{selectedNode.location.city} ({selectedNode.location.country})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coordinates:</span>
                    <span className="text-indigo-300 font-bold">{selectedNode.location.lat.toFixed(4)}°, {selectedNode.location.lng.toFixed(4)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Group:</span>
                    <span className="text-white font-bold uppercase text-[9px]">{selectedNode.machine.group}</span>
                  </div>
                </div>

                {/* Performance HUD (only if online) */}
                {selectedNode.machine.status === "online" ? (
                  <div className="grid grid-cols-2 gap-2 text-[9px] bg-black/40 p-2 border border-white/5 rounded">
                    <div className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-blue-400" />
                      <div className="flex flex-col">
                        <span className="text-white/40 uppercase">CPU</span>
                        <span className="text-white font-bold">{selectedNode.machine.metrics.cpu}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      <div className="flex flex-col">
                        <span className="text-white/40 uppercase">RAM</span>
                        <span className="text-white font-bold">{selectedNode.machine.metrics.ram}%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 text-[9px] text-red-400/60 font-bold uppercase bg-red-950/10 border border-red-900/20">
                    ⚠️ Host Node Offline. No Telemetry metrics.
                  </div>
                )}

                {/* Session Establish CTA Buttons */}
                {selectedNode.machine.status === "online" && (
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      onClick={() => onSelectMachine(selectedNode.machine, "terminal")}
                      className="bg-indigo-600 hover:bg-indigo-500 hover:text-white text-white font-bold py-1.5 text-[9px] uppercase tracking-wider rounded flex items-center justify-center gap-1 transition-all"
                    >
                      <Terminal className="w-3 h-3" /> Terminal
                    </button>
                    <button
                      onClick={() => onSelectMachine(selectedNode.machine, "desktop")}
                      className="bg-emerald-600 hover:bg-emerald-500 hover:text-white text-white font-bold py-1.5 text-[9px] uppercase tracking-wider rounded flex items-center justify-center gap-1 transition-all"
                    >
                      <Tv className="w-3 h-3" /> Desktop
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Styled animation CSS helper injected inline to animate dotted radar connections */}
      <style>{`
        @keyframes dashTravel {
          to {
            stroke-dashoffset: -100;
          }
        }
        .animate-dash-travel {
          animation: dashTravel 4.5s linear infinite;
        }
        .animate-spin-slow {
          animation: spin 16s linear infinite;
        }
      `}</style>
    </div>
  );
}
