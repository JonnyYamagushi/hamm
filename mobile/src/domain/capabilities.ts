// O que o ambiente atual permite (ADR-005). Recurso indisponível nunca quebra o app:
// aparece desabilitado com uma explicação simples.

export type Runtime = {
  platform: 'android' | 'ios' | 'web';
  /** Rodando dentro do Expo Go (só módulos nativos embutidos nele). */
  isExpoGo: boolean;
  biometricHardware: boolean;
  biometricEnrolled: boolean;
  /** Tipos de biometria cadastrados no aparelho. */
  hasFaceRecognition: boolean;
};

export type CapabilityId = 'biometrics' | 'encryptedDatabase' | 'googleDrive' | 'backgroundTasks';

export type Capability = {
  id: CapabilityId;
  title: string;
  status: 'available' | 'limited' | 'unavailable';
  explanation: string;
};

function biometrics(runtime: Runtime): Capability {
  const title = 'Digital ou rosto';
  if (!runtime.biometricHardware) {
    return { id: 'biometrics', title, status: 'unavailable', explanation: 'Este aparelho não tem leitor de digital ou rosto. Use o PIN.' };
  }
  if (!runtime.biometricEnrolled) {
    return {
      id: 'biometrics',
      title,
      status: 'unavailable',
      explanation: 'Nenhuma digital ou rosto cadastrado no aparelho. Cadastre nas configurações do celular.',
    };
  }
  if (runtime.isExpoGo && runtime.platform === 'ios' && runtime.hasFaceRecognition) {
    return {
      id: 'biometrics',
      title,
      status: 'limited',
      explanation: 'No Expo Go o Face ID não funciona: o iPhone pede o código dele no lugar. O PIN do app continua valendo.',
    };
  }
  return { id: 'biometrics', title, status: 'available', explanation: 'Pode ser usado para desbloquear o app.' };
}

export function computeCapabilities(runtime: Runtime): Capability[] {
  const nativeOnly = (id: CapabilityId, title: string, available: string, missing: string): Capability =>
    runtime.isExpoGo
      ? { id, title, status: 'unavailable', explanation: missing }
      : { id, title, status: 'available', explanation: available };

  return [
    biometrics(runtime),
    nativeOnly(
      'encryptedDatabase',
      'Banco de dados cifrado',
      'Os dados do app ficam cifrados no aparelho.',
      'No Expo Go o banco não tem cifra própria. Ele continua protegido pelo isolamento do app e pela criptografia do próprio celular. Cifra própria chega no app instalado (próximas versões).',
    ),
    nativeOnly(
      'googleDrive',
      'Backup no Google Drive',
      'Disponível a partir da versão com backup.',
      'O Expo Go não permite o login do Google. O backup por arquivo vai funcionar normalmente.',
    ),
    {
      id: 'backgroundTasks',
      title: 'Tarefas em segundo plano',
      status: runtime.isExpoGo ? 'unavailable' : 'limited',
      explanation: runtime.isExpoGo
        ? 'No Expo Go o app só trabalha enquanto está aberto.'
        : 'O sistema decide quando liberar; nada é garantido com o app fechado.',
    },
  ];
}

export function capabilityOf(capabilities: readonly Capability[], id: CapabilityId): Capability {
  const found = capabilities.find((c) => c.id === id);
  if (!found) throw new Error(`Capacidade desconhecida: ${id}`);
  return found;
}
