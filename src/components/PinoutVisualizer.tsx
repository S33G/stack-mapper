'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Connector, PinMapping } from '@/types';

interface PinoutVisualizerProps {
  escConnector: Connector;
  fcConnector: Connector;
  mappings: PinMapping[];
  onMappingsChange: (mappings: PinMapping[]) => void;
  onQuickSave?: (name?: string, description?: string) => void;
}

export default function PinoutVisualizer({
  escConnector,
  fcConnector,
  mappings,
  onMappingsChange,
  onQuickSave,
}: PinoutVisualizerProps) {
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startPin: { id: number; type: 'esc' | 'fc'; x: number; y: number } | null;
    currentPos: { x: number; y: number } | null;
  }>({
    isDragging: false,
    startPin: null,
    currentPos: null,
  });

  const svgRef = useRef<SVGSVGElement>(null);
  // stageRef is the visual area that also contains the SVG; all coordinates should be relative to this
  const stageRef = useRef<HTMLDivElement>(null);
  // containerRef remains for outer wrapping events only (no coordinates)
  const containerRef = useRef<HTMLDivElement>(null);

  // Track pin DOM elements to compute exact centers for wires
  const pinRefs = useRef<{ esc: Record<number, HTMLElement | null>; fc: Record<number, HTMLElement | null> }>({ esc: {}, fc: {} });
  const setPinRef = (type: 'esc' | 'fc', id: number, el: HTMLElement | null) => {
    pinRefs.current[type][id] = el;
  };

  // Force re-render on resize so wire positions stay in sync
  const [viewportKey, setViewportKey] = useState(0);
  useEffect(() => {
    const onResize = () => setViewportKey((k) => k + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const addMapping = (escPin: number, fcPin: number) => {
    // Remove any existing mappings for these pins
    const filteredMappings = mappings.filter(
      m => m.escPin !== escPin && m.fcPin !== fcPin
    );

    const newMapping: PinMapping = { escPin, fcPin };
    onMappingsChange([...filteredMappings, newMapping]);
  };

  const removeMapping = (escPin: number, fcPin: number) => {
    const filteredMappings = mappings.filter(
      m => !(m.escPin === escPin && m.fcPin === fcPin)
    );
    onMappingsChange(filteredMappings);
  };

  const getConnectionColor = (pinId: number, type: 'esc' | 'fc') => {
    const mapping = mappings.find(m =>
      type === 'esc' ? m.escPin === pinId : m.fcPin === pinId
    );
    if (mapping) {
      const connectedPin = type === 'esc'
        ? fcConnector.pins.find(p => p.id === mapping.fcPin)
        : escConnector.pins.find(p => p.id === mapping.escPin);
      return connectedPin?.color || '#6b7280';
    }
    return null;
  };

  // Auto-map pins by matching unique pin functions between ESC and FC
  // - Only map when a function appears exactly once on EACH side
  // - Ignore functions marked as NC (Not Connected) or Custom
  // - Replaces current mappings with the computed unique matches
  const autoMap = () => {
    if (!escConnector?.pins?.length || !fcConnector?.pins?.length) return;

    const IGNORE_FUNCS = new Set(["NC (Not Connected)", "Custom"]);

    const normalize = (s: string) => (s || '').trim();

    const groupByFunc = (pins: { id: number; function: string }[]) => {
      const map = new Map<string, number[]>();
      for (const p of pins) {
        const func = normalize(p.function);
        if (!func || IGNORE_FUNCS.has(func)) continue;
        const arr = map.get(func) || [];
        arr.push(p.id);
        map.set(func, arr);
      }
      return map;
    };

    const escByFunc = groupByFunc(escConnector.pins);
    const fcByFunc = groupByFunc(fcConnector.pins);

    const newMappings: PinMapping[] = [];

    for (const [func, escIds] of escByFunc.entries()) {
      const fcIds = fcByFunc.get(func);
      if (!fcIds) continue; // no counterpart

      // Skip duplicates on either side
      if (escIds.length !== 1 || fcIds.length !== 1) continue;

      newMappings.push({ escPin: escIds[0], fcPin: fcIds[0] });
    }

    onMappingsChange(newMappings);
  };

  // Quick save helper: generate a preset name and persist
  const quickSavePreset = () => {
    const name = `${escConnector.name} -> ${fcConnector.name}`;
    const description = `Generated ${new Date().toLocaleString()}`;

    if (onQuickSave) {
      onQuickSave(name, description);
      return;
    }

    try {
      const saved = localStorage.getItem('esc-fc-presets');
      const list = saved ? JSON.parse(saved) : [];
      const newPreset = {
        id: `preset-${Date.now()}`,
        name,
        description,
        escConnector,
        fcConnector,
        mappings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [...list, newPreset];
      localStorage.setItem('esc-fc-presets', JSON.stringify(updated));
    } catch (e) {
      console.error('Quick save failed', e);
    }
  };

  const handleMouseDown = (pinId: number, type: 'esc' | 'fc', event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();
    const stageRect = stageRef.current?.getBoundingClientRect();

    if (stageRect) {
      const x = rect.left + rect.width / 2 - stageRect.left;
      const y = rect.top + rect.height / 2 - stageRect.top;

      setDragState({
        isDragging: true,
        startPin: { id: pinId, type, x, y },
        currentPos: { x, y },
      });
    }
  };

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (dragState.isDragging && stageRef.current) {
      event.preventDefault();
      const rect = stageRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      setDragState(prev => ({
        ...prev,
        currentPos: { x, y },
      }));
    }
  }, [dragState.isDragging]);

  const handleGlobalMouseMove = useCallback((event: MouseEvent) => {
    if (dragState.isDragging && stageRef.current) {
      const rect = stageRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      setDragState(prev => ({
        ...prev,
        currentPos: { x, y },
      }));
    }
  }, [dragState.isDragging]);

  // Add global mouse move listener
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleMouseUpGeneral);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleMouseUpGeneral);
      };
    }
  }, [dragState.isDragging, handleGlobalMouseMove]);

  const handleMouseUp = (pinId: number, type: 'esc' | 'fc') => {
    if (dragState.isDragging && dragState.startPin) {
      const { startPin } = dragState;

      // Only connect if dragging between different connector types
      if (startPin.type !== type) {
        if (startPin.type === 'esc' && type === 'fc') {
          addMapping(startPin.id, pinId);
        } else if (startPin.type === 'fc' && type === 'esc') {
          addMapping(pinId, startPin.id);
        }
      }
    }

    setDragState({
      isDragging: false,
      startPin: null,
      currentPos: null,
    });
  };

  const handleMouseUpGeneral = () => {
    setDragState({
      isDragging: false,
      startPin: null,
      currentPos: null,
    });
  };

  // --- Mapping editing helpers ---
  const ensureUniqueAndUpdate = (index: number, newEscPin: number, newFcPin: number) => {
    const updated = [...mappings];
    // Remove any other mapping that already uses the chosen pins
    const filtered = updated.filter((m, i) => i === index || (m.escPin !== newEscPin && m.fcPin !== newFcPin));
    // If the current index was filtered out (shouldn't be), reinsert placeholder
    if (!filtered[index]) filtered.splice(index, 0, mappings[index]);
    // Update the target mapping
    filtered[index] = { escPin: newEscPin, fcPin: newFcPin };
    onMappingsChange(filtered);
  };

  const handleEscPinChange = (index: number, escPinId: number) => {
    const current = mappings[index];
    ensureUniqueAndUpdate(index, escPinId, current.fcPin);
  };

  const handleFcPinChange = (index: number, fcPinId: number) => {
    const current = mappings[index];
    ensureUniqueAndUpdate(index, current.escPin, fcPinId);
  };

  const PinComponent = ({ pin, type, pinIndex, containerOffset }: {
    pin: any;
    type: 'esc' | 'fc';
    pinIndex: number;
    containerOffset: { x: number; y: number };
  }) => {
    const connectionColor = getConnectionColor(pin.id, type);
    const isConnected = connectionColor !== null;
    const mappingForPin = mappings.find(m => (type === 'esc' ? m.escPin === pin.id : m.fcPin === pin.id));

    return (
      <div className={`flex items-center gap-3 ${type === 'esc' ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Pin container */}
        <div
          className="relative w-12 h-12 flex items-center justify-center flex-shrink-0"
          // Register the element to compute wire centers accurately
          ref={(el) => setPinRef(type, pin.id, el)}
        >
          {/* Connection glow effect when connected */}
          {isConnected && (
            <div
              className="absolute inset-0 rounded-full animate-ping pointer-events-none"
              style={{
                backgroundColor: pin.color,
                opacity: 0.3,
                transform: 'scale(1.5)'
              }}
            />
          )}

          {/* Pin socket/housing */}
          <div
            className={`
              absolute w-10 h-10 pin-socket rounded-full border-2 transition-all pointer-events-none
              ${isConnected
                ? 'border-yellow-400'
                : 'border-gray-600'
              }
            `}
          />

          {/* Actual pin */}
          <button
            onMouseDown={(e) => handleMouseDown(pin.id, type, e)}
            onMouseUp={() => handleMouseUp(pin.id, type)}
            className={`
              w-8 h-8 rounded-full border-2 transition-all transform hover:scale-110 cursor-grab active:cursor-grabbing relative z-10
              ${isConnected
                ? 'border-yellow-400 shadow-lg ring-2 ring-yellow-200'
                : 'border-gray-400 hover:border-gray-300 hover:shadow-md'
              }
            `}
            style={{
              backgroundColor: pin.color,
              boxShadow: isConnected ? `0 0 15px ${pin.color}, inset 0 2px 4px rgba(255,255,255,0.3)` : 'inset 0 2px 4px rgba(255,255,255,0.2)',
            }}
            title={`${pin.label} - ${pin.function}`}
          >
            {/* Metallic highlight on pin */}
            <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-white opacity-40" />
          </button>

          {/* Electrical activity indicator when connected */}
          {isConnected && (
            <div
              className="absolute inset-0 w-8 h-8 rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${pin.color}40 0%, transparent 70%)`,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          )}
        </div>

        {/* Pin Labels - positioned next to pin */}
        <div className={`flex items-center gap-2 ${type === 'esc' ? 'justify-start' : 'justify-end'} min-w-20`}>
          <div className={`flex flex-col ${type === 'esc' ? 'items-start' : 'items-end'} pointer-events-none`}>
          <div className="text-xs font-bold text-white bg-gray-800 px-2 py-1 rounded shadow-sm border border-gray-600">
            {pin.label === pin.id.toString() || pin.label === `${pin.id}`
              ? `Pin ${pin.id}`
              : `${pin.label} (${pin.id})`
            }
          </div>
          <div className="text-xs text-gray-500 truncate max-w-20">
            {pin.function}
          </div>
          </div>
          {/* Delete mapping control near ESC pins only */}
          {type === 'esc' && mappingForPin && (
            <button
              onClick={() => removeMapping(mappingForPin.escPin, mappingForPin.fcPin)}
              className="ml-1 inline-flex items-center justify-center w-6 h-6 rounded-full border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Remove connection"
              aria-label="Remove connection"
            >
              ×
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="space-y-6 relative"
      onMouseUp={handleMouseUpGeneral}
      onMouseLeave={handleMouseUpGeneral}
    >
      {/* Instructions + Actions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Drag from one connector's pin to another connector's pin to create connections. Click a wire to remove it.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={autoMap}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-3 py-2 rounded-md shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Automatically map unique pin types between ESC and FC"
            >
              Auto Map
            </button>
            <button
              type="button"
              onClick={quickSavePreset}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white text-sm font-medium px-3 py-2 rounded-md shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              title="Save preset using connector names"
            >
              Save Preset
            </button>
          </div>
        </div>
        <p className="text-xs text-blue-700/90 dark:text-blue-300/80 mt-2">
          Auto Map pairs pins only when a pin type appears exactly once on both connectors. NC and Custom pins are ignored.
        </p>
      </div>

      {/* Main Connector Area */}
  <div ref={stageRef} className="relative bg-gray-100 dark:bg-gray-800 rounded-xl p-8">
        <div className="flex justify-between items-start gap-8" style={{ minHeight: `${Math.max(escConnector.pinCount, fcConnector.pinCount) * 60 + 100}px` }}>
          {/* ESC Connector */}
          <div className="flex-shrink-0">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {escConnector.name}
              </h3>
            </div>

            {/* ESC Connector Housing */}
            <div className="connector-housing rounded-lg p-4 shadow-lg relative">
              <div className="bg-gray-900 rounded p-4 relative">
                <div className="flex flex-col gap-3">
                  {escConnector.pins.map((pin, index) => (
                    <div key={pin.id} className="relative flex justify-start items-center h-12">
                      <PinComponent
                        pin={pin}
                        type="esc"
                        pinIndex={index}
                        containerOffset={{ x: 96, y: 100 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center mt-2">
                <div className="text-xs text-gray-300 font-medium">ESC</div>
              </div>
            </div>
          </div>

          {/* FC Connector */}
          <div className="flex-shrink-0">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {fcConnector.name}
              </h3>
            </div>

            {/* FC Connector Housing */}
            <div className="connector-housing rounded-lg p-4 shadow-lg relative">
              <div className="bg-gray-900 rounded p-4 relative">
                <div className="flex flex-col gap-3">
                  {fcConnector.pins.map((pin, index) => (
                    <div key={pin.id} className="relative flex justify-end items-center h-12">
                      <PinComponent
                        pin={pin}
                        type="fc"
                        pinIndex={index}
                        containerOffset={{ x: 0, y: 100 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center mt-2">
                <div className="text-xs text-gray-300 font-medium">FC</div>
              </div>
            </div>
          </div>
        </div>

        {/* SVG Overlay for Wires */}
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1, top: 0, left: 0 }}
        >
          {/* Existing Connections */}
          {mappings.map((mapping, index) => {
            const escPin = escConnector.pins.find(p => p.id === mapping.escPin);
            const fcPin = fcConnector.pins.find(p => p.id === mapping.fcPin);

            if (!escPin || !fcPin) return null;

            const containerEl = stageRef.current;
            const escEl = pinRefs.current.esc[mapping.escPin] as HTMLElement | null;
            const fcEl = pinRefs.current.fc[mapping.fcPin] as HTMLElement | null;
            if (!containerEl || !escEl || !fcEl) return null;

            const containerRect = containerEl.getBoundingClientRect();
            const escRect = escEl.getBoundingClientRect();
            const fcRect = fcEl.getBoundingClientRect();

            const escX = escRect.left + escRect.width / 2 - containerRect.left;
            const escY = escRect.top + escRect.height / 2 - containerRect.top;
            const fcX = fcRect.left + fcRect.width / 2 - containerRect.left;
            const fcY = fcRect.top + fcRect.height / 2 - containerRect.top;

            // Calculate control points for curved wire
            const distance = fcX - escX;
            const controlPoint1X = escX + distance * 0.3;
            const controlPoint2X = fcX - distance * 0.3;

            // Add natural cable sag
            const sag = Math.min(60, Math.abs(distance) * 0.1 + Math.abs(escY - fcY) * 0.2);
            const midY = (escY + fcY) / 2;
            const controlPoint1Y = midY + sag;
            const controlPoint2Y = midY + sag;

            // Create smooth curve
            const pathData = `M ${escX} ${escY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${fcX} ${fcY}`;

            return (
              <g key={index}>
                {/* Wire Shadow */}
                <path
                  d={pathData}
                  stroke="rgba(0,0,0,0.4)"
                  strokeWidth="5"
                  fill="none"
                  transform="translate(2, 2)"
                  strokeLinecap="round"
                />

                {/* Main Wire */}
                <path
                  d={pathData}
                  stroke={escPin.color}
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    filter: `drop-shadow(0 0 8px ${escPin.color})`,
                  }}
                >
                  {/* Current flow animation */}
                  <animate
                    attributeName="stroke-dasharray"
                    values="0 20;10 10;20 0;10 10;0 20"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </path>

                {/* Wire highlight for 3D effect */}
                <path
                  d={pathData}
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  transform="translate(0.5, 1)"
                />

                {/* Wire delete control removed; delete now offered near ESC pins and in summary */}
              </g>
            );
          })}

          {/* Active Drag Line */}
          {dragState.isDragging && dragState.startPin && dragState.currentPos && (
            <>
              {/* Animated drag wire with curve */}
              <path
                d={`M ${dragState.startPin.x} ${dragState.startPin.y} Q ${(dragState.startPin.x + dragState.currentPos.x) / 2} ${Math.max(dragState.startPin.y, dragState.currentPos.y) + 50} ${dragState.currentPos.x} ${dragState.currentPos.y}`}
                stroke="#60a5fa"
                strokeWidth="4"
                fill="none"
                strokeDasharray="10,5"
                strokeLinecap="round"
                style={{
                  filter: 'drop-shadow(0 0 10px #60a5fa)',
                }}
                className="pointer-events-none"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="0;15;0"
                  dur="1.2s"
                  repeatCount="indefinite"
                />
              </path>

              {/* Connection preview indicator */}
              <circle
                cx={dragState.currentPos.x}
                cy={dragState.currentPos.y}
                r="8"
                fill="#60a5fa"
                className="pointer-events-none"
                style={{
                  filter: 'drop-shadow(0 0 12px #60a5fa)',
                }}
              >
                <animate
                  attributeName="r"
                  values="6;10;6"
                  dur="1s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.6;1;0.6"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </circle>
            </>
          )}
        </svg>
      </div>

      {/* Mapping Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Pin Mappings ({mappings.length})
        </h3>
        <div className="grid gap-2 max-h-60 overflow-y-auto">
          {/* Unmapped rows FIRST: ESC pins without FC mapping */}
          {(() => {
            const mappedEsc = new Set(mappings.map(m => m.escPin));
            const mappedFc = new Set(mappings.map(m => m.fcPin));
            const unmappedEsc = escConnector.pins.filter(p => !mappedEsc.has(p.id));
            const availableFc = fcConnector.pins.filter(p => !mappedFc.has(p.id));
            if (unmappedEsc.length === 0) return null;
            return (
              <>
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 mt-1">Unmapped ESC pins ({unmappedEsc.length})</div>
                {unmappedEsc.map((p) => (
                  <div key={`unmapped-esc-${p.id}`} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-600">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: p.color }} />
                        <span className="text-sm font-medium text-amber-800 dark:text-amber-300">ESC Pin {p.id}: {p.label} ({p.function})</span>
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100">Unmapped</span>
                      </div>
                      <span className="text-gray-500">→</span>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600 dark:text-gray-300">FC</label>
                        <select
                          value=""
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (val) addMapping(p.id, val);
                          }}
                          className="px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        >
                          <option value="">Select FC pin…</option>
                          {availableFc.map((f) => (
                            <option key={f.id} value={f.id}>{`Pin ${f.id}: ${f.label} (${f.function})`}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            );
          })()}

          {/* Unmapped rows: FC pins without ESC mapping */}
          {(() => {
            const mappedEsc = new Set(mappings.map(m => m.escPin));
            const mappedFc = new Set(mappings.map(m => m.fcPin));
            const unmappedFc = fcConnector.pins.filter(p => !mappedFc.has(p.id));
            const availableEsc = escConnector.pins.filter(p => !mappedEsc.has(p.id));
            if (unmappedFc.length === 0) return null;
            return (
              <>
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 mt-2">Unmapped FC pins ({unmappedFc.length})</div>
                {unmappedFc.map((p) => (
                  <div key={`unmapped-fc-${p.id}`} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-600">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 dark:text-gray-300">ESC</span>
                        <select
                          value=""
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (val) addMapping(val, p.id);
                          }}
                          className="px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        >
                          <option value="">Select ESC pin…</option>
                          {availableEsc.map((ePin) => (
                            <option key={ePin.id} value={ePin.id}>{`Pin ${ePin.id}: ${ePin.label} (${ePin.function})`}</option>
                          ))}
                        </select>
                      </div>

                      <span className="text-gray-500">→</span>

                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: p.color }} />
                        <span className="text-sm font-medium text-amber-800 dark:text-amber-300">FC Pin {p.id}: {p.label} ({p.function})</span>
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100">Unmapped</span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            );
          })()}

          {/* Existing mapped pairs (editable) */}
          {mappings.map((mapping, index) => {
            const escPin = escConnector.pins.find(p => p.id === mapping.escPin);
            const fcPin = fcConnector.pins.find(p => p.id === mapping.fcPin);

            return (
              <div
                key={`mapped-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-4 flex-wrap">
                  {/* ESC select */}
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: escPin?.color }} />
                    <label className="text-xs text-gray-600 dark:text-gray-300">ESC</label>
                    <select
                      value={mapping.escPin}
                      onChange={(e) => handleEscPinChange(index, Number(e.target.value))}
                      className="px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    >
                      {escConnector.pins.map((p) => (
                        <option key={p.id} value={p.id}>{`Pin ${p.id}: ${p.label} (${p.function})`}</option>
                      ))}
                    </select>
                  </div>

                  <span className="text-gray-500">→</span>

                  {/* FC select */}
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: fcPin?.color }} />
                    <label className="text-xs text-gray-600 dark:text-gray-300">FC</label>
                    <select
                      value={mapping.fcPin}
                      onChange={(e) => handleFcPinChange(index, Number(e.target.value))}
                      className="px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    >
                      {fcConnector.pins.map((p) => (
                        <option key={p.id} value={p.id}>{`Pin ${p.id}: ${p.label} (${p.function})`}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => removeMapping(mapping.escPin, mapping.fcPin)}
                  className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Remove
                </button>
              </div>
            );
          })}

          {/* Unmapped rows: ESC pins without FC mapping */}
          {(() => {
            const mappedEsc = new Set(mappings.map(m => m.escPin));
            const mappedFc = new Set(mappings.map(m => m.fcPin));
            const unmappedEsc = escConnector.pins.filter(p => !mappedEsc.has(p.id));
            const availableFc = fcConnector.pins.filter(p => !mappedFc.has(p.id));
            return unmappedEsc.map((p) => (
              <div key={`unmapped-esc-${p.id}`} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-600">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: p.color }} />
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-300">ESC Pin {p.id}: {p.label} ({p.function})</span>
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100">Unmapped</span>
                  </div>
                  <span className="text-gray-500">→</span>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 dark:text-gray-300">FC</label>
                    <select
                      value=""
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val) addMapping(p.id, val);
                      }}
                      className="px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Select FC pin…</option>
                      {availableFc.map((f) => (
                        <option key={f.id} value={f.id}>{`Pin ${f.id}: ${f.label} (${f.function})`}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ));
          })()}

          {/* Unmapped rows: FC pins without ESC mapping */}
          {(() => {
            const mappedEsc = new Set(mappings.map(m => m.escPin));
            const mappedFc = new Set(mappings.map(m => m.fcPin));
            const unmappedFc = fcConnector.pins.filter(p => !mappedFc.has(p.id));
            const availableEsc = escConnector.pins.filter(p => !mappedEsc.has(p.id));
            return unmappedFc.map((p) => (
              <div key={`unmapped-fc-${p.id}`} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-600">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 dark:text-gray-300">ESC</span>
                    <select
                      value=""
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val) addMapping(val, p.id);
                      }}
                      className="px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Select ESC pin…</option>
                      {availableEsc.map((ePin) => (
                        <option key={ePin.id} value={ePin.id}>{`Pin ${ePin.id}: ${ePin.label} (${ePin.function})`}</option>
                      ))}
                    </select>
                  </div>

                  <span className="text-gray-500">→</span>

                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: p.color }} />
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-300">FC Pin {p.id}: {p.label} ({p.function})</span>
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100">Unmapped</span>
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}
