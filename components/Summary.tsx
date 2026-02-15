'use client';

import { BillSummary, Person } from '@/lib/calculations';
import { colorClasses } from './PersonChip';

interface SummaryProps {
  summary: BillSummary;
  people: Person[];
}

export default function Summary({ summary, people }: SummaryProps) {
  if (summary.perPerson.length === 0) {
    return null;
  }

  // Create a lookup map for person colors
  const personColorMap = new Map(people.map(p => [p.id, p.color]));

  return (
    <div className="">
      <div className="flex items-center text-slate-700 mb-3">
        <h2 className="text-xl flex-1 font-semibold">Final calculation</h2>

        <span className="font-medium tabular-nums">Total bill: ${summary.totalBill.toFixed(2)}</span>
      </div>


      <div className="grid grid-flow-row grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-20">
        {summary.perPerson.map((person) => {
          const color = personColorMap.get(person.personId) || 'blue';
          const colors = colorClasses[color] || colorClasses.blue;
          return (
            <div
              key={person.personId}
              className="bg-white rounded-lg border border-slate-200 hover:shadow-lg overflow-hidden"
            >
              {/* Header with person's color */}
              <div className={`${colors.bg} px-4 py-2 flex justify-between items-center`}>
                <span className="font-semibold text-white text-base">{person.personName}</span>
                <span className="text-base font-bold text-white tabular-nums">
                  ${person.total.toFixed(2)}
                </span>
              </div>

              {/* Breakdown */}
              <div className="p-4 space-y-1.5">
                {person.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-slate-600">
                      {item.name}
                      {item.shared && (
                        <span className="text-slate-400 ml-1.5 text-xs">
                          / {item.sharedWith} people
                        </span>
                      )}
                    </span>
                    <span className="text-slate-700 tabular-nums font-medium">${item.amount.toFixed(2)}</span>
                  </div>
                ))}

                {(person.tax > 0 || person.tip > 0) && (
                  <>
                    <div className="h-px bg-slate-200 mt-2" />
                    <div className="pt-1.5 space-y-1">
                      {person.tax > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Tax</span>
                          <span className="text-slate-500 tabular-nums">${person.tax.toFixed(2)}</span>
                        </div>
                      )}
                      {person.tip > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Tip</span>
                          <span className="text-slate-500 tabular-nums">${person.tip.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
