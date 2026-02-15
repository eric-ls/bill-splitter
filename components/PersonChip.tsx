'use client';

import { X } from 'lucide-react';
import { Person } from '@/lib/calculations';

// Map color names to Tailwind classes (static for purging)
export const colorClasses: Record<string, { bg: string; text: string; bgLight: string, border: string; }> = {
  blue: { bg: 'bg-blue-500', text: 'text-blue-600', bgLight: 'bg-blue-100', border: 'border-blue-500' },
  violet: { bg: 'bg-violet-500', text: 'text-violet-600', bgLight: 'bg-violet-100', border: 'border-violet-500' },
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', bgLight: 'bg-emerald-100', border: 'border-emerald-500' },
  orange: { bg: 'bg-orange-500', text: 'text-orange-600', bgLight: 'bg-orange-100', border: 'border-orange-500' },
  pink: { bg: 'bg-pink-500', text: 'text-pink-600', bgLight: 'bg-pink-100', border: 'border-pink-500' },
  cyan: { bg: 'bg-cyan-500', text: 'text-cyan-600', bgLight: 'bg-cyan-100', border: 'border-cyan-500' },
  fuchsia: { bg: 'bg-fuchsia-500', text: 'text-fuchsia-600', bgLight: 'bg-fuchsia-100', border: 'border-fuchsia-500' },
  lime: { bg: 'bg-lime-500', text: 'text-lime-600', bgLight: 'bg-lime-100', border: 'border-lime-500' },
  red: { bg: 'bg-red-500', text: 'text-red-600', bgLight: 'bg-red-100', border: 'border-red-500' },
  amber: { bg: 'bg-amber-500', text: 'text-amber-600', bgLight: 'bg-amber-100', border: 'border-amber-500' },
};

interface PersonChipProps {
  person: Person;
  onRemove?: (id: string) => void;
}

export function PersonChip({ person, onRemove }: PersonChipProps) {
  const colors = colorClasses[person.color] || colorClasses.blue;

  return (
    <div className={`flex items-center gap-1.5 border ${colors.text} ${colors.bgLight} ${colors.border} pl-3 pr-1.5 py-1.5 rounded-full text-sm`}>
      <span className="font-medium">{person.name}</span>
      {onRemove && (
        <button
          onClick={() => onRemove(person.id)}
          className="w-5 h-5 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30"
        >
          <X className="w-3 h-3" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

interface PeopleChipsProps {
  people: Person[];
  onRemove?: (id: string) => void;
}

export function PeopleChips({ people, onRemove }: PeopleChipsProps) {
  if (people.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {people.map((person) => (
        <PersonChip key={person.id} person={person} onRemove={onRemove} />
      ))}
    </div>
  );
}
