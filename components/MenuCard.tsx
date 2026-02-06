
import React from 'react';
import { MenuIdea } from '../types';
import { Tag, Users, Clock, Heart, ExternalLink } from 'lucide-react';

interface MenuCardProps {
  menu: MenuIdea;
  onLike: (id: string) => void;
  isLiked: boolean;
}

const MenuCard: React.FC<MenuCardProps> = ({ menu, onLike, isLiked }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-serif text-xl font-bold dark:text-white mb-1">{menu.title}</h2>
            <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {menu.category}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {menu.audience}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(menu.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <button 
            onClick={() => onLike(menu.id)}
            className={`p-2 rounded-full transition-colors ${isLiked ? 'bg-red-50 text-red-500' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-red-500'}`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="space-y-4">
          {menu.items.map((item, idx) => (
            <div key={idx} className="flex justify-between gap-4 group">
              <div className="flex-1">
                <h4 className="text-sm font-semibold dark:text-white group-hover:text-primary-500 transition-colors">{item.name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</p>
              </div>
              {item.price && (
                <span className="text-sm font-medium text-gray-900 dark:text-white">${item.price.toFixed(2)}</span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
           <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <img key={i} src={`https://picsum.photos/seed/${i + 10}/24`} className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900" alt="User" />
            ))}
            <span className="text-[10px] text-gray-400 ml-4 self-center">+{menu.likes.length} saved</span>
          </div>
          <button className="text-primary-500 text-sm font-semibold flex items-center gap-1 hover:underline">
            Full Details <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
