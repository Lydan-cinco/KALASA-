
import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal, Edit2, Trash2, Send, Maximize2, Play } from 'lucide-react';
import { FoodPost, Comment, User } from '../types';
import { mockDb } from '../services/mockDb';

interface PostCardProps {
  post: FoodPost;
  onLike: (id: string) => void;
  isLiked: boolean;
  isSaved: boolean;
  currentUserId?: string;
  onEdit?: (post: FoodPost) => void;
  onDelete?: (id: string) => void;
  onViewDetails?: (id: string) => void;
  onShare?: (post: FoodPost) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, isLiked, isSaved, currentUserId, onEdit, onDelete, onViewDetails, onShare }) => {
  const [showMenu, setShowMenu] = useState(false);
  const isOwner = currentUserId === post.userId;
  const postOwner = mockDb.getUserById(post.userId);

  return (
    <div className="gallery-card group relative bg-white dark:bg-[#121212] rounded-[2rem] overflow-hidden border border-[#f0eee9] dark:border-[#222] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
      
      {/* Editorial Media Section */}
      <div 
        className="relative overflow-hidden cursor-pointer aspect-[4/5]"
        onClick={() => onViewDetails?.(post.id)}
      >
        {post.mediaType === 'video' ? (
          <video 
            src={post.imageUrl} 
            className="image-zoom w-full h-full object-cover" 
            autoPlay 
            muted 
            loop 
            playsInline
          />
        ) : (
          <img 
            src={post.imageUrl} 
            className="image-zoom w-full h-full object-cover" 
            alt={post.title} 
          />
        )}
        
        {/* Subtle Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
        
        {/* Top Actions Overlay */}
        <div className="absolute top-5 left-5 right-5 flex justify-between items-center z-10 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
          <div className="flex items-center gap-2 glass-overlay py-1.5 px-3 rounded-full border border-white/20">
            <img src={postOwner?.avatar} className="w-6 h-6 rounded-full object-cover" />
            <span className="text-[10px] font-bold text-gray-800 dark:text-white uppercase tracking-widest">{postOwner?.name}</span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-2 glass-overlay rounded-full text-gray-800 dark:text-white border border-white/20 hover:bg-white transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Video Indicator */}
        {post.mediaType === 'video' && (
          <div className="absolute top-5 right-5 z-10 bg-black/40 backdrop-blur-md p-1.5 rounded-full text-white pointer-events-none group-hover:opacity-0 transition-opacity">
            <Play className="w-3 h-3 fill-current" />
          </div>
        )}

        {/* Floating Menu */}
        {showMenu && (
          <>
            <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}></div>
            <div className="absolute right-5 top-16 w-32 glass-overlay border border-white/20 rounded-2xl shadow-2xl z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {isOwner && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); onEdit?.(post); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-700 dark:text-white hover:bg-primary-500 hover:text-white transition-colors flex items-center gap-2">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete?.(post.id); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 border-b dark:border-white/10">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </>
              )}
              <button onClick={(e) => { e.stopPropagation(); onShare?.(post); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center gap-2">
                <Share2 className="w-3 h-3" /> Share
              </button>
            </div>
          </>
        )}

        {/* Content Overlay */}
        <div className="absolute bottom-6 left-6 right-6 z-10">
          <h3 className="font-serif text-2xl font-bold text-white leading-tight mb-2 drop-shadow-lg italic">
            {post.title}
          </h3>
          <div className="flex flex-wrap gap-1.5 mb-3 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700 delay-100">
            {post.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[9px] font-black uppercase tracking-[0.15em] text-white/90 border border-white/30 px-2 py-0.5 rounded-sm bg-black/20">
                {tag}
              </span>
            ))}
          </div>
          
          {/* Interaction Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-white/20">
            <div className="flex items-center gap-5">
              <button 
                onClick={(e) => { e.stopPropagation(); onLike(post.id); }}
                className={`flex items-center gap-1.5 group/btn transition-transform active:scale-90 ${isLiked ? 'text-primary-500' : 'text-white'}`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : 'drop-shadow-md'}`} />
                <span className="text-xs font-bold tracking-tighter">{post.likes.length}</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onViewDetails?.(post.id); }}
                className="flex items-center gap-1.5 text-white group/btn"
              >
                <MessageCircle className="w-5 h-5 drop-shadow-md" />
                <span className="text-xs font-bold tracking-tighter">{mockDb.getComments(post.id).length}</span>
              </button>
            </div>
            <button className="text-white hover:text-primary-400 transition-colors">
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current text-primary-500' : 'drop-shadow-md'}`} />
            </button>
          </div>
        </div>
        
        {/* Center Hover Icon */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className="w-12 h-12 rounded-full glass-overlay flex items-center justify-center border border-white/30">
            <Maximize2 className="w-5 h-5 text-gray-800 dark:text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
