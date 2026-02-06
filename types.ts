
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio?: string;
  following: string[];
  followers: string[];
}

export interface FoodPost {
  id: string;
  userId: string;
  title: string;
  description: string;
  imageUrl: string; // Used for both images and videos (data URL or URI)
  mediaType: 'image' | 'video';
  ingredients: string[];
  tags: string[];
  likes: string[];
  saves: string[];
  createdAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price?: number;
}

export interface MenuIdea {
  id: string;
  userId: string;
  title: string;
  items: MenuItem[];
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Brunch' | 'Special';
  audience: 'Cafe' | 'Restaurant' | 'Home' | 'Event';
  isPublic: boolean;
  likes: string[];
  saves: string[];
  createdAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  entityId: string; // post or menu id
  text: string;
  createdAt: string;
}
