
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from './components/Navbar';
import PostCard from './components/PostCard';
import MenuCard from './components/MenuCard';
import { mockDb } from './services/mockDb';
import { FoodPost, MenuIdea, User, Comment } from './types';
import { generateFoodPostAI, generateMenuIdeaAI, generateFoodImage } from './services/geminiService';
import { Sparkles, Image as ImageIcon, Plus, X, Loader2, ChevronRight, Heart, MessageCircle, Mail, Lock, User as UserIcon, ArrowRight, UtensilsCrossed, Camera, Upload, Edit2, Trash2, Send, ChefHat, Bookmark, Share2 } from 'lucide-react';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(mockDb.getCurrentUser());
  const [page, setPage] = useState(user ? 'home' : 'auth');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<FoodPost[]>(mockDb.getPosts());
  const [menus, setMenus] = useState<MenuIdea[]>(mockDb.getMenus());
  const [loading, setLoading] = useState(false);

  // Modal State
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const selectedPost = useMemo(() => posts.find(p => p.id === selectedPostId), [posts, selectedPostId]);
  const [modalComments, setModalComments] = useState<Comment[]>([]);
  const [modalNewComment, setModalNewComment] = useState('');

  // File Inputs
  const postFileRef = useRef<HTMLInputElement>(null);
  const profileFileRef = useRef<HTMLInputElement>(null);

  // Auth States
  const [isRegistering, setIsRegistering] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });

  // Post State (used for both New and Edit)
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [postFormId, setPostFormId] = useState<string | null>(null);
  const [newPost, setNewPost] = useState({ title: '', description: '', ingredients: '', tags: '', imageUrl: '' });

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
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (target === 'post') setNewPost(prev => ({ ...prev, imageUrl: base64 }));
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
        tags: result.tags.join(', ')
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

  const handleAiGenerateMenu = async () => {
    if (!newMenu.title) return alert("Please enter a menu concept title!");
    setLoading(true);
    try {
      const result = await generateMenuIdeaAI(newMenu.title, newMenu.audience);
      setNewMenu(prev => ({
        ...prev,
        title: result.title,
        items: result.items.map(i => ({ ...i, price: i.price?.toString() || '' }))
      }));
    } catch (e) {
      console.error(e);
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
      imageUrl: post.imageUrl
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
        ingredients: newPost.ingredients.split(',').map(i => i.trim()),
        tags: newPost.tags.split(',').map(i => i.trim()),
        likes: [],
        saves: [],
        createdAt: new Date().toISOString()
      };
      mockDb.addPost(post);
    }
    
    setPosts(mockDb.getPosts());
    setNewPost({ title: '', description: '', ingredients: '', tags: '', imageUrl: '' });
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
    // Refresh main posts state to update comment counts
    setPosts(mockDb.getPosts());
  };

  const submitMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const menu: MenuIdea = {
      id: `menu-${Date.now()}`,
      userId: user.id,
      title: newMenu.title,
      category: newMenu.category as any,
      audience: newMenu.audience as any,
      items: newMenu.items.map((it, idx) => ({ 
        id: idx.toString(), 
        name: it.name, 
        description: it.description, 
        price: it.price ? parseFloat(it.price) : undefined 
      })),
      isPublic: true,
      likes: [],
      saves: [],
      createdAt: new Date().toISOString()
    };
    mockDb.addMenu(menu);
    setMenus(mockDb.getMenus());
    setNewMenu({ title: '', category: 'Lunch', audience: 'Cafe', items: [{ name: '', description: '', price: '' }] });
    setPage('home');
  };

  if (page === 'auth') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
        {/* Auth components... */}
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
    <div className="min-h-screen pb-12 bg-gray-50 dark:bg-gray-950">
      <Navbar 
        darkMode={darkMode} 
        toggleDarkMode={() => setDarkMode(!darkMode)} 
        currentPage={page} 
        setPage={(p) => { 
          if (p === 'new-post') { setIsEditingPost(false); setNewPost({ title: '', description: '', ingredients: '', tags: '', imageUrl: '' }); }
          setPage(p); 
        }} 
        onSearch={setSearchQuery}
        user={user}
        onLogout={handleLogout}
      />

      <main className="max-w-6xl mx-auto px-4 mt-8">
        {page === 'home' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-2xl font-bold dark:text-white">Fresh Posts</h2>
                  <button onClick={() => setPage('explore')} className="text-primary-500 text-sm font-semibold flex items-center">View All <ChevronRight className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {filteredPosts.slice(0, 4).map(post => (
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
                    />
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-2xl font-bold dark:text-white">Curated Menus</h2>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {filteredMenus.map(menu => (
                    <MenuCard key={menu.id} menu={menu} onLike={(id) => handleLike(id, 'menu')} isLiked={menu.likes.includes(user?.id || '')} />
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="hidden md:block space-y-8">
              {user && (
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-4 mb-4">
                    <img src={user.avatar} className="w-12 h-12 rounded-full object-cover" alt="Me" />
                    <div>
                      <h3 className="font-bold dark:text-white">{user.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2">{user.bio}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <div className="text-center">
                      <div className="font-bold text-sm dark:text-white">{posts.filter(p => p.userId === user.id).length}</div>
                      <div className="text-[10px] text-gray-500 uppercase">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-sm dark:text-white">{menus.filter(m => m.userId === user.id).length}</div>
                      <div className="text-[10px] text-gray-500 uppercase">Menus</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-sm dark:text-white">0</div>
                      <div className="text-[10px] text-gray-500 uppercase">Saved</div>
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-gradient-to-br from-primary-500 to-orange-600 p-6 rounded-2xl text-white shadow-lg">
                <div className="bg-white/20 w-10 h-10 rounded-lg flex items-center justify-center mb-4"><Sparkles className="w-6 h-6" /></div>
                <h3 className="font-bold text-lg mb-2">AI Inspiration</h3>
                <p className="text-sm text-primary-50 mb-4 opacity-90">Need a fresh menu for your weekend pop-up? Let Gemini help you design the perfect spread.</p>
                <button onClick={() => setPage('new-menu')} className="w-full bg-white text-primary-600 font-bold py-2 rounded-xl text-sm transition-transform active:scale-95">Get Started</button>
              </div>
            </div>
          </div>
        )}

        {page === 'new-post' && (
          <div className="max-w-2xl mx-auto">
            <h1 className="font-serif text-3xl font-bold dark:text-white mb-8">{isEditingPost ? 'Edit Your Dish' : 'Share a Dish'}</h1>
            <form onSubmit={submitPost} className="space-y-6">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dish Name</label>
                  <div className="flex gap-2">
                    <input required type="text" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} placeholder="e.g. Avocado Toast" className="flex-1 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 dark:text-white" />
                    {!isEditingPost && (
                      <button type="button" onClick={handleAiGeneratePost} disabled={loading} className="bg-primary-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 disabled:opacity-50">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        <span className="hidden sm:inline">AI Magic</span>
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea required value={newPost.description} onChange={e => setNewPost({...newPost, description: e.target.value})} rows={4} placeholder="The story behind this dish..." className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ingredients</label>
                    <input type="text" value={newPost.ingredients} onChange={e => setNewPost({...newPost, ingredients: e.target.value})} placeholder="flour, eggs..." className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
                    <input type="text" value={newPost.tags} onChange={e => setNewPost({...newPost, tags: e.target.value})} placeholder="vegan, breakfast..." className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 dark:text-white" />
                  </div>
                </div>
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Photo</label>
                  {newPost.imageUrl ? (
                    <div className="relative rounded-2xl overflow-hidden aspect-video">
                      <img src={newPost.imageUrl} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button type="button" onClick={() => postFileRef.current?.click()} className="bg-black/50 text-white p-2 rounded-full"><Edit2 className="w-4 h-4" /></button>
                        <button type="button" onClick={() => setNewPost({...newPost, imageUrl: ''})} className="bg-black/50 text-white p-2 rounded-full"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => postFileRef.current?.click()} className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl aspect-video flex flex-col items-center justify-center text-gray-500 gap-2">
                      <Upload className="w-10 h-10" />
                      <p className="text-sm font-medium">Upload Dish Photo</p>
                    </button>
                  )}
                  <input type="file" ref={postFileRef} hidden accept="image/*" onChange={(e) => handleFileUpload(e, 'post')} />
                </div>
              </div>
              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600">{isEditingPost ? 'Save Changes' : 'Publish Post'}</button>
                <button type="button" onClick={() => setPage('home')} className="px-8 py-3 font-semibold text-gray-500">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {page === 'explore' && (
          <div className="space-y-8">
            <h1 className="font-serif text-3xl font-bold dark:text-white">Discover</h1>
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
              {filteredPosts.map(post => (
                <div key={post.id} className="break-inside-avoid">
                  <PostCard post={post} onLike={(id) => handleLike(id, 'post')} isLiked={post.likes.includes(user?.id || '')} isSaved={post.saves.includes(user?.id || '')} currentUserId={user?.id} onEdit={startEditPost} onDelete={deletePost} onViewDetails={setSelectedPostId} />
                </div>
              ))}
            </div>
          </div>
        )}

        {page === 'profile' && user && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <img src={user.avatar} className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-xl object-cover" alt="Me" />
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                  <h1 className="text-2xl font-bold dark:text-white">{user.name}</h1>
                  <div className="flex gap-2 justify-center md:justify-start">
                    <button onClick={openEditProfile} className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 dark:text-white text-sm font-semibold rounded-lg">Edit Profile</button>
                  </div>
                </div>
                <div className="flex gap-6 mb-4 text-sm justify-center md:justify-start">
                  <span className="dark:text-white"><b>{posts.filter(p => p.userId === user.id).length}</b> posts</span>
                  <span className="dark:text-white"><b>0</b> followers</span>
                  <span className="dark:text-white"><b>0</b> following</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic max-w-md">"{user.bio}"</p>
              </div>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800 pt-8">
              <div className="flex gap-8 justify-center mb-8 border-b dark:border-gray-800">
                <button className="pb-4 border-b-2 border-primary-500 font-bold dark:text-white uppercase text-xs">My Posts</button>
                <button className="pb-4 border-b-2 border-transparent text-gray-400 uppercase text-xs">Saved</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {posts.filter(p => p.userId === user.id).length > 0 ? (
                  posts.filter(p => p.userId === user.id).map(p => (
                    <div key={p.id} onClick={() => setSelectedPostId(p.id)} className="aspect-square relative group cursor-pointer overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-800">
                      <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold">
                        <span className="flex items-center gap-1"><Heart className="w-5 h-5 fill-current" /> {p.likes.length}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="w-5 h-5 fill-current" /> {mockDb.getComments(p.id).length}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center"><p className="text-gray-500">No posts yet.</p></div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedPostId(null)}></div>
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-6xl h-full max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
            {/* Modal Close Button (Mobile Only) */}
            <button onClick={() => setSelectedPostId(null)} className="absolute top-4 right-4 z-20 md:hidden bg-black/50 text-white p-2 rounded-full"><X /></button>
            
            {/* Left Column: Image */}
            <div className="md:w-3/5 bg-black flex items-center justify-center overflow-hidden">
              <img src={selectedPost.imageUrl} className="w-full h-full object-contain" alt={selectedPost.title} />
            </div>

            {/* Right Column: Details */}
            <div className="md:w-2/5 flex flex-col h-full dark:bg-gray-900 border-l dark:border-gray-800">
              {/* Modal Header */}
              <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={mockDb.getUserById(selectedPost.userId)?.avatar} className="w-10 h-10 rounded-full border border-gray-100 dark:border-gray-800" />
                  <div>
                    <h4 className="font-bold text-sm dark:text-white">{mockDb.getUserById(selectedPost.userId)?.name}</h4>
                    <p className="text-[10px] text-gray-500">{new Date(selectedPost.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {user?.id === selectedPost.userId && (
                    <div className="flex gap-1">
                      <button onClick={() => startEditPost(selectedPost)} className="p-2 text-gray-400 hover:text-primary-500"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deletePost(selectedPost.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                  <button onClick={() => setSelectedPostId(null)} className="hidden md:block p-2 text-gray-400 hover:text-gray-600"><X /></button>
                </div>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                <div>
                  <h1 className="font-serif text-2xl font-bold dark:text-white mb-2">{selectedPost.title}</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{selectedPost.description}</p>
                </div>

                {/* Ingredients Section */}
                <div>
                  <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                    <ChefHat className="w-4 h-4" /> Kitchen Secrets
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedPost.ingredients.map((ing, i) => (
                      <span key={i} className="bg-orange-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-[10px] px-3 py-1.5 rounded-lg font-semibold border border-primary-100 dark:border-primary-800">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {selectedPost.tags.map(tag => (
                    <span key={tag} className="text-[10px] text-gray-400 font-medium">#{tag}</span>
                  ))}
                </div>

                {/* Comments Thread */}
                <div className="border-t dark:border-gray-800 pt-6">
                  <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Feedbacks ({modalComments.length})</h5>
                  <div className="space-y-4">
                    {modalComments.map(c => {
                      const cUser = mockDb.getUserById(c.userId);
                      return (
                        <div key={c.id} className="flex gap-3">
                          <img src={cUser?.avatar} className="w-8 h-8 rounded-full flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-bold dark:text-white">{cUser?.name}</span>
                              <span className="text-[9px] text-gray-400">{new Date(c.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl">{c.text}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer (Interactions) */}
              <div className="p-4 border-t dark:border-gray-800 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleLike(selectedPost.id, 'post')}
                      className={`flex items-center gap-2 transition-colors ${selectedPost.likes.includes(user?.id || '') ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'}`}
                    >
                      <Heart className={`w-5 h-5 ${selectedPost.likes.includes(user?.id || '') ? 'fill-current' : ''}`} />
                      <span className="text-xs font-bold">{selectedPost.likes.length}</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-primary-500">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-xs font-bold">{modalComments.length}</span>
                    </button>
                    <button className="text-gray-500 dark:text-gray-400 hover:text-blue-500">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                  <button className="text-gray-500 dark:text-gray-400 hover:text-primary-500">
                    <Bookmark className="w-5 h-5" />
                  </button>
                </div>

                {user && (
                  <form onSubmit={handleAddModalComment} className="flex gap-2">
                    <input 
                      type="text" 
                      value={modalNewComment}
                      onChange={e => setModalNewComment(e.target.value)}
                      placeholder="Add a comment..." 
                      className="flex-1 bg-white dark:bg-gray-800 border-none rounded-full px-4 py-2 text-xs dark:text-white focus:ring-1 focus:ring-primary-500" 
                    />
                    <button type="submit" disabled={!modalNewComment.trim()} className="bg-primary-500 text-white p-2 rounded-full disabled:opacity-50"><Send className="w-4 h-4" /></button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal... (Existing Code) */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditingProfile(false)}></div>
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold dark:text-white">Edit Profile</h2>
              <button onClick={() => setIsEditingProfile(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="flex justify-center mb-6">
                 <div className="relative group cursor-pointer" onClick={() => profileFileRef.current?.click()}>
                   <img src={profileForm.avatar} className="w-24 h-24 rounded-full object-cover border-4 border-primary-500 shadow-lg" alt="Avatar" />
                   <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="w-6 h-6" /></div>
                   <input type="file" ref={profileFileRef} hidden accept="image/*" onChange={(e) => handleFileUpload(e, 'profile')} />
                 </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Display Name</label>
                <input type="text" required value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Bio</label>
                <textarea rows={3} value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 dark:text-white" placeholder="Tell us about your culinary passion..." />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600">Save Changes</button>
                <button type="button" onClick={() => setIsEditingProfile(false)} className="px-6 py-3 font-semibold text-gray-500">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action for Mobile */}
      {user && page !== 'new-post' && page !== 'new-menu' && (
        <div className="md:hidden fixed bottom-6 right-6 z-50">
          <button onClick={() => setPage('new-post')} className="bg-primary-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-transform">
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
