
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

export const mockDb = {
  getUser: () => {
    const data = localStorage.getItem('fh_user');
    return data ? JSON.parse(data) : INITIAL_USER;
  },
  setUser: (user: User) => localStorage.setItem('fh_user', JSON.stringify(user)),
  
  getPosts: (): FoodPost[] => {
    const data = localStorage.getItem('fh_posts');
    return data ? JSON.parse(data) : MOCK_POSTS;
  },
  addPost: (post: FoodPost) => {
    const posts = mockDb.getPosts();
    const newPosts = [post, ...posts];
    localStorage.setItem('fh_posts', JSON.stringify(newPosts));
  },
  
  getMenus: (): MenuIdea[] => {
    const data = localStorage.getItem('fh_menus');
    return data ? JSON.parse(data) : MOCK_MENUS;
  },
  addMenu: (menu: MenuIdea) => {
    const menus = mockDb.getMenus();
    const newMenus = [menu, ...menus];
    localStorage.setItem('fh_menus', JSON.stringify(newMenus));
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
      localStorage.setItem('fh_posts', JSON.stringify(updated));
    } else {
      const menus = mockDb.getMenus();
      const updated = menus.map(m => {
        if (m.id === id) {
          const likes = m.likes.includes(userId) ? m.likes.filter(l => l !== userId) : [...m.likes, userId];
          return { ...m, likes };
        }
        return m;
      });
      localStorage.setItem('fh_menus', JSON.stringify(updated));
    }
  }
};
