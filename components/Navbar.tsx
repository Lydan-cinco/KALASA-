
import React from 'react';
import { Search, PlusSquare, Compass, User, Moon, Sun, UtensilsCrossed } from 'lucide-react';

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  currentPage: string;
  setPage: (page: string) => void;
  onSearch: (query: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ darkMode, toggleDarkMode, currentPage, setPage, onSearch }) => {
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

          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>

          <button 
            onClick={() => setPage('profile')}
            className={`p-2 rounded-full transition-colors ${currentPage === 'profile' ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            <User className="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
