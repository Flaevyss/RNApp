import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// @ts-ignore
export function App() {
  // @ts-ignore
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
