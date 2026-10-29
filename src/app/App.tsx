// src/App.tsx
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, QrCode, LayoutDashboard, LogOut, ShieldCheck, Menu, X, Sparkles } from 'lucide-react';

// Import Pages
import HomeCheckIn from './pages/HomeCheckIn';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import UsherScanner from './pages/UsherScanner';
import DigitalPass from './pages/DigitalPass';

// Import Protected Route Guard
import ProtectedRoute from './components/ProtectedRoute';

function HeaderNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdminAuthenticated = sessionStorage.getItem('admin_auth') === 'true';

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Home / Register', icon: Home },
    { path: '/scanner', label: 'Usher Scanner', icon: QrCode },
    { path: '/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
  ];

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Branding */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base sm:text-lg tracking-tight">Teens Church</span>
                <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">
                  C1 & C2
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Digital Attendance & Database Portal</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/50">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {isAdminAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition-all border border-rose-900/30"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-400 hover:bg-indigo-950/40 transition-all border border-indigo-900/30"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {isAdminAuthenticated ? (
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 bg-rose-950/30 border border-rose-900/30"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout Admin</span>
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-indigo-400 bg-indigo-950/30 border border-indigo-900/30"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Admin Login</span>
              </Link>
            )}
          </div>
        )}
      </header>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans antialiased">
        <HeaderNavigation />
        
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomeCheckIn />} />
            <Route path="/scanner" element={<UsherScanner />} />
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/pass/:memberId" element={<DigitalPass />} />

            {/* Protected Admin Route */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}