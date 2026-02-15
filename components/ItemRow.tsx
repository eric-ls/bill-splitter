'use client';

import { Trash2 } from 'lucide-react';
import { BillItem, Person } from '@/lib/calculations';
import { colorClasses } from './PersonChip';
import Button from './Button';

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
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="!p-1 text-slate-400 hover:text-red-500 hover:bg-transparent"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
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
                className={`!px-2 !py-0.5 text-xs font-semibold !rounded-full border cursor-pointer ${isAssigned
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
