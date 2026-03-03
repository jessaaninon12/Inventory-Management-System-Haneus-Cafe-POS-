import React from 'react';
import { AlertTriangle, Eye } from 'lucide-react';

export default function LowStock() {
  const lowStockItems = [
    { id: '#1004', name: 'Almond Milk (1L)', category: 'Ingredients', current: 8, threshold: 15, status: 'Critical', progress: 53 },
    { id: '#1012', name: 'Caramel Syrup (500ml)', category: 'Ingredients', current: 11, threshold: 20, status: 'Low', progress: 55 },
    { id: '#1003', name: 'Blueberry Cheesecake Slice', category: 'Desserts', current: 19, threshold: 25, status: 'Low', progress: 76 },
    { id: '#1018', name: 'Whipped Cream Can (400g)', category: 'Ingredients', current: 6, threshold: 12, status: 'Critical', progress: 50 },
    { id: '#1021', name: 'Dark Chocolate Powder', category: 'Ingredients', current: 14, threshold: 20, status: 'Low', progress: 70 },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-espresso">Low Stock Alerts</h1>
        <p className="text-mocha text-sm">Products that need attention — reorder soon to avoid stockouts</p>
      </header>

      <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-4 text-red-800">
        <AlertTriangle className="w-6 h-6 text-red-600" />
        <p className="text-sm">
          <span className="font-bold">8 products</span> are below their reorder point. Critical items are marked in red.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-latte/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-cream border-b border-latte">
                <th className="px-6 py-4 font-semibold text-espresso">Product</th>
                <th className="px-6 py-4 font-semibold text-espresso">ID</th>
                <th className="px-6 py-4 font-semibold text-espresso">Category</th>
                <th className="px-6 py-4 font-semibold text-espresso">Current Stock</th>
                <th className="px-6 py-4 font-semibold text-espresso">Reorder Level</th>
                <th className="px-6 py-4 font-semibold text-espresso">Status</th>
                <th className="px-6 py-4 font-semibold text-espresso">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-latte">
              {lowStockItems.map((item) => (
                <tr key={item.id} className="hover:bg-latte/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-espresso">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-mocha">{item.id}</td>
                  <td className="px-6 py-4 text-sm text-mocha">{item.category}</td>
                  <td className="px-6 py-4 font-medium text-espresso">{item.current}</td>
                  <td className="px-6 py-4 text-sm text-mocha">{item.threshold}</td>
                  <td className="px-6 py-4">
                    <div className="space-y-1.5">
                      <span className={`text-xs font-bold ${
                        item.status === 'Critical' ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {item.status}
                      </span>
                      <div className="w-24 h-2 bg-red-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            item.status === 'Critical' ? 'bg-red-600' : 'bg-amber-600'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-md hover:bg-primary-dark transition-colors">
                        Restock
                      </button>
                      <button className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
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
