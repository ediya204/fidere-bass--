import { BaasDemoProvider } from 'src/contexts/baas-demo-context';

// ----------------------------------------------------------------------

export default function Layout({ children }: { children: React.ReactNode }) {
  return <BaasDemoProvider>{children}</BaasDemoProvider>;
}
