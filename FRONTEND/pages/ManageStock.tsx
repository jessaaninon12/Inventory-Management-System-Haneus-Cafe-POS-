import React from 'react';
import { Search, Plus, FileText } from 'lucide-react';

export default function ManageStock() {
  const stockItems = [
    { id: '#1005', name: 'Espresso Beans (1kg)', stock: '68 kg', lastUpdated: 'Today, 14:22' },
    { id: '#1004', name: 'Almond Milk (1L)', stock: '8 L', lastUpdated: 'Yesterday, 09:15', critical: true },
    { id: '#1002', name: 'Caramel Latte (ready-to-serve)', stock: '142', lastUpdated: '2 hours ago' },
    { id: '#1018', name: 'Whipped Cream Can (400g)', stock: '6 cans', lastUpdated: '3 days ago', critical: true },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-espresso">Manage Stock</h1>
        <p className="text-mocha text-sm">Adjust inventory quantities, record incoming stock, or correct counts</p>
      </header>

      <div className="bg-white p-4 rounded-xl shadow-md border border-latte/30 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha/70" />
          <input
            type="text"
            placeholder="Search by product name or ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-cream border border-latte rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <button className="px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Receive New Stock</span>
        </button>
        <button className="px-5 py-2.5 bg-white border border-latte text-espresso rounded-lg font-medium hover:bg-latte/20 transition-colors">
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-latte/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-cream border-b border-latte">
                <th className="px-6 py-4 font-semibold text-espresso">Product</th>
                <th className="px-6 py-4 font-semibold text-espresso">ID</th>
                <th className="px-6 py-4 font-semibold text-espresso">Current Stock</th>
                <th className="px-6 py-4 font-semibold text-espresso">Adjust</th>
                <th className="px-6 py-4 font-semibold text-espresso">Last Updated</th>
                <th className="px-6 py-4 font-semibold text-espresso text-center">History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-latte">
              {stockItems.map((item) => (
                <tr key={item.id} className="hover:bg-latte/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-espresso">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-mocha">{item.id}</td>
                  <td className={`px-6 py-4 font-bold ${item.critical ? 'text-red-600' : 'text-green-600'}`}>
                    {item.stock}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-latte/20 rounded-lg p-1">
                        <button className="w-8 h-8 flex items-center justify-center font-bold hover:bg-latte/40 rounded-md transition-colors">-</button>
                        <input type="number" defaultValue="0" className="w-16 bg-transparent text-center font-medium focus:outline-none" />
                        <button className="w-8 h-8 flex items-center justify-center font-bold hover:bg-latte/40 rounded-md transition-colors">+</button>
                      </div>
                      <button className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-all">
                        Apply
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-mocha">{item.lastUpdated}</td>
                  <td className="px-6 py-4 text-center">
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-full hover:bg-primary/20 transition-colors">
                      <FileText className="w-3 h-3" />
                      <span>View log</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
