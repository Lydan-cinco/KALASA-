
import { User, FoodPost, MenuIdea, Comment } from '../types';

const INITIAL_USER: User = {
  id: 'user-1',
  name: 'Chef Maria',
  email: 'maria@example.com',
  avatar: 'https://picsum.photos/seed/maria/200',
  bio: 'Passionate about farm-to-table cuisine.',
  following: [],
  followers: []
};

const MOCK_POSTS: FoodPost[] = [
  {
    id: 'post-1',
    userId: 'user-1',
    title: 'Smoky Chipotle Burger',
    description: 'A juicy angus beef patty topped with smoked cheddar, crispy onions, and our secret chipotle sauce.',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800',
    ingredients: ['Angus Beef', 'Smoked Cheddar', 'Chipotle Mayo', 'Brioche Bun'],
    tags: ['burger', 'lunch', 'comfortfood'],
    likes: ['user-2'],
    saves: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'post-2',
    userId: 'user-1',
    title: 'Matcha Glazed Donuts',
    description: 'Fluffy sourdough donuts dipped in a vibrant ceremonal-grade matcha glaze. Perfectly balanced sweetness.',
    imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=800',
    ingredients: ['Matcha', 'Sourdough Starter', 'Honey', 'Vanilla'],
    tags: ['matcha', 'donuts', 'vegan'],
    likes: [],
    saves: ['user-1'],
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

const MOCK_MENUS: MenuIdea[] = [
  {
    id: 'menu-1',
    userId: 'user-1',
    title: 'Sunday Morning Brunch',
    items: [
      { id: '1', name: 'Eggs Benedict', description: 'Poached eggs over Canadian bacon and English muffin with Hollandaise.', price: 18 },
      { id: '2', name: 'Lemon Ricotta Pancakes', description: 'Light and airy with fresh berry compote.', price: 15 },
      { id: '3', name: 'Avocado Toast', description: 'Sourdough, smashed avocado, chili flakes, radish.', price: 14 }
    ],
    category: 'Brunch',
    audience: 'Cafe',
    isPublic: true,
    likes: [],
    saves: [],
    createdAt: new Date().toISOString()
  }
];

const MOCK_COMMENTS: Comment[] = [
  {
    id: 'comment-1',
    userId: 'user-1',
    entityId: 'post-1',
    text: 'That burger looks incredible! Does the brioche bun hold up well?',
    createdAt: new Date().toISOString()
  }
];

export const mockDb = {
  getCurrentUser: () => {
    const data = localStorage.getItem('kalasa_session');
    return data ? JSON.parse(data) : null;
  },
  
  getUserById: (id: string) => {
    const users = mockDb.getAllUsers();
    return users.find(u => u.id === id);
  },

  login: (email: string) => {
    const users = mockDb.getAllUsers();
    const user = users.find(u => u.email === email);
    if (user) {
      localStorage.setItem('kalasa_session', JSON.stringify(user));
      return user;
    }
    return null;
  },

  register: (name: string, email: string) => {
    const users = mockDb.getAllUsers();
    if (users.find(u => u.email === email)) return null;

    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      bio: 'New member of KALASA family.',
      following: [],
      followers: []
    };

    localStorage.setItem('kalasa_users', JSON.stringify([...users, newUser]));
    localStorage.setItem('kalasa_session', JSON.stringify(newUser));
    return newUser;
  },

  updateUser: (userId: string, updates: Partial<User>) => {
    const users = mockDb.getAllUsers();
    const updatedUsers = users.map(u => u.id === userId ? { ...u, ...updates } : u);
    localStorage.setItem('kalasa_users', JSON.stringify(updatedUsers));
    
    const current = mockDb.getCurrentUser();
    if (current?.id === userId) {
      localStorage.setItem('kalasa_session', JSON.stringify({ ...current, ...updates }));
    }
    return { ...current, ...updates };
  },

  logout: () => {
    localStorage.removeItem('kalasa_session');
  },

  getAllUsers: (): User[] => {
    const data = localStorage.getItem('kalasa_users');
    return data ? JSON.parse(data) : [INITIAL_USER];
  },
  
  getPosts: (): FoodPost[] => {
    const data = localStorage.getItem('kalasa_posts');
    return data ? JSON.parse(data) : MOCK_POSTS;
  },

  addPost: (post: FoodPost) => {
    const posts = mockDb.getPosts();
    const newPosts = [post, ...posts];
    localStorage.setItem('kalasa_posts', JSON.stringify(newPosts));
  },

  updatePost: (post: FoodPost) => {
    const posts = mockDb.getPosts();
    const updated = posts.map(p => p.id === post.id ? post : p);
    localStorage.setItem('kalasa_posts', JSON.stringify(updated));
  },

  deletePost: (postId: string) => {
    const posts = mockDb.getPosts();
    const updated = posts.filter(p => p.id !== postId);
    localStorage.setItem('kalasa_posts', JSON.stringify(updated));
  },
  
  getMenus: (): MenuIdea[] => {
    const data = localStorage.getItem('kalasa_menus');
    return data ? JSON.parse(data) : MOCK_MENUS;
  },

  addMenu: (menu: MenuIdea) => {
    const menus = mockDb.getMenus();
    const newMenus = [menu, ...menus];
    localStorage.setItem('kalasa_menus', JSON.stringify(newMenus));
  },

  getComments: (entityId: string): Comment[] => {
    const data = localStorage.getItem('kalasa_comments');
    const comments: Comment[] = data ? JSON.parse(data) : MOCK_COMMENTS;
    return comments.filter(c => c.entityId === entityId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  addComment: (comment: Comment) => {
    const data = localStorage.getItem('kalasa_comments');
    const comments: Comment[] = data ? JSON.parse(data) : MOCK_COMMENTS;
    localStorage.setItem('kalasa_comments', JSON.stringify([...comments, comment]));
  },

  toggleLike: (id: string, type: 'post' | 'menu', userId: string) => {
    if (type === 'post') {
      const posts = mockDb.getPosts();
      const updated = posts.map(p => {
        if (p.id === id) {
          const likes = p.likes.includes(userId) ? p.likes.filter(l => l !== userId) : [...p.likes, userId];
          return { ...p, likes };
        }
        return p;
      });
      localStorage.setItem('kalasa_posts', JSON.stringify(updated));
    } else {
      const menus = mockDb.getMenus();
      const updated = menus.map(m => {
        if (m.id === id) {
          const likes = m.likes.includes(userId) ? m.likes.filter(l => l !== userId) : [...m.likes, userId];
          return { ...m, likes };
        }
        return m;
      });
      localStorage.setItem('kalasa_menus', JSON.stringify(updated));
    }
  }
};
