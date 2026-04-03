"use client";

import { GestorProvider } from "@/context/GestorContext";
import NewTaskModal from "@/components/NewTaskModal";
import NewOperadorModal from "@/components/NewOperadorModal";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GestorProvider>
      {children}
      <NewTaskModal />
      <NewOperadorModal />
    </GestorProvider>
  );
}
