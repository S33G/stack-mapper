import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const PRESETS_FILE = path.join(process.cwd(), 'data', 'presets.json');

async function ensureDataDirectory() {
  const dataDir = path.dirname(PRESETS_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

async function readPresets() {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(PRESETS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet, return empty array
    return [];
  }
}

async function writePresets(presets: any[]) {
  await ensureDataDirectory();
  await fs.writeFile(PRESETS_FILE, JSON.stringify(presets, null, 2));
}

export async function GET() {
  try {
    const presets = await readPresets();
    return NextResponse.json(presets);
  } catch (error) {
    console.error('Failed to read presets:', error);
    return NextResponse.json({ error: 'Failed to read presets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newPreset = await request.json();
    const presets = await readPresets();

    // Add timestamp if not provided
    const preset = {
      ...newPreset,
      id: newPreset.id || `preset-${Date.now()}`,
      createdAt: newPreset.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    presets.push(preset);
    await writePresets(presets);

    return NextResponse.json(preset, { status: 201 });
  } catch (error) {
    console.error('Failed to save preset:', error);
    return NextResponse.json({ error: 'Failed to save preset' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updatedPreset = await request.json();
    const presets = await readPresets();

    const index = presets.findIndex((p: any) => p.id === updatedPreset.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
    }

    presets[index] = {
      ...updatedPreset,
      updatedAt: new Date().toISOString(),
    };

    await writePresets(presets);

    return NextResponse.json(presets[index]);
  } catch (error) {
    console.error('Failed to update preset:', error);
    return NextResponse.json({ error: 'Failed to update preset' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Preset ID is required' }, { status: 400 });
    }

    const presets = await readPresets();
    const filteredPresets = presets.filter((p: any) => p.id !== id);

    if (filteredPresets.length === presets.length) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
    }

    await writePresets(filteredPresets);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete preset:', error);
    return NextResponse.json({ error: 'Failed to delete preset' }, { status: 500 });
  }
}
