import { capabilityOf, computeCapabilities, type Runtime } from '../capabilities';

const base: Runtime = {
  platform: 'android',
  isExpoGo: false,
  biometricHardware: true,
  biometricEnrolled: true,
  hasFaceRecognition: false,
};

describe('capacidades do ambiente', () => {
  it('Success: app instalado no Android tem biometria, banco cifrado e Drive', () => {
    const caps = computeCapabilities(base);
    expect(capabilityOf(caps, 'biometrics').status).toBe('available');
    expect(capabilityOf(caps, 'encryptedDatabase').status).toBe('available');
    expect(capabilityOf(caps, 'googleDrive').status).toBe('available');
  });

  it('Expo Go não tem banco cifrado nem login do Google', () => {
    const caps = computeCapabilities({ ...base, isExpoGo: true });
    expect(capabilityOf(caps, 'encryptedDatabase').status).toBe('unavailable');
    expect(capabilityOf(caps, 'googleDrive').status).toBe('unavailable');
    expect(capabilityOf(caps, 'biometrics').status).toBe('available');
  });

  it('Face ID no Expo Go do iPhone fica limitado ao código do aparelho', () => {
    const caps = computeCapabilities({ ...base, platform: 'ios', isExpoGo: true, hasFaceRecognition: true });
    expect(capabilityOf(caps, 'biometrics').status).toBe('limited');
  });

  it('sem leitor ou sem cadastro, biometria indisponível', () => {
    expect(capabilityOf(computeCapabilities({ ...base, biometricHardware: false }), 'biometrics').status).toBe('unavailable');
    expect(capabilityOf(computeCapabilities({ ...base, biometricEnrolled: false }), 'biometrics').status).toBe('unavailable');
  });
});
