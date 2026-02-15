export interface BillItem {
  id: string;
  name: string;
  price: number;
  assignedTo: string[]; // person IDs who pay for this item
}

export interface Person {
  id: string;
  name: string;
  color: string;
}

// Color palette for people - Tailwind color names
export const PERSON_COLORS = [
  'blue',
  'violet',
  'emerald',
  'orange',
  'pink',
  'cyan',
  'fuchsia',
  'lime',
  'red',
  'amber',
] as const;

export type PersonColor = typeof PERSON_COLORS[number];

export function getNextColor(existingPeople: Person[]): PersonColor {
  if (existingPeople.length === 0) {
    return PERSON_COLORS[0];
  }
  // Get the color of the last person added and use the next one in sequence
  const lastPerson = existingPeople[existingPeople.length - 1];
  const lastColorIndex = PERSON_COLORS.indexOf(lastPerson.color as PersonColor);
  return PERSON_COLORS[(lastColorIndex + 1) % PERSON_COLORS.length];
}

export interface PersonSummary {
  personId: string;
  personName: string;
  items: { name: string; amount: number; shared: boolean; sharedWith?: number }[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
}

export interface BillSummary {
  perPerson: PersonSummary[];
  totalBill: number;
  subtotal: number;
  tax: number;
  tip: number;
}

export function calculateSplit(
  items: BillItem[],
  people: Person[],
  tax: number,
  tipAmount: number
): BillSummary {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);

  // Calculate each person's share of the subtotal
  const personSubtotals: Record<string, number> = {};
  const personItems: Record<string, PersonSummary['items']> = {};

  // Initialize
  people.forEach((p) => {
    personSubtotals[p.id] = 0;
    personItems[p.id] = [];
  });

  // Distribute items
  items.forEach((item) => {
    const payers = item.assignedTo.length > 0 ? item.assignedTo : people.map((p) => p.id);
    const shareAmount = item.price / payers.length;
    const isShared = payers.length > 1;

    payers.forEach((personId) => {
      if (personSubtotals[personId] !== undefined) {
        personSubtotals[personId] += shareAmount;
        personItems[personId].push({
          name: item.name,
          amount: shareAmount,
          shared: isShared,
          sharedWith: isShared ? payers.length : undefined,
        });
      }
    });
  });

  // Calculate proportional tax and tip for each person
  const perPerson: PersonSummary[] = people.map((person) => {
    const personSubtotal = personSubtotals[person.id];
    const proportion = subtotal > 0 ? personSubtotal / subtotal : 1 / people.length;
    const personTax = tax * proportion;
    const personTip = tipAmount * proportion;

    return {
      personId: person.id,
      personName: person.name,
      items: personItems[person.id],
      subtotal: personSubtotal,
      tax: personTax,
      tip: personTip,
      total: personSubtotal + personTax + personTip,
    };
  });

  return {
    perPerson,
    totalBill: subtotal + tax + tipAmount,
    subtotal,
    tax,
    tip: tipAmount,
  };
}

export function calculateTipFromPercent(subtotal: number, tax: number, percent: number): number {
  // Tip is calculated on subtotal (pre-tax)
  return subtotal * (percent / 100);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
