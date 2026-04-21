import React from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import { SidebarProvider } from './SidebarContext';
import type { MenuItem } from './Sidebar';

interface AppShellProps {
  menuItems: MenuItem[];
  children: React.ReactNode;
}

export default function AppShell({ menuItems, children }: AppShellProps) {
  return (
    <SidebarProvider>
      <TopBar />
      <Sidebar menuItems={menuItems} />
      <main className="lg:ml-64 p-4 min-h-[calc(100vh-3.5rem)] bg-gray-50">
        {children}
      </main>
    </SidebarProvider>
  );
}
