import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';

export default function CreateProduct() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Product created successfully! (Demo)');
    navigate('/products');
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-espresso">Create New Product</h1>
        <p className="text-mocha text-sm">Add a new menu item, ingredient, or merchandise to inventory</p>
      </header>

      <div className="bg-white rounded-xl shadow-lg border border-latte/30 p-8 max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-espresso mb-2">Product Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Iced Caramel Macchiato"
              className="w-full px-4 py-3 bg-cream border border-latte rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-espresso mb-2">Category *</label>
            <select className="w-full px-4 py-3 bg-cream border border-latte rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
              <option value="">Select category</option>
              <option value="beverages">Beverages</option>
              <option value="desserts">Desserts</option>
              <option value="pastries">Pastries</option>
              <option value="ingredients">Ingredients / Supplies</option>
              <option value="merch">Merchandise</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-espresso mb-2">Selling Price (₱) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-mocha font-medium">₱</span>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 bg-cream border border-latte rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-espresso mb-2">Cost per Unit (₱)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-mocha font-medium">₱</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 bg-cream border border-latte rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-espresso mb-2">Initial Stock Quantity *</label>
            <input
              type="number"
              required
              defaultValue="0"
              className="w-full px-4 py-3 bg-cream border border-latte rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-espresso mb-2">Description</label>
            <textarea
              rows={4}
              placeholder="Short description, ingredients, allergens..."
              className="w-full px-4 py-3 bg-cream border border-latte rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-espresso mb-2">Product Image</label>
            <div className="flex items-start gap-6">
              <div className="relative w-32 h-32 border-2 border-dashed border-latte rounded-xl bg-cream flex items-center justify-center overflow-hidden group">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-mocha/40" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <div className="flex-1 text-xs text-mocha space-y-1">
                <p>Upload a clear image of the product.</p>
                <p>Recommended size: 800x800px</p>
                <p>Max file size: 2MB</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="px-6 py-3 bg-latte/20 text-espresso rounded-lg font-medium hover:bg-latte/40 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-primary text-white rounded-lg font-semibold shadow-lg hover:bg-primary-dark transition-all"
            >
              Create Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
