'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2, AlertCircle, RotateCcw, Plus, ArrowRight } from 'lucide-react';
import { BillItem, Person, calculateSplit, calculateTipFromPercent, generateId, getNextColor } from '@/lib/calculations';
import { PeopleChips } from '@/components/PersonChip';
import ItemRow from '@/components/ItemRow';
import TipCalculator from '@/components/TipCalculator';
import Summary from '@/components/Summary';
import Input from '@/components/Input';
import Button from '@/components/Button';

interface ParsedReceipt {
  items: { name: string; price: number }[];
  tax?: number;
}

// Image handling utilities
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB (leaving buffer for 5MB API limit)
const MAX_DIMENSION = 2000; // Max width or height

function readAsDataURL(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function isSupported(file: File): boolean {
  return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
}

function isHeif(file: File): boolean {
  return file.type.includes('heif') || file.type.includes('heic') ||
    file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

async function compressImage(file: File | Blob): Promise<string> {
  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);

  // Calculate new dimensions
  let { width, height } = img;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // Draw to canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);

  // Try different quality levels to get under size limit
  for (const quality of [0.8, 0.6, 0.4, 0.3]) {
    const result = canvas.toDataURL('image/jpeg', quality);
    const size = Math.round((result.length - 'data:image/jpeg;base64,'.length) * 0.75);
    if (size <= MAX_IMAGE_SIZE) {
      return result;
    }
  }

  // Last resort: reduce dimensions further
  const smallerCanvas = document.createElement('canvas');
  smallerCanvas.width = Math.round(width * 0.5);
  smallerCanvas.height = Math.round(height * 0.5);
  const smallerCtx = smallerCanvas.getContext('2d')!;
  smallerCtx.drawImage(canvas, 0, 0, smallerCanvas.width, smallerCanvas.height);
  return smallerCanvas.toDataURL('image/jpeg', 0.5);
}

async function convertHeifToJpeg(file: File): Promise<Blob> {
  const heic2any = (await import('heic2any')).default;
  const result = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.9,
  });
  return Array.isArray(result) ? result[0] : result;
}

async function getImageBase64(file: File): Promise<string> {
  let processedFile: File | Blob = file;

  // Convert HEIF first
  if (isHeif(file)) {
    try {
      processedFile = await convertHeifToJpeg(file);
    } catch (err) {
      console.error('HEIF conversion error:', err);
      throw new Error('Failed to convert HEIF photo. Please try a different image.');
    }
  } else if (!isSupported(file)) {
    throw new Error('This image format is not supported. Please use JPEG, PNG, or HEIF.');
  }

  // Compress if needed
  return compressImage(processedFile);
}

