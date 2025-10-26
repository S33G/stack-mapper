'use client';

import { useState } from 'react';
import { Connector, Pin, PIN_FUNCTIONS, PIN_COLORS } from '@/types';

interface ConnectorConfigurationProps {
  type: 'ESC' | 'FC';
  connector: Connector | null;
  onConnectorChange: (connector: Connector) => void;
}

export default function ConnectorConfiguration({
  type,
  connector,
  onConnectorChange,
}: ConnectorConfigurationProps) {
  const [pinCount, setPinCount] = useState(8);
  const [connectorName, setConnectorName] = useState('');
  const [editingName, setEditingName] = useState<string>('');

  const createConnector = () => {
    const pins: Pin[] = Array.from({ length: pinCount }, (_, index) => ({
      id: index + 1,
      label: `Pin ${index + 1}`,
      color: PIN_COLORS[index % PIN_COLORS.length],
      function: PIN_FUNCTIONS[0],
    }));

    const newConnector: Connector = {
      id: `${type.toLowerCase()}-${Date.now()}`,
      name: connectorName || `${type} ${pinCount}-Pin`,
      type,
      pinCount,
      pins,
    };

    onConnectorChange(newConnector);
  };

  const updatePin = (pinId: number, updates: Partial<Pin>) => {
    if (!connector) return;

    const updatedPins = connector.pins.map(pin =>
      pin.id === pinId ? { ...pin, ...updates } : pin
    );

    onConnectorChange({
      ...connector,
      pins: updatedPins,
    });
  };

  return (
    <div className="space-y-4">
      {!connector ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Connector Name
            </label>
            <input
              type="text"
              value={connectorName}
              onChange={(e) => setConnectorName(e.target.value)}
              placeholder={`${type}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pin Count
            </label>
            <select
              value={pinCount}
              onChange={(e) => setPinCount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {[4, 6, 8, 10, 12, 14, 16].map(count => (
                <option key={count} value={count}>
                  {count} pins
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={createConnector}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create {type} Connector
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={editingName || connector.name}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => {
                  const newName = (editingName || connector.name).trim();
                  if (newName && newName !== connector.name) {
                    onConnectorChange({ ...connector, name: newName });
                  }
                }}
                placeholder={`${type} Name`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <button
                onClick={() => {
                  const newName = (editingName || connector.name).trim();
                  if (newName && newName !== connector.name) {
                    onConnectorChange({ ...connector, name: newName });
                  }
                }}
                className="px-3 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700"
                title="Save name"
              >
                Save
              </button>
            </div>
            <button
              onClick={() => onConnectorChange(null!)}
              className="text-red-600 hover:text-red-800 text-sm self-end sm:self-auto"
            >
              Reset
            </button>
          </div>

          <div className="space-y-2">
            {connector.pins.map((pin) => (
              <div
                key={pin.id}
                className="flex items-center space-x-2 p-2 border border-gray-200 rounded dark:border-gray-600"
              >
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: pin.color }}
                />

                <input
                  type="text"
                  value={pin.label}
                  onChange={(e) => updatePin(pin.id, { label: e.target.value })}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />

                <select
                  value={pin.function}
                  onChange={(e) => updatePin(pin.id, { function: e.target.value })}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {PIN_FUNCTIONS.map(func => (
                    <option key={func} value={func}>
                      {func}
                    </option>
                  ))}
                </select>

                <select
                  value={pin.color}
                  onChange={(e) => updatePin(pin.id, { color: e.target.value })}
                  className="w-16 px-1 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                >
                  {PIN_COLORS.map(color => (
                    <option key={color} value={color} style={{ backgroundColor: color }}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
