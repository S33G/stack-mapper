'use client';

import { useState } from 'react';
import { AppState, Connector, PinMapping, Preset } from '@/types';
import ConnectorConfiguration from '@/components/ConnectorConfiguration';
import PinoutVisualizer from '@/components/PinoutVisualizer';
import PresetManager from '@/components/PresetManager';

export default function Home() {
  const [appState, setAppState] = useState<AppState>({
    escConnector: null,
    fcConnector: null,
    mappings: [],
    presets: [],
    selectedPreset: null,
  });

  // Wizard step: 0 Welcome, 1 ESC, 2 FC, 3 Visualizer
  const [step, setStep] = useState<number>(0);

  const updateESCConnector = (connector: Connector) => {
    setAppState(prev => ({
      ...prev,
      escConnector: connector,
      mappings: [] // Reset mappings when connector changes
    }));
  };

  const updateFCConnector = (connector: Connector) => {
    setAppState(prev => ({
      ...prev,
      fcConnector: connector,
      mappings: [] // Reset mappings when connector changes
    }));
  };

  const updateMappings = (mappings: PinMapping[]) => {
    setAppState(prev => ({
      ...prev,
      mappings
    }));
  };

  const updatePresets = (presets: any[]) => {
    setAppState(prev => ({
      ...prev,
      presets
    }));
  };

  const loadPreset = (presetId: string) => {
    const preset = appState.presets.find(p => p.id === presetId);
    if (preset) {
      setAppState(prev => ({
        ...prev,
        selectedPreset: presetId,
        escConnector: preset.escConnector,
        fcConnector: preset.fcConnector,
        mappings: preset.mappings,
      }));
      setStep(3); // Jump straight to visualizer when a preset is loaded
    }
  };

  const quickSavePreset = (name?: string, description?: string) => {
    if (!appState.escConnector || !appState.fcConnector) return;
    const preset: Preset = {
      id: `preset-${Date.now()}`,
      name: name || `${appState.escConnector.name} -> ${appState.fcConnector.name}`,
      description: description || '',
      escConnector: appState.escConnector,
      fcConnector: appState.fcConnector,
      mappings: appState.mappings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...appState.presets, preset];
    setAppState(prev => ({ ...prev, presets: updated, selectedPreset: preset.id }));
    try {
      localStorage.setItem('esc-fc-presets', JSON.stringify(updated));
    } catch {}
  };

  const startNew = () => {
    setAppState(prev => ({
      ...prev,
      selectedPreset: null,
      escConnector: null,
      fcConnector: null,
      mappings: [],
    }));
    setStep(1);
  };

  const stepTitles = ['Welcome', 'Configure ESC', 'Configure FC', 'Visualizer'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            StackMapper
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Configure your ESC and Flight Controller, then map pins visually. Save and reuse with presets.
          </p>
        </header>

        {/* Stepper */}
        <ol className="flex items-center justify-between mb-6">
          {stepTitles.map((t, i) => (
            <li key={t} className="flex-1 flex items-center">
              <div className={`flex items-center gap-2 ${i <= step ? 'text-indigo-600' : 'text-gray-400'}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold border ${i <= step ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300'}`}>{i}</span>
                <span className="hidden sm:block text-sm font-medium">{t}</span>
              </div>
              {i < stepTitles.length - 1 && <div className={`flex-1 h-px mx-2 ${i < step ? 'bg-indigo-600' : 'bg-gray-300'}`} />}
            </li>
          ))}
        </ol>

        {/* Step 0: Welcome & Presets */}
        {step === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Welcome</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Start a new mapping or load an existing preset.</p>
              <button
                onClick={startNew}
                className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Create New Mapping
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Presets</h2>
              <PresetManager
                presets={appState.presets}
                selectedPreset={appState.selectedPreset}
                onPresetsChange={updatePresets}
                onPresetSelect={loadPreset}
                currentState={appState}
              />
            </div>
          </div>
        )}

        {/* Step 1: ESC */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Configure ESC</h2>
              <div className="flex gap-2">
                <button onClick={() => setStep(0)} className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200">Back</button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!appState.escConnector}
                  className={`px-3 py-1 text-sm rounded ${appState.escConnector ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                >
                  Save & Continue
                </button>
              </div>
            </div>
            <ConnectorConfiguration
              type="ESC"
              connector={appState.escConnector}
              onConnectorChange={updateESCConnector}
            />
          </div>
        )}

        {/* Step 2: FC */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Configure Flight Controller</h2>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200">Back</button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!appState.fcConnector}
                  className={`px-3 py-1 text-sm rounded ${appState.fcConnector ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                >
                  Save & Continue
                </button>
              </div>
            </div>
            <ConnectorConfiguration
              type="FC"
              connector={appState.fcConnector}
              onConnectorChange={updateFCConnector}
            />
          </div>
        )}

        {/* Step 3: Visualizer */}
        {step === 3 && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Pinout Mapping Visualizer</h2>
                <div className="flex gap-2">
                  <button onClick={() => setStep(1)} className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600">Edit ESC</button>
                  <button onClick={() => setStep(2)} className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600">Edit FC</button>
                  <button onClick={() => setStep(0)} className="px-3 py-1 text-sm rounded text-gray-100 bg-gray-700 hover:bg-gray-800">Start Over</button>
                </div>
              </div>
              {appState.escConnector && appState.fcConnector ? (
                <PinoutVisualizer
                  escConnector={appState.escConnector}
                  fcConnector={appState.fcConnector}
                  mappings={appState.mappings}
                  onMappingsChange={updateMappings}
                  onQuickSave={quickSavePreset}
                />
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300">Both connectors must be configured before mapping.</p>
              )}
            </div>

            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Save / Load Presets</h2>
              <PresetManager
                presets={appState.presets}
                selectedPreset={appState.selectedPreset}
                onPresetsChange={updatePresets}
                onPresetSelect={loadPreset}
                currentState={appState}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
