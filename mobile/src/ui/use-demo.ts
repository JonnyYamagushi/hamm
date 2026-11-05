import { useMemo } from 'react';

import { buildDemoData, type DemoData } from '@/domain/demo';
import { localDateOf } from '@/domain/local-date';

import { useApp } from './app-context';

/** Dados fictícios no perfil de demonstração ou com a prévia ligada em Ajustes; senão `null` (Fase 1: sem dados reais). */
export function useDemoData(): { data: DemoData; today: string } | null {
  const { session, demoPreview } = useApp();
  const isDemo = !!session?.profile.isDemo || demoPreview;
  const timeZone = session?.settings.timeZone ?? 'America/Sao_Paulo';
  const monthStartDay = session?.settings.monthStartDay ?? 1;
  const today = localDateOf(new Date(), timeZone);
  return useMemo(
    () => (isDemo ? { data: buildDemoData(today, monthStartDay), today } : null),
    [isDemo, today, monthStartDay],
  );
}
