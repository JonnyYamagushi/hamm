import { Redirect } from 'expo-router';

/** A raiz abre o Início; o layout manda para o onboarding se ainda não houver perfil. */
export default function Index() {
  return <Redirect href="/inicio" />;
}
