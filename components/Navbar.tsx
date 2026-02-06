
import React, { useState } from 'react';
import { Search, PlusSquare, Compass, User, Moon, Sun, UtensilsCrossed, LogOut, ChevronDown } from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  currentPage: string;
  setPage: (page: string) => void;
  onSearch: (query: string) => void;
  user: UserType | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ darkMode, toggleDarkMode, currentPage, setPage, onSearch, user, onLogout }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => setPage('home')}
        >
          <div className="bg-primary-500 p-1.5 rounded-lg">
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <span className="font-serif text-xl font-bold hidden md:block dark:text-white uppercase tracking-wider">KALASA</span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Search recipes, tags, menus..."
            onChange={(e) => onSearch(e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-500 dark:text-white"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>

        {/* Nav Links */}
        <div className="flex items-center gap-1 md:gap-4">
          {user && (
            <>
              <button 
                onClick={() => setPage('explore')}
                className={`p-2 rounded-full transition-colors ${currentPage === 'explore' ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <Compass className="w-6 h-6" />
              </button>
              
              <div className="group relative">
                <button className={`p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 ${currentPage.includes('new') ? 'text-primary-500' : ''}`}>
                  <PlusSquare className="w-6 h-6" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200">
                  <button onClick={() => setPage('new-post')} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white border-b dark:border-gray-700">Food Post</button>
                  <button onClick={() => setPage('new-menu')} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white">Menu Idea</button>
                </div>
              </div>
            </>
          )}

          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>

          {user ? (
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <img src={user.avatar} className="w-8 h-8 rounded-full object-cover" alt="Profile" />
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden">
                    <button 
                      onClick={() => { setPage('profile'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white border-b dark:border-gray-700"
                    >
                      <User className="w-4 h-4" /> My Profile
                    </button>
                    <button 
                      onClick={() => { onLogout(); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                    >
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button 
              onClick={() => setPage('auth')}
              className="px-4 py-2 bg-primary-500 text-white rounded-full text-sm font-bold hover:bg-primary-600"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
