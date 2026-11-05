import { NativeTabs } from 'expo-router/native-tabs';

import { useApp } from '@/ui/app-context';
import { useColors } from '@/ui/theme-context';

export default function TabsLayout() {
  const colors = useColors();
  const { session } = useApp();
  // Sem perfil (primeira abertura ou dados apagados) as abas não desenham: o layout raiz leva ao onboarding.
  if (!session) return null;
  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.accentSoft}
      labelVisibilityMode="labeled"
      tintColor={colors.accent}
      iconColor={{ default: colors.textSubtle, selected: colors.accent }}
      labelStyle={{ default: { color: colors.textSubtle }, selected: { color: colors.accent } }}>
      <NativeTabs.Trigger name="inicio">
        <NativeTabs.Trigger.Label>Início</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="movimentacoes">
        {/* Rótulo curto: "Movimentações" não cabe na barra; a tela mantém o título completo. */}
        <NativeTabs.Trigger.Label>Extrato</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.bullet.rectangle" md="receipt_long" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="planejamento">
        <NativeTabs.Trigger.Label>Planejamento</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'chart.pie', selected: 'chart.pie.fill' }} md="pie_chart" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="assistente">
        <NativeTabs.Trigger.Label>Assistente</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }} md="forum" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ajustes">
        <NativeTabs.Trigger.Label>Ajustes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
