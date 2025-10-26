# ESC to FC Pinout Helper

A Next.js application that helps users match ESC (Electronic Speed Controller) pinouts to Flight Controller pinouts with an intuitive drag-and-drop interface and animated wire connections.

![ESC to FC Pinout Helper](https://img.shields.io/badge/Next.js-15.0.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-blue)

## Features

### ✨ Interactive Pinout Matching
- **Drag-and-Drop Interface**: Simply drag from one connector's pin to another to create wire connections
- **Animated Wire Cables**: Realistic curved wire animations with flow effects and glowing highlights
- **Visual Feedback**: Pins glow and animate when connected, with realistic wire physics

### 🔧 Configurable Connectors
- **Variable Pin Counts**: Support for 4, 6, 8, 10, 12, 14, and 16-pin connectors
- **Custom Pin Functions**: Define pin functions (Power, Ground, Signal, Telemetry, Data, etc.)
- **Color-Coded Wires**: Each pin has a customizable color for easy identification

### 💾 Preset Management
- **Save Configurations**: Save your pinout mappings as named presets
- **Local Storage**: Presets are automatically saved in your browser
- **Import/Export**: Export presets as JSON files and import them later
- **API Integration**: Backend API for preset management (JSON file storage, expandable to database)

### 🎨 Modern UI/UX
- **Dark/Light Mode**: Automatic theme detection with manual override
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Validation**: Visual indicators for connection status and errors
- **Accessibility**: Keyboard navigation and screen reader support

## Technology Stack

- **Frontend**: Next.js 15 with React 18
- **Styling**: Tailwind CSS with custom animations
- **Language**: TypeScript for type safety
- **Storage**: Local Storage + JSON file API (database-ready)
- **Animations**: Custom CSS animations and SVG for wire effects

## Getting Started

### Prerequisites
- Node.js 20.9.0 or higher
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stack-helper
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## Usage

### Creating Connectors

1. **Configure ESC Connector**
   - Choose pin count (4-16 pins)
   - Set connector name
   - Define pin functions and colors

2. **Configure FC Connector**
   - Choose pin count (4-16 pins)
   - Set connector name
   - Define pin functions and colors

### Making Connections

1. **Drag and Drop**
   - Click and drag from any ESC pin to any FC pin
   - Animated wire appears showing the connection
   - Wire color matches the source pin color

2. **Remove Connections**
   - Click the red 'X' button on any wire
   - Or click on connected pins to remove mapping

### Managing Presets

1. **Save Preset**
   - Create your pin mappings
   - Click "Save Current Configuration"
   - Enter name and description
   - Preset is saved locally and via API

2. **Load Preset**
   - Select from saved presets list
   - Click "Load" to apply the configuration

3. **Export/Import**
   - Export presets as JSON files
   - Import presets from JSON files

## API Endpoints

### Presets API (`/api/presets`)

- **GET** `/api/presets` - Retrieve all presets
- **POST** `/api/presets` - Create a new preset
- **PUT** `/api/presets` - Update existing preset
- **DELETE** `/api/presets?id={id}` - Delete a preset

## Project Structure

```
src/
├── app/
│   ├── api/presets/route.ts    # Preset API endpoints
│   ├── globals.css             # Global styles and animations
│   ├── layout.tsx              # App layout
│   └── page.tsx                # Main application page
├── components/
│   ├── ConnectorConfiguration.tsx  # Connector setup component
│   ├── PinoutVisualizer.tsx       # Main drag-drop interface
│   └── PresetManager.tsx          # Preset management component
└── types/
    └── index.ts                # TypeScript type definitions
```

## Development Tasks

The project includes VS Code tasks for common operations:

- **Start Development Server**: `Ctrl+Shift+P` → "Tasks: Run Task" → "Start Development Server"
- **Build Project**: `Ctrl+Shift+P` → "Tasks: Run Task" → "Build Project"

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Enhancements

- [ ] Database integration for preset storage
- [ ] User authentication and cloud sync
- [ ] 3D connector visualization
- [ ] Connector library with common ESC/FC models
- [ ] Wire gauge and current rating calculations
- [ ] PCB layout export
- [ ] Mobile app version

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions, issues, or contributions, please open an issue on GitHub or contact the development team.
