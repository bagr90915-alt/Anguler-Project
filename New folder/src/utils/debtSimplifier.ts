import { Member, Expense, Settlement, MemberBalance, SimplifiedDebt } from '../types';

/**
 * Calculates net balances for all members in a group using JavaScript array operations:
 * .reduce(), .map(), .filter(), and .find().
 */
export function calculateMemberBalances(
  members: Member[],
  expenses: Expense[],
  settlements: Settlement[]
): MemberBalance[] {
  // Initialize balance dictionary
  const balances: Record<string, { totalPaid: number; totalOwed: number }> = {};
  members.forEach((m) => {
    balances[m.id] = { totalPaid: 0, totalOwed: 0 };
  });

  // 1. Process Expenses
  expenses.forEach((expense) => {
    // Add to payer's total paid
    if (balances[expense.payerId]) {
      balances[expense.payerId].totalPaid += expense.amount;
    }

    // Add each split amount to member's total owed
    expense.splits.forEach((split) => {
      if (balances[split.memberId]) {
        balances[split.memberId].totalOwed += split.amount;
      }
    });
  });

  // 2. Process Settlements (debt payments made between members)
  settlements.forEach((settlement) => {
    // Debtor paid money to creditor
    if (balances[settlement.fromMemberId]) {
      balances[settlement.fromMemberId].totalPaid += settlement.amount;
    }
    if (balances[settlement.toMemberId]) {
      balances[settlement.toMemberId].totalOwed += settlement.amount;
    }
  });

  // 3. Map into MemberBalance array
  return members.map((member) => {
    const data = balances[member.id] || { totalPaid: 0, totalOwed: 0 };
    // Round to 2 decimal places to avoid IEEE floating point inaccuracies
    const totalPaid = Math.round(data.totalPaid * 100) / 100;
    const totalOwed = Math.round(data.totalOwed * 100) / 100;
    const netBalance = Math.round((totalPaid - totalOwed) * 100) / 100;

    return {
      memberId: member.id,
      member,
      totalPaid,
      totalOwed,
      netBalance,
    };
  });
}

/**
 * Calculates pairwise debts directly from each expense, before simplification.
 * E.g., if Alex paid $30 for lunch split equally between Alex, Maya, Jordan:
 * Maya owes Alex $10, Jordan owes Alex $10.
 */
export function calculatePairwiseDebts(
  expenses: Expense[],
  settlements: Settlement[]
): SimplifiedDebt[] {
  // Directed debt matrix: debtMatrix[debtorId][creditorId] = amount
  const debtMatrix: Record<string, Record<string, number>> = {};

  const ensureMatrix = (d: string, c: string) => {
    if (!debtMatrix[d]) debtMatrix[d] = {};
    if (debtMatrix[d][c] === undefined) debtMatrix[d][c] = 0;
  };

  // Add debts from expenses
  expenses.forEach((exp) => {
    const creditor = exp.payerId;
    exp.splits.forEach((split) => {
      const debtor = split.memberId;
      if (debtor !== creditor && split.amount > 0) {
        ensureMatrix(debtor, creditor);
        debtMatrix[debtor][creditor] += split.amount;
      }
    });
  });

  // Deduct settlements
  settlements.forEach((stl) => {
    ensureMatrix(stl.fromMemberId, stl.toMemberId);
    debtMatrix[stl.fromMemberId][stl.toMemberId] -= stl.amount;
  });

  // Net out bilateral pairs: if A owes B $20 and B owes A $5, then A owes B $15.
  const debtors = Object.keys(debtMatrix);
  const pairwiseDebts: SimplifiedDebt[] = [];
  const processedPairs = new Set<string>();

  debtors.forEach((d) => {
    Object.keys(debtMatrix[d] || {}).forEach((c) => {
      const pairKey = [d, c].sort().join(':');
      if (processedPairs.has(pairKey)) return;
      processedPairs.add(pairKey);

      const dOwesC = debtMatrix[d]?.[c] || 0;
      const cOwesD = debtMatrix[c]?.[d] || 0;
      const net = Math.round((dOwesC - cOwesD) * 100) / 100;

      if (net > 0.01) {
        pairwiseDebts.push({
          fromMemberId: d,
          toMemberId: c,
          amount: net,
        });
      } else if (net < -0.01) {
        pairwiseDebts.push({
          fromMemberId: c,
          toMemberId: d,
          amount: Math.abs(net),
        });
      }
    });
  });

  return pairwiseDebts;
}

/**
 * Greedy Min-Cash-Flow Algorithm:
 * Reduces arbitrary cross-debts to the minimum number of transactions ($N-1$ max).
 * Uses .sort(), .filter(), and iteration over creditors and debtors.
 */
export function calculateSimplifiedDebts(
  memberBalances: MemberBalance[]
): SimplifiedDebt[] {
  // Separate into debtors and creditors (ignoring near-zero balances)
  const debtors: { memberId: string; amount: number }[] = [];
  const creditors: { memberId: string; amount: number }[] = [];

  memberBalances.forEach((b) => {
    const net = Math.round(b.netBalance * 100) / 100;
    if (net < -0.01) {
      debtors.push({ memberId: b.memberId, amount: Math.abs(net) });
    } else if (net > 0.01) {
      creditors.push({ memberId: b.memberId, amount: net });
    }
  });

  // Sort descending by magnitude for optimal greedy settlement
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const simplified: SimplifiedDebt[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settledAmount = Math.min(debtor.amount, creditor.amount);
    const roundedSettled = Math.round(settledAmount * 100) / 100;

    if (roundedSettled > 0.01) {
      simplified.push({
        fromMemberId: debtor.memberId,
        toMemberId: creditor.memberId,
        amount: roundedSettled,
      });
    }

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (Math.round(debtor.amount * 100) <= 0) {
      dIdx++;
    }
    if (Math.round(creditor.amount * 100) <= 0) {
      cIdx++;
    }
  }

  return simplified;
}
