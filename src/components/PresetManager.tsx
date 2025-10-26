'use client';

import { useState, useEffect } from 'react';
import { Preset, AppState } from '@/types';

interface PresetManagerProps {
  presets: Preset[];
  selectedPreset: string | null;
  onPresetsChange: (presets: Preset[]) => void;
  onPresetSelect: (presetId: string) => void;
  currentState: AppState;
}

export default function PresetManager({
  presets,
  selectedPreset,
  onPresetsChange,
  onPresetSelect,
  currentState,
}: PresetManagerProps) {
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    // Load presets from localStorage on mount
    const savedPresets = localStorage.getItem('esc-fc-presets');
    if (savedPresets) {
      try {
        const parsed = JSON.parse(savedPresets);
        onPresetsChange(parsed);
      } catch (error) {
        console.error('Failed to load presets:', error);
      }
    }
  }, [onPresetsChange]);

  const savePreset = () => {
    if (!currentState.escConnector || !currentState.fcConnector || !presetName.trim()) {
      return;
    }

    const newPreset: Preset = {
      id: `preset-${Date.now()}`,
      name: presetName.trim(),
      description: presetDescription.trim(),
      escConnector: currentState.escConnector,
      fcConnector: currentState.fcConnector,
      mappings: currentState.mappings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedPresets = [...presets, newPreset];
    onPresetsChange(updatedPresets);

    // Save to localStorage
    localStorage.setItem('esc-fc-presets', JSON.stringify(updatedPresets));

    // Reset form
    setPresetName('');
    setPresetDescription('');
    setShowSaveForm(false);
  };

  const loadPreset = (preset: Preset) => {
    // This would update the app state with the preset data
    // For now, we'll just select it
    onPresetSelect(preset.id);
  };

  const deletePreset = (presetId: string) => {
    const updatedPresets = presets.filter(p => p.id !== presetId);
    onPresetsChange(updatedPresets);
    localStorage.setItem('esc-fc-presets', JSON.stringify(updatedPresets));

    if (selectedPreset === presetId) {
      onPresetSelect('');
    }
  };

  const beginEdit = (preset: Preset) => {
    setEditingId(preset.id);
    setEditName(preset.name);
    setEditDescription(preset.description || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
  };

  const saveEdit = (presetId: string) => {
    const updatedPresets = presets.map(p =>
      p.id === presetId
        ? { ...p, name: editName.trim() || p.name, description: editDescription.trim(), updatedAt: new Date().toISOString() }
        : p
    );
    onPresetsChange(updatedPresets);
    localStorage.setItem('esc-fc-presets', JSON.stringify(updatedPresets));
    cancelEdit();
  };

  // Allow saving as long as both connectors exist; mappings can be zero
  const canSavePreset = Boolean(currentState.escConnector && currentState.fcConnector);

  return (
    <div className="space-y-4">
      {/* Save Preset Section */}
      {canSavePreset && (
        <div className="space-y-3">
          {!showSaveForm ? (
            <button
              onClick={() => setShowSaveForm(true)}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Save Current Configuration
            </button>
          ) : (
            <div className="space-y-3 p-3 border border-gray-300 rounded-md dark:border-gray-600">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Preset name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />

              <textarea
                value={presetDescription}
                onChange={(e) => setPresetDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />

              <div className="flex space-x-2">
                <button
                  onClick={savePreset}
                  disabled={!presetName.trim()}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveForm(false);
                    setPresetName('');
                    setPresetDescription('');
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Presets List */}
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900 dark:text-white">
          Saved Presets ({presets.length})
        </h3>

        {presets.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No presets saved yet. Create a configuration and save it as a preset.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className={`p-3 border rounded-md ${
                  selectedPreset === preset.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    {editingId === preset.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="Preset name"
                        />
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={2}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="Description (optional)"
                        />
                      </div>
                    ) : (
                      <>
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                          {preset.name}
                        </h4>
                        {preset.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {preset.description}
                          </p>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {preset.escConnector.name} → {preset.fcConnector.name}
                          <br />
                          {preset.mappings.length} mappings
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-1 ml-2">
                    {editingId === preset.id ? (
                      <>
                        <button
                          onClick={() => saveEdit(preset.id)}
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => loadPreset(preset)}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => beginEdit(preset)}
                          className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deletePreset(preset.id)}
                          className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export/Import Section */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
        <div className="space-y-2">
          <button
            onClick={() => {
              const dataStr = JSON.stringify(presets, null, 2);
              const dataBlob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'esc-fc-presets.json';
              link.click();
              URL.revokeObjectURL(url);
            }}
            disabled={presets.length === 0}
            className="w-full text-sm bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export Presets
          </button>

          <label className="block">
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const imported = JSON.parse(event.target?.result as string);
                      if (Array.isArray(imported)) {
                        const updatedPresets = [...presets, ...imported];
                        onPresetsChange(updatedPresets);
                        localStorage.setItem('esc-fc-presets', JSON.stringify(updatedPresets));
                      }
                    } catch (error) {
                      console.error('Failed to import presets:', error);
                      alert('Failed to import presets. Please check the file format.');
                    }
                  };
                  reader.readAsText(file);
                }
                // Reset the input
                e.target.value = '';
              }}
              className="hidden"
            />
            <span className="w-full text-sm bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer inline-block text-center">
              Import Presets
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
