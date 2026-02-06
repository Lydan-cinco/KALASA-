
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from './components/Navbar';
import PostCard from './components/PostCard';
import MenuCard from './components/MenuCard';
import { mockDb } from './services/mockDb';
import { FoodPost, MenuIdea, User, Comment } from './types';
import { generateFoodPostAI, generateMenuIdeaAI, generateFoodImage } from './services/geminiService';
import { Sparkles, Image as ImageIcon, Plus, X, Loader2, ChevronRight, Heart, MessageCircle, Mail, Lock, User as UserIcon, ArrowRight, UtensilsCrossed, Camera, Upload, Edit2, Trash2, Send, ChefHat, Bookmark, Share2, Filter, Video, Play, Facebook, Instagram, Music2, AtSign, Link2, CheckCircle2, Settings, Grid, List as ListIcon } from 'lucide-react';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(mockDb.getCurrentUser());
  const [page, setPage] = useState(user ? 'home' : 'auth');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<FoodPost[]>(mockDb.getPosts());
  const [menus, setMenus] = useState<MenuIdea[]>(mockDb.getMenus());
  const [loading, setLoading] = useState(false);
  const [profileTab, setProfileTab] = useState<'posts' | 'menus'>('posts');

  // Modal State
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const selectedPost = useMemo(() => posts.find(p => p.id === selectedPostId), [posts, selectedPostId]);
  const [modalComments, setModalComments] = useState<Comment[]>([]);
  const [modalNewComment, setModalNewComment] = useState('');

  // Share Modal State
  const [sharingPost, setSharingPost] = useState<FoodPost | null>(null);
  const [copied, setCopied] = useState(false);

  // File Inputs
  const postFileRef = useRef<HTMLInputElement>(null);
  const profileFileRef = useRef<HTMLInputElement>(null);

  // Auth States
  const [isRegistering, setIsRegistering] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });

  // Post State (used for both New and Edit)
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [postFormId, setPostFormId] = useState<string | null>(null);
  const [newPost, setNewPost] = useState({ 
    title: '', 
    description: '', 
    ingredients: '', 
    tags: '', 
    imageUrl: '', 
    mediaType: 'image' as 'image' | 'video' 
  });

  // Menu Form State
  const [newMenu, setNewMenu] = useState({ title: '', category: 'Lunch', audience: 'Cafe', items: [{ name: '', description: '', price: '' }] });
  
  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', bio: '', avatar: '' });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (selectedPostId) {
      setModalComments(mockDb.getComments(selectedPostId));
    }
  }, [selectedPostId]);

  const filteredPosts = useMemo(() => {
    if (!searchQuery) return posts;
    const q = searchQuery.toLowerCase();
    return posts.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [posts, searchQuery]);

  const filteredMenus = useMemo(() => {
    if (!searchQuery) return menus;
    const q = searchQuery.toLowerCase();
    return menus.filter(m => 
      m.title.toLowerCase().includes(q) || 
      m.items.some(i => i.name.toLowerCase().includes(q))
    );
  }, [menus, searchQuery]);

  const userPosts = useMemo(() => posts.filter(p => p.userId === user?.id), [posts, user]);
  const userMenus = useMemo(() => menus.filter(m => m.userId === user?.id), [menus, user]);

  const handleLike = (id: string, type: 'post' | 'menu') => {
    if (!user) return setPage('auth');
    mockDb.toggleLike(id, type, user.id);
    if (type === 'post') setPosts(mockDb.getPosts());
    else setMenus(mockDb.getMenus());
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
      const newUser = mockDb.register(authForm.name, authForm.email);
      if (newUser) {
        setUser(newUser);
        setPage('home');
      } else {
        alert("Email already registered!");
      }
    } else {
      const loggedUser = mockDb.login(authForm.email);
      if (loggedUser) {
        setUser(loggedUser);
        setPage('home');
      } else {
        alert("Invalid email or user not found!");
      }
    }
  };

  const handleLogout = () => {
    mockDb.logout();
    setUser(null);
    setPage('auth');
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const updatedUser = mockDb.updateUser(user.id, {
      name: profileForm.name,
      bio: profileForm.bio,
      avatar: profileForm.avatar || user.avatar
    });
    setUser(updatedUser as User);
    setIsEditingProfile(false);
  };

  const openEditProfile = () => {
    if (!user) return;
    setProfileForm({
      name: user.name,
      bio: user.bio || '',
      avatar: user.avatar
    });
    setIsEditingProfile(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'post' | 'profile') => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (target === 'post') {
          setNewPost(prev => ({ 
            ...prev, 
            imageUrl: base64, 
            mediaType: isVideo ? 'video' : 'image' 
          }));
        }
        else setProfileForm(prev => ({ ...prev, avatar: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiGeneratePost = async () => {
    if (!newPost.title) return alert("Please enter a basic dish name first!");
    setLoading(true);
    try {
      const result = await generateFoodPostAI(newPost.title);
      setNewPost(prev => ({
        ...prev,
        title: result.title,
        description: result.description,
        ingredients: result.ingredients.join(', '),
        tags: result.tags.join(', '),
        mediaType: 'image'
      }));
      
      const img = await generateFoodImage(result.title);
      if (img) setNewPost(prev => ({ ...prev, imageUrl: img }));

    } catch (e) {
      console.error(e);
      alert("AI Generation failed. Check API key.");
    } finally {
      setLoading(false);
    }
  };

  const startEditPost = (post: FoodPost) => {
    setIsEditingPost(true);
    setPostFormId(post.id);
    setNewPost({
      title: post.title,
      description: post.description,
      ingredients: post.ingredients.join(', '),
      tags: post.tags.join(', '),
      imageUrl: post.imageUrl,
      mediaType: post.mediaType || 'image'
    });
    setPage('new-post');
    setSelectedPostId(null);
  };

  const submitPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (isEditingPost && postFormId) {
      const updatedPost: FoodPost = {
        ...posts.find(p => p.id === postFormId)!,
        title: newPost.title,
        description: newPost.description,
        imageUrl: newPost.imageUrl || `https://picsum.photos/seed/${Date.now()}/800`,
        mediaType: newPost.mediaType,
        ingredients: newPost.ingredients.split(',').map(i => i.trim()),
        tags: newPost.tags.split(',').map(i => i.trim()),
      };
      mockDb.updatePost(updatedPost);
    } else {
      const post: FoodPost = {
        id: `post-${Date.now()}`,
        userId: user.id,
        title: newPost.title,
        description: newPost.description,
        imageUrl: newPost.imageUrl || `https://picsum.photos/seed/${Date.now()}/800`,
        mediaType: newPost.mediaType,
        ingredients: newPost.ingredients.split(',').map(i => i.trim()),
        tags: newPost.tags.split(',').map(i => i.trim()),
        likes: [],
        saves: [],
        createdAt: new Date().toISOString()
      };
      mockDb.addPost(post);
    }
    
    setPosts(mockDb.getPosts());
    setNewPost({ title: '', description: '', ingredients: '', tags: '', imageUrl: '', mediaType: 'image' });
    setIsEditingPost(false);
    setPostFormId(null);
    setPage('home');
  };

  const deletePost = (id: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      mockDb.deletePost(id);
      setPosts(mockDb.getPosts());
      setSelectedPostId(null);
    }
  };

  const handleAddModalComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPostId || !modalNewComment.trim()) return;

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      userId: user.id,
      entityId: selectedPostId,
      text: modalNewComment.trim(),
      createdAt: new Date().toISOString()
    };

    mockDb.addComment(comment);
    setModalComments(prev => [comment, ...prev]);
    setModalNewComment('');
    setPosts(mockDb.getPosts());
  };

  const handleCopyLink = () => {
    if (!sharingPost) return;
    const url = `${window.location.origin}/post/${sharingPost.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToSocial = (platform: string) => {
    if (!sharingPost) return;
    const url = `${window.location.origin}/post/${sharingPost.id}`;
    const text = `Take a look at "${sharingPost.title}" on KALASA Gallery.`;
    
    let shareUrl = '';
    switch(platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'threads':
        shareUrl = `https://www.threads.net/intent/post?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'instagram':
      case 'tiktok':
        handleCopyLink();
        alert(`Direct sharing to ${platform} is only available via the app. The link has been copied to your clipboard to paste in your story or bio!`);
        return;
    }
    
    if (shareUrl) window.open(shareUrl, '_blank');
  };

  if (page === 'auth') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
        <div className="hidden lg:block w-1/2 relative overflow-hidden">
          <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1200" className="absolute inset-0 w-full h-full object-cover" alt="Food" />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-900/80 to-transparent flex items-end p-16">
            <div className="max-w-md text-white">
              <h1 className="font-serif text-5xl font-bold mb-4">Discover Flavors, Share Culture.</h1>
              <p className="text-lg opacity-90">Join KALASA, the world's most vibrant community for chefs, foodies, and creators.</p>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            <div className="text-center mb-10">
              <div className="bg-primary-500 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-200">
                <UtensilsCrossed className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-serif font-bold dark:text-white">{isRegistering ? 'Join KALASA' : 'Welcome Back'}</h2>
              <p className="text-gray-500 mt-2">Start your culinary journey today.</p>
            </div>
            <form onSubmit={handleAuth} className="space-y-4">
              {isRegistering && (
                <div className="relative">
                  <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input required type="text" placeholder="Full Name" className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary-500 dark:text-white" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input required type="email" placeholder="Email Address" className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary-500 dark:text-white" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input required type="password" placeholder="Password" className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary-500 dark:text-white" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 transition-all flex items-center justify-center gap-2">
                {isRegistering ? 'Create Account' : 'Sign In'} <ArrowRight className="w-5 h-5" />
              </button>
            </form>
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                {isRegistering ? 'Already have an account?' : "Don't have an account yet?"}
                <button onClick={() => setIsRegistering(!isRegistering)} className="ml-2 text-primary-500 font-bold hover:underline">{isRegistering ? 'Sign In' : 'Create Account'}</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 bg-[#faf9f6] dark:bg-black transition-colors duration-700">
      <Navbar 
        darkMode={darkMode} 
        toggleDarkMode={() => setDarkMode(!darkMode)} 
        currentPage={page} 
        setPage={(p) => { 
          if (p === 'new-post') { setIsEditingPost(false); setNewPost({ title: '', description: '', ingredients: '', tags: '', imageUrl: '', mediaType: 'image' }); }
          setPage(p); 
        }} 
        onSearch={setSearchQuery}
        user={user}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-6 mt-12">
        {page === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-3 space-y-16">
              <section>
                <div className="flex items-end justify-between mb-10 border-b border-gray-200 dark:border-white/10 pb-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-500 mb-2 block">Curated Feed</span>
                    <h2 className="font-serif text-4xl font-bold dark:text-white">Culinary Highlights</h2>
                  </div>
                  <button onClick={() => setPage('explore')} className="text-gray-400 hover:text-primary-500 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-colors">
                    The Collection <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                  {filteredPosts.slice(0, 6).map(post => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      onLike={(id) => handleLike(id, 'post')}
                      isLiked={post.likes.includes(user?.id || '')}
                      isSaved={post.saves.includes(user?.id || '')}
                      currentUserId={user?.id}
                      onEdit={startEditPost}
                      onDelete={deletePost}
                      onViewDetails={setSelectedPostId}
                      onShare={setSharingPost}
                    />
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-10">
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-500 mb-2 block">Planned Experiences</span>
                   <h2 className="font-serif text-4xl font-bold dark:text-white">Art of the Menu</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {filteredMenus.map(menu => (
                    <MenuCard key={menu.id} menu={menu} onLike={(id) => handleLike(id, 'menu')} isLiked={menu.likes.includes(user?.id || '')} />
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="hidden lg:block space-y-12">
              {user && (
                <div className="bg-white dark:bg-[#121212] p-8 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm">
                  <div className="text-center mb-6">
                    <img src={user.avatar} className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-2 border-primary-500 p-1 shadow-lg cursor-pointer" alt="Me" onClick={() => setPage('profile')} />
                    <h3 className="font-serif text-xl font-bold dark:text-white uppercase tracking-wider">{user.name}</h3>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Head Gastronome</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t dark:border-white/10 pt-6">
                    <div className="text-center">
                      <div className="font-bold text-sm dark:text-white">{userPosts.length}</div>
                      <div className="text-[9px] text-gray-400 uppercase tracking-tighter">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-sm dark:text-white">{userMenus.length}</div>
                      <div className="text-[9px] text-gray-400 uppercase tracking-tighter">Menus</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-sm dark:text-white">0</div>
                      <div className="text-[9px] text-gray-400 uppercase tracking-tighter">Saves</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-[#1a1a1a] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-500/20 rounded-full blur-3xl group-hover:bg-primary-500/40 transition-colors"></div>
                <div className="relative z-10">
                  <Sparkles className="w-8 h-8 text-primary-500 mb-6" />
                  <h3 className="font-serif text-2xl font-bold mb-3 italic">Generate Taste</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-8">Elevate your venue with AI-designed seasonal menus tailored to your audience.</p>
                  <button onClick={() => setPage('new-menu')} className="w-full bg-white text-black font-black uppercase tracking-[0.2em] py-3 rounded-full text-[10px] transition-transform active:scale-95 hover:bg-primary-500 hover:text-white">
                    Design Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {page === 'explore' && (
          <div className="space-y-12">
             <div className="flex flex-col md:flex-row items-end justify-between gap-6 border-b dark:border-white/10 pb-8">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-500 mb-2 block">Global Archive</span>
                <h1 className="font-serif text-5xl font-bold dark:text-white">The Collection</h1>
              </div>
              <div className="flex gap-4">
                <button className="flex items-center gap-2 bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-primary-500 transition-colors">
                  <Filter className="w-4 h-4" /> Filter By Palette
                </button>
              </div>
            </div>
            
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-8 space-y-8">
              {filteredPosts.map(post => (
                <div key={post.id} className="break-inside-avoid">
                  <PostCard 
                    post={post} 
                    onLike={(id) => handleLike(id, 'post')} 
                    isLiked={post.likes.includes(user?.id || '')} 
                    isSaved={post.saves.includes(user?.id || '')} 
                    currentUserId={user?.id} 
                    onEdit={startEditPost} 
                    onDelete={deletePost} 
                    onViewDetails={setSelectedPostId} 
                    onShare={setSharingPost}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {page === 'profile' && user && (
          <div className="space-y-16 py-12">
            {/* Editorial Profile Header */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-8">
                <div className="w-40 h-40 rounded-full border-[1px] border-primary-500/30 p-2 shadow-2xl relative">
                   <img src={user.avatar} className="w-full h-full rounded-full object-cover" />
                </div>
                <button onClick={openEditProfile} className="absolute bottom-2 right-2 bg-black dark:bg-white text-white dark:text-black p-2.5 rounded-full shadow-xl hover:scale-110 transition-transform">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              
              <h1 className="font-serif text-5xl font-bold dark:text-white italic mb-4">{user.name}</h1>
              <p className="max-w-xl text-gray-500 dark:text-gray-400 font-light italic leading-relaxed mb-8">
                "{user.bio || 'Crafting culinary experiences through light and taste. Passionate about seasonal gastronomy and minimalist plate composition.'}"
              </p>
              
              <div className="flex gap-16 pb-12">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold dark:text-white">{userPosts.length}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Archives</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold dark:text-white">{userMenus.length}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Curation</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold dark:text-white">{user.followers.length}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Followers</span>
                </div>
              </div>

              {/* Minimalist Tab Switcher */}
              <div className="flex gap-12 border-b dark:border-white/5 w-full justify-center">
                <button 
                  onClick={() => setProfileTab('posts')}
                  className={`pb-4 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 transition-all relative ${profileTab === 'posts' ? 'text-primary-500' : 'text-gray-400'}`}
                >
                  <Grid className="w-4 h-4" /> The Gallery
                  {profileTab === 'posts' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"></div>}
                </button>
                <button 
                  onClick={() => setProfileTab('menus')}
                  className={`pb-4 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 transition-all relative ${profileTab === 'menus' ? 'text-primary-500' : 'text-gray-400'}`}
                >
                  <ListIcon className="w-4 h-4" /> Menu Concepts
                  {profileTab === 'menus' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"></div>}
                </button>
              </div>
            </div>

            {profileTab === 'posts' ? (
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {userPosts.map(post => (
                  <div key={post.id} className="break-inside-avoid">
                    <PostCard 
                      post={post} 
                      onLike={(id) => handleLike(id, 'post')} 
                      isLiked={post.likes.includes(user?.id || '')} 
                      isSaved={post.saves.includes(user?.id || '')} 
                      currentUserId={user?.id} 
                      onEdit={startEditPost} 
                      onDelete={deletePost} 
                      onViewDetails={setSelectedPostId} 
                      onShare={setSharingPost}
                    />
                  </div>
                ))}
                {userPosts.length === 0 && (
                  <div className="col-span-full py-24 text-center">
                    <ImageIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 italic">No masterpieces archived yet.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {userMenus.map(menu => (
                  <MenuCard 
                    key={menu.id} 
                    menu={menu} 
                    onLike={(id) => handleLike(id, 'menu')} 
                    isLiked={menu.likes.includes(user?.id || '')} 
                  />
                ))}
                {userMenus.length === 0 && (
                  <div className="col-span-full py-24 text-center">
                    <ChefHat className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 italic">No menu concepts curated yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {page === 'new-post' && (
           <div className="max-w-3xl mx-auto py-12">
            <div className="mb-12 text-center">
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-500 mb-2 block">Creation Studio</span>
               <h1 className="font-serif text-5xl font-bold dark:text-white">{isEditingPost ? 'Refine Entry' : 'New Dish Entry'}</h1>
            </div>
            <form onSubmit={submitPost} className="space-y-10">
              <div className="bg-white dark:bg-[#121212] p-10 rounded-[3rem] border border-gray-200 dark:border-white/10 shadow-xl space-y-8">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">Dish Designation</label>
                  <div className="flex gap-4">
                    <input required type="text" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} placeholder="Title of your masterpiece" className="flex-1 bg-[#fafafa] dark:bg-black/40 border-none rounded-2xl px-6 py-4 text-lg font-serif dark:text-white placeholder:italic" />
                    {!isEditingPost && (
                      <button type="button" onClick={handleAiGeneratePost} disabled={loading} className="bg-primary-500 text-white px-6 rounded-2xl flex items-center gap-3 disabled:opacity-50 hover:bg-primary-600 shadow-lg shadow-primary-500/30">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        <span className="text-[10px] font-black uppercase tracking-widest">Generate</span>
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">Ingredients (Delimited)</label>
                    <input type="text" value={newPost.ingredients} onChange={e => setNewPost({...newPost, ingredients: e.target.value})} placeholder="Saffron, Honey, Bone Marrow..." className="w-full bg-[#fafafa] dark:bg-black/40 border-none rounded-2xl px-6 py-4 text-sm dark:text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">Style Tags</label>
                    <input type="text" value={newPost.tags} onChange={e => setNewPost({...newPost, tags: e.target.value})} placeholder="Minimalist, Seasonal, Fusion..." className="w-full bg-[#fafafa] dark:bg-black/40 border-none rounded-2xl px-6 py-4 text-sm dark:text-white" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">Culinary Narrative</label>
                  <textarea required value={newPost.description} onChange={e => setNewPost({...newPost, description: e.target.value})} rows={6} placeholder="The heritage and vision of this dish..." className="w-full bg-[#fafafa] dark:bg-black/40 border-none rounded-3xl px-6 py-4 text-sm dark:text-white leading-relaxed" />
                </div>

                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">Visual Documentation (Photo or Video)</label>
                  {newPost.imageUrl ? (
                    <div className="relative rounded-[2.5rem] overflow-hidden aspect-[16/9] shadow-inner bg-black">
                      {newPost.mediaType === 'video' ? (
                        <video src={newPost.imageUrl} className="w-full h-full object-cover" autoPlay muted loop />
                      ) : (
                        <img src={newPost.imageUrl} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute top-6 right-6 flex gap-3">
                        <button type="button" onClick={() => postFileRef.current?.click()} className="bg-white/90 backdrop-blur-md text-black p-3 rounded-full hover:bg-white"><Edit2 className="w-4 h-4" /></button>
                        <button type="button" onClick={() => setNewPost({...newPost, imageUrl: '', mediaType: 'image'})} className="bg-red-500/90 backdrop-blur-md text-white p-3 rounded-full hover:bg-red-600"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => postFileRef.current?.click()} className="w-full border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[2.5rem] aspect-[16/9] flex flex-col items-center justify-center text-gray-300 gap-4 group hover:border-primary-500/50 hover:bg-primary-500/5 transition-all">
                      <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary-500" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-primary-500">Capture High Resolution Media</p>
                      <div className="flex gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest"><ImageIcon className="w-3 h-3" /> Photo</span>
                        <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest"><Video className="w-3 h-3" /> Video</span>
                      </div>
                    </button>
                  )}
                  <input type="file" ref={postFileRef} hidden accept="image/*,video/*" onChange={(e) => handleFileUpload(e, 'post')} />
                </div>
              </div>
              <div className="flex gap-6">
                <button type="submit" className="flex-1 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-[0.3em] py-5 rounded-3xl text-xs hover:bg-primary-500 hover:text-white dark:hover:bg-primary-500 transition-colors shadow-2xl">
                  {isEditingPost ? 'Update Entry' : 'Archive Masterpiece'}
                </button>
                <button type="button" onClick={() => setPage('home')} className="px-10 py-5 font-black uppercase tracking-[0.2em] text-gray-400 text-[10px] hover:text-black dark:hover:text-white">Withdraw</button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Sharing Overlay Modal */}
      {sharingPost && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-3xl" onClick={() => setSharingPost(null)}></div>
          <div className="relative bg-white dark:bg-[#0d0d0d] w-full max-w-md rounded-[3.5rem] p-12 shadow-[0_60px_120px_rgba(0,0,0,0.5)] border dark:border-white/5 animate-in zoom-in-95 duration-500">
             <button onClick={() => setSharingPost(null)} className="absolute top-10 right-10 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
               <X className="w-6 h-6" />
             </button>
             
             <div className="text-center mb-10">
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-500 mb-3 block italic">The Taste Spread</span>
               <h2 className="font-serif text-4xl font-bold dark:text-white italic">Share Gallery</h2>
             </div>

             <div className="grid grid-cols-2 gap-6 mb-12">
               <button 
                 onClick={() => shareToSocial('facebook')} 
                 className="flex flex-col items-center gap-4 p-8 rounded-[2.5rem] bg-blue-50/50 dark:bg-blue-500/5 hover:bg-blue-500 hover:text-white transition-all group"
               >
                 <div className="w-14 h-14 rounded-full bg-white dark:bg-blue-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-transparent transition-all">
                    <Facebook className="w-7 h-7 text-[#1877F2] group-hover:text-white" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.15em]">Facebook</span>
               </button>
               
               <button 
                 onClick={() => shareToSocial('instagram')} 
                 className="flex flex-col items-center gap-4 p-8 rounded-[2.5rem] bg-pink-50/50 dark:bg-pink-500/5 hover:bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] hover:text-white transition-all group"
               >
                 <div className="w-14 h-14 rounded-full bg-white dark:bg-pink-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-transparent transition-all">
                    <Instagram className="w-7 h-7 text-[#E4405F] group-hover:text-white" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.15em]">Instagram</span>
               </button>

               <button 
                 onClick={() => shareToSocial('tiktok')} 
                 className="flex flex-col items-center gap-4 p-8 rounded-[2.5rem] bg-gray-50 dark:bg-white/5 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all group"
               >
                 <div className="w-14 h-14 rounded-full bg-white dark:bg-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-transparent transition-all">
                    <Music2 className="w-7 h-7 text-black dark:text-white group-hover:text-current" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.15em]">TikTok</span>
               </button>

               <button 
                 onClick={() => shareToSocial('threads')} 
                 className="flex flex-col items-center gap-4 p-8 rounded-[2.5rem] bg-gray-50 dark:bg-white/5 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all group"
               >
                 <div className="w-14 h-14 rounded-full bg-white dark:bg-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-transparent transition-all">
                    <AtSign className="w-7 h-7 text-black dark:text-white group-hover:text-current" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.15em]">Threads</span>
               </button>
             </div>

             <div className="pt-8 border-t dark:border-white/5">
                <button 
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-between bg-gray-50 dark:bg-white/5 px-8 py-5 rounded-full text-gray-500 dark:text-gray-400 group hover:bg-primary-500/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Link2 className="w-5 h-5 text-primary-500" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">Copy Gallery Path</span>
                  </div>
                  {copied ? (
                    <div className="flex items-center gap-2 text-green-500">
                      <span className="text-[9px] font-bold uppercase">Copied</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  )}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Post Detail Modal (Editorial Version) */}
      {selectedPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-10">
          <div className="absolute inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-3xl" onClick={() => setSelectedPostId(null)}></div>
          <div className="relative bg-white dark:bg-[#0a0a0a] w-full max-w-7xl h-full md:h-auto md:max-h-[90vh] md:rounded-[3rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.3)] flex flex-col md:flex-row animate-in zoom-in-95 duration-500">
            <button onClick={() => setSelectedPostId(null)} className="absolute top-8 right-8 z-50 bg-black text-white p-3 rounded-full hover:bg-primary-500 transition-colors"><X className="w-6 h-6" /></button>
            
            <div className="md:w-3/5 bg-[#050505] flex items-center justify-center relative overflow-hidden">
              {selectedPost.mediaType === 'video' ? (
                <video src={selectedPost.imageUrl} className="w-full h-full object-cover md:object-contain" controls autoPlay loop muted playsInline />
              ) : (
                <img src={selectedPost.imageUrl} className="w-full h-full object-cover md:object-contain" alt={selectedPost.title} />
              )}
              <div className="absolute bottom-10 left-10 hidden md:block">
                 <span className="text-white/20 text-8xl font-serif font-bold italic select-none">KALASA</span>
              </div>
            </div>

            <div className="md:w-2/5 flex flex-col h-full bg-white dark:bg-[#0a0a0a] border-l dark:border-white/5">
              <div className="p-10 flex-1 overflow-y-auto scrollbar-thin">
                <div className="flex items-center gap-4 mb-10 pb-10 border-b dark:border-white/5">
                  <img src={mockDb.getUserById(selectedPost.userId)?.avatar} className="w-14 h-14 rounded-full border-2 border-primary-500 p-0.5" />
                  <div>
                    <h4 className="font-serif text-xl font-bold dark:text-white italic">{mockDb.getUserById(selectedPost.userId)?.name}</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary-500">Master Chef</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <h1 className="font-serif text-5xl font-bold dark:text-white mb-6 leading-tight drop-shadow-sm">{selectedPost.title}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-light italic">"{selectedPost.description}"</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-white/5 p-8 rounded-[2rem]">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-500 flex items-center gap-3 mb-6">
                      <ChefHat className="w-5 h-5" /> The Composition
                    </h5>
                    <div className="flex flex-wrap gap-3">
                      {selectedPost.ingredients.map((ing, i) => (
                        <span key={i} className="bg-white dark:bg-black text-gray-800 dark:text-white text-[11px] px-5 py-2.5 rounded-full font-bold shadow-sm border border-gray-100 dark:border-white/5">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-8">Critiques ({modalComments.length})</h5>
                    <div className="space-y-8">
                      {modalComments.map(c => {
                        const cUser = mockDb.getUserById(c.userId);
                        return (
                          <div key={c.id} className="flex gap-4">
                            <img src={cUser?.avatar} className="w-10 h-10 rounded-full flex-shrink-0 grayscale hover:grayscale-0 transition-all" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold dark:text-white">{cUser?.name}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">{new Date(c.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-light leading-relaxed">{c.text}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-10 border-t dark:border-white/5 bg-gray-50/30 dark:bg-white/5">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-8">
                    <button onClick={() => handleLike(selectedPost.id, 'post')} className={`flex items-center gap-3 group transition-transform active:scale-90 ${selectedPost.likes.includes(user?.id || '') ? 'text-primary-500' : 'text-gray-400'}`}>
                      <Heart className={`w-7 h-7 ${selectedPost.likes.includes(user?.id || '') ? 'fill-current' : ''}`} />
                      <span className="text-sm font-black tracking-widest">{selectedPost.likes.length}</span>
                    </button>
                    <button className="flex items-center gap-3 text-gray-400">
                      <MessageCircle className="w-7 h-7" />
                      <span className="text-sm font-black tracking-widest">{modalComments.length}</span>
                    </button>
                    <button 
                      onClick={() => setSharingPost(selectedPost)}
                      className="text-gray-400 hover:text-primary-500 transition-transform active:scale-90"
                    >
                      <Share2 className="w-7 h-7" />
                    </button>
                  </div>
                  <button className="text-gray-400 hover:text-primary-500 transition-colors">
                    <Bookmark className={`w-7 h-7 ${selectedPost.saves.includes(user?.id || '') ? 'fill-current text-primary-500' : ''}`} />
                  </button>
                </div>

                {user && (
                  <form onSubmit={handleAddModalComment} className="relative">
                    <input 
                      type="text" 
                      value={modalNewComment}
                      onChange={e => setModalNewComment(e.target.value)}
                      placeholder="Share your perspective..." 
                      className="w-full bg-white dark:bg-black border border-gray-100 dark:border-white/10 rounded-full pl-8 pr-16 py-4 text-xs dark:text-white focus:ring-1 focus:ring-primary-500 outline-none" 
                    />
                    <button type="submit" disabled={!modalNewComment.trim()} className="absolute right-3 top-2 bottom-2 aspect-square bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center disabled:opacity-20">
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal (Existing) */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-white/90 dark:bg-black/90 backdrop-blur-xl" onClick={() => setIsEditingProfile(false)}></div>
          <div className="relative bg-white dark:bg-[#121212] w-full max-w-md rounded-[3rem] p-12 shadow-2xl border dark:border-white/5">
            <div className="flex items-center justify-between mb-10">
              <h2 className="font-serif text-3xl font-bold dark:text-white italic">Curator Profile</h2>
              <button onClick={() => setIsEditingProfile(false)} className="text-gray-400 hover:text-black dark:hover:text-white"><X /></button>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-8">
              <div className="flex justify-center mb-10">
                 <div className="relative group cursor-pointer" onClick={() => profileFileRef.current?.click()}>
                   <img src={profileForm.avatar} className="w-32 h-32 rounded-full object-cover border-4 border-primary-500 p-1 shadow-2xl" alt="Avatar" />
                   <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                     <Camera className="w-8 h-8" />
                   </div>
                   <input type="file" ref={profileFileRef} hidden accept="image/*" onChange={(e) => handleFileUpload(e, 'profile')} />
                 </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">Public Alias</label>
                <input type="text" required value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full bg-[#fafafa] dark:bg-black border-none rounded-2xl px-6 py-4 dark:text-white font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">Professional Bio</label>
                <textarea rows={3} value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio: e.target.value})} className="w-full bg-[#fafafa] dark:bg-black border-none rounded-2xl px-6 py-4 dark:text-white text-sm" placeholder="Your culinary philosophy..." />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-[0.2em] py-5 rounded-3xl text-[10px] hover:bg-primary-500 hover:text-white transition-colors">Apply Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action for Mobile */}
      {user && page !== 'new-post' && page !== 'new-menu' && (
        <div className="md:hidden fixed bottom-10 right-10 z-50">
          <button onClick={() => setPage('new-post')} className="bg-black text-white p-5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-transform">
            <Plus className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
