import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Box, 
  Calendar, 
  Trophy, 
  AlertTriangle, 
  ShoppingCart,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('haneus_user') || '{}');

  const stats = [
    { label: 'Total Sales', value: '₱48,988,078', icon: TrendingUp, color: 'bg-primary', text: 'text-white' },
    { label: 'Total Sales Return', value: '₱16,478,145', icon: TrendingDown, color: 'bg-mocha', text: 'text-white' },
    { label: 'Total Products', value: '24,145', icon: Box, color: 'bg-cappuccino', text: 'text-espresso' },
  ];

  const secondaryStats = [
    { label: 'Profit', value: '₱32,450', change: '+12.5%', type: 'up' },
    { label: 'Total Expenses', value: '₱12,340', change: '+4.8%', type: 'down' },
    { label: 'Payment Returns', value: '₱5,670', change: '+9.1%', type: 'up' },
  ];

  const topSelling = [
    { name: 'Liboog', amount: '₱480', progress: 85 },
    { name: 'Pale Pilsen', amount: '₱372', progress: 66 },
    { name: 'Century Tuna', amount: '₱270', progress: 48 },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-espresso">Welcome, {user.name || 'Admin'}</h1>
          <p className="text-mocha mt-1">You have 200+ Orders Today</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-lg border border-latte shadow-sm whitespace-nowrap">
          <Calendar className="w-5 h-5 text-mocha/80" />
          <span className="text-sm font-medium">01 Jan 2024 – 07 Jan 2024</span>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`${stat.color} ${stat.text} p-6 rounded-xl shadow-lg relative overflow-hidden`}
          >
            <p className="opacity-90 text-sm">{stat.label}</p>
            <div className="text-2xl font-bold my-2">{stat.value}</div>
            <stat.icon className="absolute right-4 bottom-4 w-12 h-12 opacity-20" />
          </motion.div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {secondaryStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="bg-white p-6 rounded-xl border border-latte/30 shadow-md"
          >
            <div className="text-2xl font-bold text-espresso">{stat.value}</div>
            <p className="text-mocha text-sm">{stat.label}</p>
            <div className="mt-3 flex gap-2 text-xs">
              <span className={stat.type === 'up' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                {stat.change}
              </span>
              <span className="text-mocha">vs last week</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts & Top Selling */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-latte/30 shadow-md overflow-hidden">
          <div className="p-6 border-b border-latte flex flex-wrap justify-between items-center gap-4">
            <h3 className="font-bold text-lg">Sales & Purchase</h3>
            <div className="flex bg-cream p-1 rounded-lg">
              {['1D', '1W', '1M', '3M', '6M', '1Y'].map((p) => (
                <button
                  key={p}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                    p === '1Y' ? 'bg-primary text-white' : 'text-mocha hover:bg-latte/20'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="p-6 h-[320px] flex items-end gap-2 overflow-x-auto">
            {[40, 32, 52, 44, 48, 60, 54, 38, 46, 58, 68, 50].map((h, i) => (
              <div
                key={i}
                className="flex-1 min-w-[26px] bg-primary rounded-t-lg transition-all hover:bg-primary-dark cursor-pointer"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="grid grid-cols-12 gap-2 px-6 pb-6 text-[10px] text-mocha text-center">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>

        <div className="bg-espresso text-latte p-6 rounded-xl shadow-xl border border-latte/20">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <span>Top Selling</span>
          </h3>
          <div className="space-y-6">
            {topSelling.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-sm mb-2">
                  <span>{item.name}</span>
                  <span className="font-medium">{item.amount}</span>
                </div>
                <div className="h-2 bg-latte/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.progress}%` }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
          <button className="mt-8 w-full py-2.5 bg-latte/5 border border-latte/20 rounded-lg text-sm font-medium hover:bg-latte/10 transition-all">
            View All Products
          </button>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-latte/30 shadow-md">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>Low Stock Products</span>
          </h3>
          <div className="flex items-center gap-4 py-3">
            <img 
              src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=100" 
              alt="Almond Milk" 
              className="w-14 h-14 object-cover rounded-lg"
            />
            <div className="flex-1">
              <p className="font-semibold">Almond Milk</p>
              <p className="text-xs text-mocha">ID: #2941</p>
            </div>
            <span className="text-red-600 font-bold">8 left</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-latte/30 shadow-md">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <span>Recent Sales</span>
          </h3>
          <div className="flex items-center gap-4 py-3">
            <img 
              src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=100" 
              alt="Latte" 
              className="w-14 h-14 object-cover rounded-lg"
            />
            <div className="flex-1">
              <p className="font-semibold">Latte</p>
              <p className="text-xs text-mocha">Beverages</p>
            </div>
            <div className="text-right">
              <p className="font-bold">₱240</p>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Processing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
