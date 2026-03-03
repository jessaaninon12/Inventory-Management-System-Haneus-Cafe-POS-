import React from 'react';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Products() {
  const products = [
    { id: '#1001', name: 'Espresso', category: 'Beverages', price: '₱85.00', stock: 142, status: 'In Stock' },
    { id: '#1002', name: 'Caramel Latte', category: 'Beverages', price: '₱145.00', stock: 38, status: 'Low Stock' },
    { id: '#1003', name: 'Blueberry Cheesecake', category: 'Desserts', price: '₱180.00', stock: 19, status: 'Low Stock' },
    { id: '#1004', name: 'Almond Milk (1L)', category: 'Ingredients', price: '₱220.00', stock: 8, status: 'Critical' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-espresso">Products</h1>
          <p className="text-mocha text-sm">Manage all menu items and inventory products</p>
        </div>
        <Link 
          to="/create-product"
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-latte/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-cream border-b border-latte">
                <th className="px-6 py-4 font-semibold text-espresso">ID</th>
                <th className="px-6 py-4 font-semibold text-espresso">Name</th>
                <th className="px-6 py-4 font-semibold text-espresso">Category</th>
                <th className="px-6 py-4 font-semibold text-espresso">Price</th>
                <th className="px-6 py-4 font-semibold text-espresso">Stock</th>
                <th className="px-6 py-4 font-semibold text-espresso">Status</th>
                <th className="px-6 py-4 font-semibold text-espresso">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-latte">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-latte/5 transition-colors">
                  <td className="px-6 py-4 text-sm text-mocha">{product.id}</td>
                  <td className="px-6 py-4 font-medium text-espresso">{product.name}</td>
                  <td className="px-6 py-4 text-sm text-mocha">{product.category}</td>
                  <td className="px-6 py-4 font-medium text-espresso">{product.price}</td>
                  <td className="px-6 py-4 text-sm text-mocha">{product.stock}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      product.status === 'In Stock' ? 'bg-green-100 text-green-700' :
                      product.status === 'Low Stock' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors">
                        <Trash2 className="w-4 h-4" />
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