export default function Home() {
  // State
  const [people, setPeople] = useState<Person[]>([]);
  const [items, setItems] = useState<BillItem[]>([]);
  const [tax, setTax] = useState(0);
  const [tipAmount, setTipAmount] = useState(0);

  // Form state
  const [personName, setPersonName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const itemNameInputRef = useRef<HTMLInputElement>(null);

  // Reset confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Calculation view state
  const [showCalculation, setShowCalculation] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const hasChanges = people.length > 0 || items.length > 0;
  const canContinue = items.length > 0 && people.length > 0;
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const summary = calculateSplit(items, people, tax, tipAmount);

  // People handlers
  const addPerson = () => {
    if (personName.trim()) {
      setPeople([...people, {
        id: generateId(),
        name: personName.trim(),
        color: getNextColor(people)
      }]);
      setPersonName('');
    }
  };

  const removePerson = (id: string) => {
    setPeople(people.filter((p) => p.id !== id));
    // Remove person from item assignments
    setItems(items.map(item => ({
      ...item,
      assignedTo: item.assignedTo.filter(pid => pid !== id)
    })));
  };

  // Item handlers
  const addItem = () => {
    const price = parseFloat(newItemPrice);
    if (newItemName.trim() && !isNaN(price) && price > 0) {
      setItems([...items, {
        id: generateId(),
        name: newItemName.trim(),
        price,
        assignedTo: [],
      }]);
      setNewItemName('');
      setNewItemPrice('');
      // Focus back on item name input and scroll into view
      setTimeout(() => {
        itemNameInputRef.current?.focus();
        itemNameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
    }
  };

  const updateItem = (id: string, updates: Partial<BillItem>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Upload handler
  const handleFileSelect = async (file: File) => {
    setUploadError(null);
    setIsUploading(true);

    try {
      const base64 = await getImageBase64(file);
      const response = await fetch('/api/parse-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse receipt');
      }

      const data: ParsedReceipt = await response.json();
      const newItems: BillItem[] = data.items.map((item) => ({
        id: generateId(),
        name: item.name,
        price: item.price,
        assignedTo: [],
      }));

      setItems(newItems);
      if (data.tax) setTax(data.tax);
      const newSubtotal = newItems.reduce((sum, item) => sum + item.price, 0);
      setTipAmount(calculateTipFromPercent(newSubtotal, data.tax || 0, 20));
    } catch (err) {
      console.error('Receipt processing error:', err);
      setUploadError(err instanceof Error ? err.message : 'Failed to parse receipt');
    } finally {
      setIsUploading(false);
    }
  };

  // Reset handler
  const handleReset = () => {
    setPeople([]);
    setItems([]);
    setTax(0);
    setTipAmount(0);
    setPersonName('');
    setNewItemName('');
    setNewItemPrice('');
    setUploadError(null);
    setShowResetConfirm(false);
    setShowCalculation(false);
    setShowSummary(false);
  };

  // Show summary and scroll to it
  const handleShowSummary = () => {
    setShowSummary(true);
    setTimeout(() => {
      summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Toggle person assignment on item
  const toggleAssignment = (itemId: string, personId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const currentAssigned = item.assignedTo.length > 0 ? item.assignedTo : people.map(p => p.id);
    let newAssigned: string[];

    if (currentAssigned.includes(personId)) {
      newAssigned = currentAssigned.filter(id => id !== personId);
      if (newAssigned.length === 0) return; // Can't unassign everyone
    } else {
      newAssigned = [...currentAssigned, personId];
    }

    // If all people are assigned, reset to empty (means "everyone")
    if (newAssigned.length === people.length) {
      newAssigned = [];
    }

    updateItem(itemId, { assignedTo: newAssigned });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-10 pt-[env(safe-area-inset-top)]">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold bg-blue-600 bg-clip-text text-transparent">
              Bill splitter
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              className={hasChanges ? 'visible' : 'invisible'}
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </div>
      </header>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Reset everything?</h3>
            <p className="text-slate-600 text-sm mb-6">This will clear all people, items, and calculations.</p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleReset}
                className="flex-1"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] md:overflow-hidden">
        {/* Two-column layout with animation - stacks on mobile */}
        <div className="flex flex-col md:flex-row gap-4 items-start">
          {/* Left Column - People + Items */}
          <div
            className={`space-y-4 w-full md:shrink-0 md:transition-all md:duration-500 md:ease-out ${showCalculation ? 'md:w-[calc(50%-0.5rem)]' : 'md:max-w-xl md:mx-auto'
              }`}
          >
            {/* People section */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h1 className="text-xl font-semibold text-slate-700 mb-6">Enter details</h1>
              <h2 className="text-base font-semibold text-slate-700 mb-4">People</h2>

              {/* People chips */}
              <div className="mb-4">
                <PeopleChips people={people} onRemove={removePerson} />
              </div>

              {/* Add person input */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPerson()}
                  placeholder="Add a person"
                />
                <Button
                  size="icon"
                  onClick={addPerson}
                  disabled={!personName.trim()}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>

              {/* Items section */}
              <div className="flex items-center justify-between mt-8">
                <h2 className="text-base font-semibold text-slate-700">Items</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing receipt...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      Upload receipt
                    </>
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </div>

              {/* Upload error */}
              {uploadError && (
                <div className="mb-4 p-2 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Items list */}
              <div className="space-y-2 mb-2 mt-2">
                {items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    people={people}
                    onUpdate={(updates) => updateItem(item.id, updates)}
                    onRemove={() => removeItem(item.id)}
                    onToggleAssignment={(personId) => toggleAssignment(item.id, personId)}
                    onSelectOnly={(personId) => updateItem(item.id, { assignedTo: [personId] })}
                  />
                ))}
              </div>

              {/* Add item form */}
              <div className="flex gap-2">
                <Input
                  ref={itemNameInputRef}
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem()}
                  placeholder="Item name"
                  className="flex-[2]"
                />
                <Input
                  type="text"
                  inputMode="decimal"
                  value={newItemPrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow numbers and one decimal point
                    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                      setNewItemPrice(value);
                    }
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && addItem()}
                  placeholder="0.00"
                  prefix="$"
                />
                <Button
                  size="icon"
                  onClick={addItem}
                  disabled={!newItemName.trim() || !newItemPrice}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>

              {/* Subtotal */}
              {items.length > 0 && (
                <div className="flex justify-between items-center pt-5 mt-5 border-t border-slate-100">
                  <span className="text-slate-600 font-medium">Subtotal</span>
                  <span className="text-lg font-bold text-slate-900 tabular-nums">${subtotal.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Continue button - only show when not in calculation view */}
            {!showCalculation && (
              <Button
                size="lg"
                onClick={() => setShowCalculation(true)}
                disabled={!canContinue}
                className="w-full"
              >
                Enter tax & tip
                <ArrowRight className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Right Column - Tax & Tip */}
          <div
            className={`space-y-4 w-full md:shrink-0 md:transition-all md:duration-500 md:ease-out md:overflow-hidden ${showCalculation
              ? 'md:w-[calc(50%-0.5rem)] opacity-100'
              : 'hidden md:block md:w-0 md:opacity-0'
              }`}
          >
            {/* Tax & Tip */}
            {items.length > 0 && (
              <TipCalculator
                subtotal={subtotal}
                tax={tax}
                onTaxChange={setTax}
                tipAmount={tipAmount}
                onTipChange={setTipAmount}
              />
            )}

            {/* Show Summary CTA */}
            {!showSummary && items.length > 0 && people.length > 0 && (
              <Button
                size="lg"
                onClick={handleShowSummary}
                className="w-full"
              >
                Calculate split
                <ArrowRight className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Summary - Full width below columns */}
        {showSummary && items.length > 0 && people.length > 0 && (
          <div ref={summaryRef} className="mt-16">
            <Summary summary={summary} people={people} />
          </div>
        )}
      </div>
    </main>
  );
}
