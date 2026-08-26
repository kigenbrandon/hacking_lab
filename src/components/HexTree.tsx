import { useRef, useState, useEffect, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import type { ModuleWithStatus } from '@/lib/types';
import type { ModulePrerequisite } from '@/lib/types';

interface HexTreeProps {
  modules: ModuleWithStatus[];
  prerequisites: ModulePrerequisite[];
  rawModules: { id: string; position_x: number; position_y: number }[];
  onModuleClick: (module: ModuleWithStatus) => void;
}

const HEX_SIZE = 90;
const HEX_W = HEX_SIZE * Math.sqrt(3);
const HEX_H = HEX_SIZE * 1.5;

const colorMap: Record<string, { stroke: string; fill: string; glow: string; text: string }> = {
  green: { stroke: '#00ff88', fill: 'rgba(0, 255, 136, 0.08)', glow: '#00ff88', text: '#00ff88' },
  cyan: { stroke: '#22d3ee', fill: 'rgba(34, 211, 238, 0.08)', glow: '#22d3ee', text: '#22d3ee' },
  blue: { stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.08)', glow: '#3b82f6', text: '#60a5fa' },
  red: { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.08)', glow: '#ef4444', text: '#f87171' },
  amber: { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.08)', glow: '#f59e0b', text: '#fbbf24' },
  purple: { stroke: '#a855f7', fill: 'rgba(168, 85, 247, 0.08)', glow: '#a855f7', text: '#c084fc' },
};

const statusOpacity: Record<string, number> = {
  locked: 0.25,
  unlocked: 0.7,
  in_progress: 1,
  completed: 1,
};

function hexPath(cx: number, cy: number, size: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `M ${points.join(' L ')} Z`;
}

function hexCenter(x: number, y: number): { cx: number; cy: number } {
  const cx = x * HEX_W + (y % 2 === 1 ? HEX_W / 2 : 0) + HEX_W / 2 + 40;
  const cy = y * HEX_H + HEX_SIZE + 40;
  return { cx, cy };
}

export function HexTree({ modules, prerequisites, rawModules, onModuleClick }: HexTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const moduleMap = useMemo(() => {
    const map: Record<string, ModuleWithStatus> = {};
    modules.forEach((m) => { map[m.id] = m; });
    return map;
  }, [modules]);

  const bounds = useMemo(() => {
    if (rawModules.length === 0) return { minX: 0, minY: 0, maxX: 800, maxY: 600 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    rawModules.forEach((m) => {
      const { cx, cy } = hexCenter(m.position_x, m.position_y);
      minX = Math.min(minX, cx - HEX_SIZE);
      minY = Math.min(minY, cy - HEX_SIZE);
      maxX = Math.max(maxX, cx + HEX_SIZE);
      maxY = Math.max(maxY, cy + HEX_SIZE);
    });
    return { minX, minY, maxX, maxY };
  }, [rawModules]);

  const svgWidth = bounds.maxX - bounds.minX + 200;
  const svgHeight = bounds.maxY - bounds.minY + 200;

  useEffect(() => {
    const containerWidth = svgRef.current?.parentElement?.clientWidth ?? 800;
    const containerHeight = svgRef.current?.parentElement?.clientHeight ?? 600;
    const scaleX = containerWidth / svgWidth;
    const scaleY = containerHeight / svgHeight;
    const scale = Math.min(scaleX, scaleY, 1) * 0.9;
    setTransform({
      x: (containerWidth - svgWidth * scale) / 2,
      y: (containerHeight - svgHeight * scale) / 2,
      scale,
    });
  }, [svgWidth, svgHeight]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(transform.scale + delta, 0.3), 2.5);
    setTransform({ ...transform, scale: newScale });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as SVGElement).closest('.hex-group')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform({ ...transform, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const getIcon = (iconName: string, size: number) => {
    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[iconName];
    return Icon ? <Icon size={size} /> : <LucideIcons.Terminal size={size} />;
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="absolute inset-0"
      >
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {/* Connection lines */}
          {prerequisites.map((p, i) => {
            const mod = modules.find((m) => m.id === p.module_id);
            const prereq = modules.find((m) => m.id === p.prerequisite_id);
            if (!mod || !prereq) return null;
            const from = hexCenter(prereq.position_x, prereq.position_y);
            const to = hexCenter(mod.position_x, mod.position_y);
            const prereqCompleted = prereq.status === 'completed';
            return (
              <line
                key={i}
                x1={from.cx}
                y1={from.cy}
                x2={to.cx}
                y2={to.cy}
                stroke={prereqCompleted ? '#00ff88' : '#1c2839'}
                strokeWidth={prereqCompleted ? 2 : 1}
                strokeDasharray={prereqCompleted ? '0' : '6 4'}
                opacity={prereqCompleted ? 0.4 : 0.5}
              />
            );
          })}

          {/* Hexagons */}
          {modules.map((mod) => {
            const { cx, cy } = hexCenter(mod.position_x, mod.position_y);
            const colors = colorMap[mod.color] ?? colorMap.green;
            const opacity = statusOpacity[mod.status] ?? 0.5;
            const isHovered = hoveredId === mod.id;
            const isLocked = mod.status === 'locked';
            const isCompleted = mod.status === 'completed';
            const path = hexPath(cx, cy, HEX_SIZE - 4);
            const innerPath = hexPath(cx, cy, HEX_SIZE - 10);

            return (
              <g
                key={mod.id}
                className="hex-group cursor-pointer transition-all"
                onMouseEnter={() => setHoveredId(mod.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isLocked) onModuleClick(mod);
                }}
                style={{ opacity }}
              >
                {/* Outer glow hex */}
                {(isCompleted || isHovered) && !isLocked && (
                  <path
                    d={path}
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth={2}
                    className="animate-hex-pulse"
                    style={{ color: colors.glow, filter: `drop-shadow(0 0 8px ${colors.glow})` }}
                  />
                )}

                {/* Main hex */}
                <path
                  d={path}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={isHovered && !isLocked ? 2.5 : 1.5}
                  style={{
                    filter: isHovered && !isLocked ? `drop-shadow(0 0 6px ${colors.glow})` : 'none',
                    transition: 'all 0.2s ease',
                  }}
                />

                {/* Inner decorative hex */}
                <path
                  d={innerPath}
                  fill="none"
                  stroke={colors.stroke}
                  strokeWidth={0.5}
                  opacity={0.3}
                />

                {/* Icon */}
                <g
                  transform={`translate(${cx - 14}, ${cy - 28})`}
                  style={{ color: colors.text }}
                >
                  {isLocked ? (
                    <LucideIcons.Lock size={28} className="text-slate-600" />
                  ) : (
                    <foreignObject width={28} height={28}>
                      <div style={{ color: colors.text, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {getIcon(mod.icon, 24)}
                      </div>
                    </foreignObject>
                  )}
                </g>

                {/* Title */}
                <text
                  x={cx}
                  y={cy + 8}
                  textAnchor="middle"
                  fill={isLocked ? '#475569' : colors.text}
                  fontSize={11}
                  fontWeight={600}
                  fontFamily="Inter, sans-serif"
                  className="pointer-events-none"
                >
                  {mod.title.length > 18 ? mod.title.slice(0, 16) + '…' : mod.title}
                </text>

                {/* Status indicator */}
                <text
                  x={cx}
                  y={cy + 24}
                  textAnchor="middle"
                  fontSize={9}
                  fontFamily="JetBrains Mono, monospace"
                  fill={isLocked ? '#334155' : isCompleted ? '#00ff88' : colors.text}
                  opacity={0.7}
                  className="pointer-events-none"
                >
                  {isLocked
                    ? 'LOCKED'
                    : isCompleted
                    ? 'COMPLETE'
                    : mod.status === 'in_progress'
                    ? `${mod.completedLessons + mod.completedLabs}/${mod.totalLessons + mod.totalLabs}`
                    : 'AVAILABLE'}
                </text>

                {/* Difficulty pips */}
                <g transform={`translate(${cx - 20}, ${cy + 34})`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <circle
                      key={i}
                      cx={i * 10}
                      cy={0}
                      r={2}
                      fill={i < mod.difficulty ? colors.stroke : '#1c2839'}
                      opacity={i < mod.difficulty ? 0.8 : 0.3}
                    />
                  ))}
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-4 text-xs text-slate-600 terminal-text pointer-events-none">
        <p>scroll: zoom | drag: pan | click hex: enter</p>
      </div>
    </div>
  );
}
