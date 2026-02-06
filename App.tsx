
import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import PostCard from './components/PostCard';
import MenuCard from './components/MenuCard';
import { mockDb } from './services/mockDb';
import { FoodPost, MenuIdea, User } from './types';
import { generateFoodPostAI, generateMenuIdeaAI, generateFoodImage } from './services/geminiService';
// Fix: Added missing Heart and MessageCircle icons to the lucide-react import list
import { Sparkles, Image as ImageIcon, Plus, X, Loader2, ChevronRight, Heart, MessageCircle } from 'lucide-react';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [page, setPage] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<User>(mockDb.getUser());
  const [posts, setPosts] = useState<FoodPost[]>(mockDb.getPosts());
  const [menus, setMenus] = useState<MenuIdea[]>(mockDb.getMenus());
  const [loading, setLoading] = useState(false);

  // Forms State
  const [newPost, setNewPost] = useState({ title: '', description: '', ingredients: '', tags: '', imageUrl: '' });
  const [newMenu, setNewMenu] = useState({ title: '', category: 'Lunch', audience: 'Cafe', items: [{ name: '', description: '', price: '' }] });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
    mockDb.toggleLike(id, type, user.id);
    if (type === 'post') setPosts(mockDb.getPosts());
    else setMenus(mockDb.getMenus());
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
      
      // Auto generate image too
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

  const submitPost = (e: React.FormEvent) => {
    e.preventDefault();
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
    setPosts(mockDb.getPosts());
    setNewPost({ title: '', description: '', ingredients: '', tags: '', imageUrl: '' });
    setPage('home');
  };

  const submitMenu = (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="min-h-screen pb-12">
      <Navbar 
        darkMode={darkMode} 
        toggleDarkMode={() => setDarkMode(!darkMode)} 
        currentPage={page} 
        setPage={setPage}
        onSearch={setSearchQuery}
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
                      isLiked={post.likes.includes(user.id)}
                      isSaved={post.saves.includes(user.id)}
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
                    <MenuCard 
                      key={menu.id} 
                      menu={menu} 
                      onLike={(id) => handleLike(id, 'menu')}
                      isLiked={menu.likes.includes(user.id)}
                    />
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="hidden md:block space-y-8">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4 mb-4">
                  <img src={user.avatar} className="w-12 h-12 rounded-full" alt="Me" />
                  <div>
                    <h3 className="font-bold dark:text-white">{user.name}</h3>
                    <p className="text-xs text-gray-500">{user.bio}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                  <div className="text-center">
                    <div className="font-bold text-sm dark:text-white">{posts.length}</div>
                    <div className="text-[10px] text-gray-500 uppercase">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-sm dark:text-white">{menus.length}</div>
                    <div className="text-[10px] text-gray-500 uppercase">Menus</div>
                  </div>
                   <div className="text-center">
                    <div className="font-bold text-sm dark:text-white">1.2k</div>
                    <div className="text-[10px] text-gray-500 uppercase">Saved</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary-500 to-orange-600 p-6 rounded-2xl text-white shadow-lg">
                <div className="bg-white/20 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2">AI Inspiration</h3>
                <p className="text-sm text-primary-50 mb-4 opacity-90">Need a fresh menu for your weekend pop-up? Let Gemini help you design the perfect spread.</p>
                <button 
                  onClick={() => setPage('new-menu')}
                  className="w-full bg-white text-primary-600 font-bold py-2 rounded-xl text-sm transition-transform active:scale-95"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}

        {page === 'new-post' && (
          <div className="max-w-2xl mx-auto">
            <h1 className="font-serif text-3xl font-bold dark:text-white mb-8">Share a Dish</h1>
            <form onSubmit={submitPost} className="space-y-6">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dish Name</label>
                  <div className="flex gap-2">
                    <input 
                      required
                      type="text" 
                      value={newPost.title}
                      onChange={e => setNewPost({...newPost, title: e.target.value})}
                      placeholder="e.g. Avocado Toast with Poached Egg"
                      className="flex-1 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 focus:ring-primary-500 dark:text-white" 
                    />
                    <button 
                      type="button"
                      onClick={handleAiGeneratePost}
                      disabled={loading}
                      className="bg-primary-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-primary-600 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span className="hidden sm:inline">AI Magic</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description / Story</label>
                  <textarea 
                    required
                    value={newPost.description}
                    onChange={e => setNewPost({...newPost, description: e.target.value})}
                    rows={4}
                    placeholder="Tell the story behind this dish..."
                    className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 focus:ring-primary-500 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ingredients (comma separated)</label>
                    <input 
                      type="text" 
                      value={newPost.ingredients}
                      onChange={e => setNewPost({...newPost, ingredients: e.target.value})}
                      placeholder="flour, eggs, milk"
                      className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 focus:ring-primary-500 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma separated)</label>
                    <input 
                      type="text" 
                      value={newPost.tags}
                      onChange={e => setNewPost({...newPost, tags: e.target.value})}
                      placeholder="vegan, healthy, breakfast"
                      className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 focus:ring-primary-500 dark:text-white"
                    />
                  </div>
                </div>

                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image Preview</label>
                  {newPost.imageUrl ? (
                    <div className="relative rounded-2xl overflow-hidden aspect-video">
                      <img src={newPost.imageUrl} className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setNewPost({...newPost, imageUrl: ''})}
                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl aspect-video flex flex-col items-center justify-center text-gray-500 gap-2 hover:border-primary-400 transition-colors">
                      <ImageIcon className="w-10 h-10" />
                      <p className="text-xs">Image will appear here from AI or Upload</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 shadow-lg shadow-primary-200 dark:shadow-none">Publish Post</button>
                <button type="button" onClick={() => setPage('home')} className="px-8 py-3 font-semibold text-gray-500 dark:text-gray-400">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {page === 'new-menu' && (
          <div className="max-w-2xl mx-auto">
             <div className="flex items-center justify-between mb-8">
              <h1 className="font-serif text-3xl font-bold dark:text-white">New Menu Idea</h1>
              <button 
                onClick={handleAiGenerateMenu}
                className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-primary-200 transition-colors font-semibold"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate with AI
              </button>
            </div>

            <form onSubmit={submitMenu} className="space-y-6">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Menu Title</label>
                    <input 
                      required
                      type="text" 
                      value={newMenu.title}
                      onChange={e => setNewMenu({...newMenu, title: e.target.value})}
                      placeholder="e.g. Modern Italian Lunch"
                      className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 focus:ring-primary-500 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                      <select 
                        value={newMenu.category}
                        onChange={e => setNewMenu({...newMenu, category: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 focus:ring-primary-500 dark:text-white"
                      >
                        <option>Breakfast</option>
                        <option>Lunch</option>
                        <option>Dinner</option>
                        <option>Brunch</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Audience</label>
                      <select 
                        value={newMenu.audience}
                        onChange={e => setNewMenu({...newMenu, audience: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 focus:ring-primary-500 dark:text-white"
                      >
                        <option>Cafe</option>
                        <option>Restaurant</option>
                        <option>Home</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Menu Items</label>
                  {newMenu.items.map((item, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl relative">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <input 
                            placeholder="Dish Name"
                            value={item.name}
                            onChange={e => {
                              const items = [...newMenu.items];
                              items[index].name = e.target.value;
                              setNewMenu({...newMenu, items});
                            }}
                            className="w-full bg-white dark:bg-gray-700 border-transparent rounded-lg px-3 py-1.5 text-sm dark:text-white"
                          />
                        </div>
                        <div className="md:col-span-1">
                          <input 
                            placeholder="Price"
                            type="number"
                            value={item.price}
                            onChange={e => {
                              const items = [...newMenu.items];
                              items[index].price = e.target.value;
                              setNewMenu({...newMenu, items});
                            }}
                            className="w-full bg-white dark:bg-gray-700 border-transparent rounded-lg px-3 py-1.5 text-sm dark:text-white"
                          />
                        </div>
                        <div className="flex items-center justify-end">
                           {newMenu.items.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => setNewMenu({...newMenu, items: newMenu.items.filter((_, i) => i !== index)})}
                              className="text-red-400 hover:text-red-600"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                        <div className="md:col-span-4">
                          <input 
                            placeholder="Short description..."
                            value={item.description}
                            onChange={e => {
                              const items = [...newMenu.items];
                              items[index].description = e.target.value;
                              setNewMenu({...newMenu, items});
                            }}
                            className="w-full bg-white dark:bg-gray-700 border-transparent rounded-lg px-3 py-1.5 text-sm dark:text-white mt-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => setNewMenu({...newMenu, items: [...newMenu.items, { name: '', description: '', price: '' }]})}
                    className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400 hover:text-primary-500 hover:border-primary-400 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" /> Add Another Item
                  </button>
                </div>
              </div>

               <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 shadow-lg shadow-primary-200 dark:shadow-none">Save Menu Idea</button>
                <button type="button" onClick={() => setPage('home')} className="px-8 py-3 font-semibold text-gray-500 dark:text-gray-400">Cancel</button>
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
                  <PostCard 
                    post={post} 
                    onLike={(id) => handleLike(id, 'post')}
                    isLiked={post.likes.includes(user.id)}
                    isSaved={post.saves.includes(user.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {page === 'profile' && (
           <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800">
              <img src={user.avatar} className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-xl" alt="Me" />
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                  <h1 className="text-2xl font-bold dark:text-white">{user.name}</h1>
                  <div className="flex gap-2 justify-center md:justify-start">
                    <button className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 dark:text-white text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors">Edit Profile</button>
                    <button className="p-1.5 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-lg"><Plus className="w-5 h-5" /></button>
                  </div>
                </div>
                <div className="flex gap-6 mb-4 text-sm justify-center md:justify-start">
                  <span className="dark:text-white"><b>{posts.length}</b> posts</span>
                  <span className="dark:text-white"><b>245</b> followers</span>
                  <span className="dark:text-white"><b>189</b> following</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic max-w-md">"{user.bio}"</p>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-8">
               <div className="flex gap-8 justify-center mb-8 border-b dark:border-gray-800">
                <button className="pb-4 border-b-2 border-primary-500 font-bold dark:text-white">My Posts</button>
                <button className="pb-4 border-b-2 border-transparent text-gray-400 hover:text-gray-600">Saved</button>
                <button className="pb-4 border-b-2 border-transparent text-gray-400 hover:text-gray-600">Tagged</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {posts.filter(p => p.userId === user.id).map(p => (
                  <div key={p.id} className="aspect-square relative group cursor-pointer overflow-hidden rounded-xl">
                    <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold">
                      <span className="flex items-center gap-1"><Heart className="w-5 h-5 fill-current" /> {p.likes.length}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-5 h-5 fill-current" /> 12</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
           </div>
        )}
      </main>

      {/* Floating Action for Mobile */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => setPage('new-post')}
          className="bg-primary-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default App;
