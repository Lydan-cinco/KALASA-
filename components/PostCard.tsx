
import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal, Edit2, Trash2, Send, Maximize2 } from 'lucide-react';
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
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, isLiked, isSaved, currentUserId, onEdit, onDelete, onViewDetails }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const isOwner = currentUserId === post.userId;
  const postOwner = mockDb.getUserById(post.userId);

  useEffect(() => {
    if (showComments) {
      setComments(mockDb.getComments(post.id));
    }
  }, [showComments, post.id]);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !newComment.trim()) return;

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      userId: currentUserId,
      entityId: post.id,
      text: newComment.trim(),
      createdAt: new Date().toISOString()
    };

    mockDb.addComment(comment);
    setComments(prev => [comment, ...prev]);
    setNewComment('');
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={postOwner?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userId}`} 
            className="w-10 h-10 rounded-full bg-gray-200 object-cover border border-gray-100 dark:border-gray-800" 
            alt="Avatar" 
          />
          <div>
            <h3 className="text-sm font-semibold dark:text-white">{postOwner?.name || `User ${post.userId.split('-')[1]}`}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
              <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden">
                {isOwner && (
                  <>
                    <button 
                      onClick={() => { onEdit?.(post); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                    <button 
                      onClick={() => { onDelete?.(post.id); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </>
                )}
                <button 
                  onClick={() => { setShowMenu(false); alert('Post shared!'); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Image with Details Trigger */}
      <div 
        className="relative group cursor-pointer overflow-hidden"
        onClick={() => onViewDetails?.(post.id)}
      >
        <img 
          src={post.imageUrl} 
          className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105" 
          alt={post.title} 
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white">
            <Maximize2 className="w-6 h-6" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
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
            <button 
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-1.5 transition-colors ${showComments ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400 hover:text-primary-500'}`}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs font-medium">{mockDb.getComments(post.id).length}</span>
            </button>
          </div>
          <button className={`${isSaved ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400 hover:text-primary-500'} transition-colors`}>
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Inline Comments Preview (Simplified) */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="max-h-32 overflow-y-auto space-y-2 mb-4 pr-2 scrollbar-thin">
              {comments.length > 0 ? (
                comments.slice(0, 3).map(c => {
                  const user = mockDb.getUserById(c.userId);
                  return (
                    <div key={c.id} className="flex gap-2">
                      <div className="flex-1 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[10px] font-bold dark:text-white">{user?.name || 'User'}</span>
                        </div>
                        <p className="text-[11px] text-gray-700 dark:text-gray-300">{c.text}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-[10px] text-center text-gray-400 py-1">No comments yet.</p>
              )}
            </div>
            
            <button 
              onClick={() => onViewDetails?.(post.id)}
              className="w-full text-center text-[10px] text-primary-500 font-bold uppercase tracking-widest hover:underline mb-3"
            >
              View All Comments
            </button>

            {currentUserId && (
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 text-xs bg-gray-50 dark:bg-gray-800 border-none rounded-full px-4 py-2 focus:ring-1 focus:ring-primary-500 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="p-2 text-primary-500 disabled:text-gray-300 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard;
