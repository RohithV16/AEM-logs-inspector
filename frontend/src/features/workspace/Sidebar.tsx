import { useState, useEffect } from 'react';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('aem_sidebarCollapsed') === '1';
  });

  useEffect(() => {
    localStorage.setItem('aem_sidebarCollapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  return (
    <aside className={collapsed ? 'collapsed' : ''}>
      <button onClick={() => setCollapsed(!collapsed)}>Toggle</button>
    </aside>
  );
}