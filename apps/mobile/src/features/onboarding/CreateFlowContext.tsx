import { createContext, useContext, useState, type ReactNode } from 'react';

type Flow = { date: string | null; setDate: (date: string | null) => void };
const Context = createContext<Flow | null>(null);
export function CreateFlowProvider({ children }: { children: ReactNode }) {
  const [date, setDate] = useState<string | null>(null);
  return <Context.Provider value={{ date, setDate }}>{children}</Context.Provider>;
}
export function useCreateFlow() {
  const value = useContext(Context);
  if (!value) throw new Error('CreateFlowProvider missing');
  return value;
}
