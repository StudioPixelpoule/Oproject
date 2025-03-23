import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  FolderGit2,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', icon: Home, label: 'Accueil' },
  { path: '/projects', icon: FolderGit2, label: 'Projets' },
  { path: '/settings', icon: Settings, label: 'Paramètres', soon: true },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-white/5 backdrop-blur-lg border-b border-white/10 fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center gap-2">
                <FolderGit2 className="w-8 h-8 text-white" />
                <span className="text-xl font-bold">O.O</span>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-2">
              {menuItems.map((item) => (
                item.soon ? (
                  <div
                    key={item.path}
                    className="relative group"
                  >
                    <div className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors opacity-50 cursor-not-allowed`}>
                      <item.icon className="w-5 h-5 text-white" />
                      {item.label}
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white/10 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      Bientôt disponible
                    </div>
                  </div>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors ${
                      location.pathname.startsWith(item.path)
                        ? 'bg-primary text-white'
                        : 'text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                )
              ))}
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-xl flex items-center gap-2 text-white hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Déconnexion
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Menu className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={isMobileMenuOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
          className="md:hidden overflow-hidden border-t border-white/10"
        >
          <div className="px-4 py-2 space-y-1">
            {menuItems.map((item) => (
              item.soon ? (
                <div
                  key={item.path}
                  className="px-4 py-3 rounded-xl flex items-center gap-2 opacity-50"
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                  <span className="text-xs ml-auto">Bientôt</span>
                </div>
              ) : (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-colors ${
                    location.pathname.startsWith(item.path)
                      ? 'bg-primary text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            ))}
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-3 rounded-xl flex items-center gap-2 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Déconnexion
            </button>
          </div>
        </motion.div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
}