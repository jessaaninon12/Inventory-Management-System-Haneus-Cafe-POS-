import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Box, 
  PlusSquare, 
  AlertTriangle, 
  Package, 
  DollarSign, 
  User, 
  LogOut,
  Search,
  Bell,
  Plus
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('haneus_user') || '{}');

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('haneus_logged_in');
    localStorage.removeItem('haneus_user');
    navigate('/login');
  };

  const navItems = [
    { title: 'Main', items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    ]},
    { title: 'Inventory', items: [
      { path: '/products', label: 'Products', icon: Box },
      { path: '/create-product', label: 'Create Product', icon: PlusSquare },
      { path: '/low-stock', label: 'Low Stocks', icon: AlertTriangle },
      { path: '/manage-stock', label: 'Manage Stock', icon: Package },
    ]},
    { title: 'Sales', items: [
      { path: '/sales', label: 'Sales', icon: DollarSign },
    ]},
    { title: 'Settings', items: [
      { path: '/profile', label: 'Profile', icon: User },
    ]}
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-cream">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-white border-r border-latte/40 overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-espresso mb-8">Haneus Cafe</h2>
          <nav className="space-y-6">
            {navItems.map((section) => (
              <div key={section.title}>
                <p className="text-[10px] font-semibold text-mocha uppercase tracking-wider mb-2 px-3">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-150 ${
                        isActive(item.path)
                          ? 'bg-cream text-primary border-l-4 border-primary font-medium'
                          : 'text-mocha hover:bg-latte/20'
                      }`}
                    >
                      <item.icon className="w-5 h-5 mr-3 stroke-[2.2px]" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2.5 text-mocha hover:bg-latte/20 rounded-lg transition-all duration-150"
            >
              <LogOut className="w-5 h-5 mr-3 stroke-[2.2px]" />
              <span className="text-sm">Logout</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-[70px] bg-white border-b border-latte flex items-center justify-between px-6 shadow-sm flex-shrink-0">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha/70" />
            <input
              type="text"
              placeholder="Search products, orders..."
              className="w-full pl-10 pr-4 py-2 bg-cream border border-latte rounded-full text-sm focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 border border-latte rounded-lg text-sm font-medium hover:bg-latte/40 transition-colors">
              Haneus Cafe
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
              <Plus className="w-4 h-4" />
              <span>Add New</span>
            </button>
            <button className="relative p-2 hover:bg-cream rounded-full transition-colors">
              <Bell className="w-5 h-5 text-mocha" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
            </button>
            <img
              src="https://static.vecteezy.com/system/resources/previews/014/194/215/original/avatar-icon-human-a-person-s-badge-social-media-profile-symbol-the-symbol-of-a-person-vector.jpg"
              alt="User"
              className="w-10 h-10 rounded-full border border-latte/60 object-cover"
            />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
