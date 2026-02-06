
import React, { useState } from 'react';
import { Heart, MessageCircle, Bookmark, Share2 } from 'lucide-react';
import { FoodPost } from '../types';

interface PostCardProps {
  post: FoodPost;
  onLike: (id: string) => void;
  isLiked: boolean;
  isSaved: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, isLiked, isSaved }) => {
  const [showIngredients, setShowIngredients] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={`https://picsum.photos/seed/${post.userId}/40`} className="w-10 h-10 rounded-full bg-gray-200" alt="Avatar" />
          <div>
            <h3 className="text-sm font-semibold dark:text-white">User {post.userId.split('-')[1]}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Image */}
      <div className="relative group">
        <img 
          src={post.imageUrl} 
          className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105" 
          alt={post.title} 
        />
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <h2 className="text-white font-serif text-lg font-bold leading-tight">{post.title}</h2>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
          {post.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map(tag => (
            <span key={tag} className="text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
              #{tag}
            </span>
          ))}
        </div>

        {/* Interaction Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'}`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-xs font-medium">{post.likes.length}</span>
            </button>
            <button className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-primary-500 transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs font-medium">12</span>
            </button>
          </div>
          <button className={`${isSaved ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400 hover:text-primary-500'} transition-colors`}>
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
