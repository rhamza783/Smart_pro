import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 font-bold text-xl border-b">POS System</div>
        <nav className="p-4 space-y-2">
          <Link to="/" className="block p-2 hover:bg-gray-100 rounded">Dashboard</Link>
          <Link to="/items" className="block p-2 hover:bg-gray-100 rounded">Items</Link>
          <Link to="/inventory" className="block p-2 hover:bg-gray-100 rounded">Inventory</Link>
          <Link to="/history" className="block p-2 hover:bg-gray-100 rounded">History</Link>
          <Link to="/clients" className="block p-2 hover:bg-gray-100 rounded">Clients</Link>
          <Link to="/reports" className="block p-2 hover:bg-gray-100 rounded">Reports</Link>
          <Link to="/config" className="block p-2 hover:bg-gray-100 rounded">Config</Link>
          <Link to="/login" className="block p-2 hover:bg-gray-100 rounded text-red-600">Logout</Link>
        </nav>
      </aside>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
