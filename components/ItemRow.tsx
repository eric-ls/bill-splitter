'use client';

import { Trash2 } from 'lucide-react';
import { BillItem, Person } from '@/lib/calculations';
import { colorClasses } from './PersonChip';

interface ItemRowProps {
  item: BillItem;
  people: Person[];
  onUpdate: (updates: Partial<BillItem>) => void;
  onRemove: () => void;
  onToggleAssignment: (personId: string) => void;
  onSelectOnly: (personId: string) => void;
}

export default function ItemRow({
  item,
  people,
  onUpdate,
  onRemove,
  onToggleAssignment,
  onSelectOnly,
}: ItemRowProps) {
  const assignedSet = new Set(
    item.assignedTo.length > 0 ? item.assignedTo : people.map((p) => p.id)
  );

  return (
    <div className="bg-slate-100/80 p-3 rounded-lg space-y-2">
      {/* Item details row */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={item.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="flex-1 bg-transparent text-sm font-medium text-slate-800 min-w-0"
        />
        <span className="text-sm font-medium text-slate-700 tabular-nums">
          ${item.price.toFixed(2)}
        </span>
        <button
          onClick={onRemove}
          className="cursor-pointer p-1 text-slate-400 hover:text-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Assignment chips - only show when there are people */}
      {people.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {people.map((person) => {
            const isAssigned = assignedSet.has(person.id);
            const colors = colorClasses[person.color] || colorClasses.blue;
            return (
              <button
                key={person.id}
                onClick={() => onToggleAssignment(person.id)}
                onDoubleClick={() => onSelectOnly(person.id)}
                className={`border px-2 py-0.5 text-xs font-semibold rounded-full transition-colors cursor-pointer ${isAssigned
                  ? `${colors.text} ${colors.bgLight} ${colors.border}`
                  : 'text-slate-500 border-slate-300'
                  }`}
              >
                {person.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
