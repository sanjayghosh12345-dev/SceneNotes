// hooks/useBudget.ts
'use client';
import { useEffect, useMemo, useState } from 'react';
import { BUDGET_USD } from '@/lib/constants';

type Params = {
  spentUsd?: number;
  setSpentUsd?: (n: number) => void;
  lastUsd?: number;
  setLastUsd?: (n: number) => void;
};

export function useBudget(params: Params = {}) {
  const {
    spentUsd: extSpent,
    setSpentUsd: setExtSpent,
    lastUsd: extLast,
    setLastUsd: setExtLast,
  } = params;

  // internal state if no external provided
  const [intSpent, setIntSpent] = useState(0);
  const [intLast, setIntLast] = useState(0);

  const spentUsd = extSpent ?? intSpent;
  const setSpentUsd = setExtSpent ?? setIntSpent;
  const lastUsd = extLast ?? intLast;
  const setLastUsd = setExtLast ?? setIntLast;

  // hydrate only when using internal state
  useEffect(() => {
    if (extSpent !== undefined) return; // controlled → skip hydration
    const s = Number(window.localStorage.getItem('sn_spent_usd') ?? '0');
    if (!Number.isNaN(s)) setIntSpent(s);
  }, [extSpent]);

  useEffect(() => {
    if (extSpent !== undefined) return; // controlled → skip persistence
    window.localStorage.setItem('sn_spent_usd', String(intSpent));
  }, [extSpent, intSpent]);

  const remaining = useMemo(
    () => Math.max(0, BUDGET_USD - spentUsd),
    [spentUsd]
  );

  function addCost(usd: number) {
    if (!Number.isFinite(usd)) return;
    setLastUsd(usd);
    setSpentUsd(spentUsd + usd);
  }

  function resetSpend() {
    setSpentUsd(0);
    setLastUsd(0);
    if (extSpent === undefined) {
      window.localStorage.removeItem('sn_spent_usd');
    }
  }

  return { spentUsd, lastUsd, remaining, addCost, resetSpend };
}
