import React from 'react';

export default function Sales() {
  const sales = [
    { id: '#ORD-20260301-047', customer: 'Juan Dela Cruz', time: 'Mar 01, 2026 • 19:45', items: '3 items', total: '₱385.00', status: 'Completed' },
    { id: '#ORD-20260301-046', customer: 'Maria Santos', time: 'Mar 01, 2026 • 18:12', items: '5 items', total: '₱720.00', status: 'Pending' },
    { id: '#ORD-20260301-045', customer: 'Pedro Reyes', time: 'Mar 01, 2026 • 17:30', items: '2 items', total: '₱190.00', status: 'Completed' },
    { id: '#ORD-20260301-044', customer: 'Anna Lim', time: 'Mar 01, 2026 • 15:55', items: '4 items', total: '₱520.00', status: 'Cancelled' },
  ];

  return (
    <div className="space-y-8">
      <header className="bg-white p-6 rounded-xl border border-latte shadow-sm">
        <h1 className="text-2xl font-bold text-espresso">Sales & Orders</h1>
        <p className="text-mocha text-sm mt-1">View and manage all transactions and customer orders</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Today's Sales", value: '₱12,840' },
          { label: 'This Week', value: '₱78,920' },
          { label: 'Pending Orders', value: '14' },
          { label: 'Average Order', value: '₱285' },
        ].map((card) => (
          <div key={card.label} className="bg-white p-6 rounded-xl shadow-md border border-latte/30 text-center">
            <p className="text-mocha text-sm mb-2">{card.label}</p>
            <div className="text-2xl font-bold text-espresso">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white p-5 rounded-xl shadow-md border border-latte/30 flex flex-wrap gap-4 items-center">
        <input 
          type="text" 
          placeholder="Search by order ID, customer, or amount..." 
          className="flex-1 min-w-[240px] px-4 py-2.5 bg-cream border border-latte rounded-lg text-sm focus:outline-none focus:border-primary"
        />
        <select className="px-4 py-2.5 bg-cream border border-latte rounded-lg text-sm focus:outline-none">
          <option>All Status</option>
          <option>Completed</option>
          <option>Pending</option>
          <option>Cancelled</option>
        </select>
        <select className="px-4 py-2.5 bg-cream border border-latte rounded-lg text-sm focus:outline-none">
          <option>Today</option>
          <option>This Week</option>
          <option>This Month</option>
        </select>
        <button className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors">
          Export Sales
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-latte/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-cream border-b border-latte">
                <th className="px-6 py-4 font-semibold text-espresso">Order ID</th>
                <th className="px-6 py-4 font-semibold text-espresso">Customer</th>
                <th className="px-6 py-4 font-semibold text-espresso">Date / Time</th>
                <th className="px-6 py-4 font-semibold text-espresso">Items</th>
                <th className="px-6 py-4 font-semibold text-espresso">Total</th>
                <th className="px-6 py-4 font-semibold text-espresso">Status</th>
                <th className="px-6 py-4 font-semibold text-espresso">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-latte">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-latte/5 transition-colors">
                  <td className="px-6 py-4 text-sm text-mocha">{sale.id}</td>
                  <td className="px-6 py-4 font-medium text-espresso">{sale.customer}</td>
                  <td className="px-6 py-4 text-sm text-mocha">{sale.time}</td>
                  <td className="px-6 py-4 text-sm text-mocha">{sale.items}</td>
                  <td className="px-6 py-4 font-bold text-espresso">{sale.total}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      sale.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      sale.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors">
                        View
                      </button>
                      {sale.status === 'Pending' && (
                        <button className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors">
                          Refund
                        </button>
                      )}
                    </div>
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
