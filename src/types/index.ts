export type CategoryId = 'books' | 'games' | 'tech' | 'coffee' | 'beauty' | 'fashion' | 'art' | 'home' | 'sports' | 'other';
export interface User { id: string; name: string }
export interface Item { id: string; name: string; price: number; category: CategoryId; priority: 1 | 2 | 3; url?: string; note?: string }
export interface Wishlist { interests: CategoryId[]; items: Item[]; unwanted: string }
export interface Room {
  id: string; code: string; name: string; description: string; budget: number; date: string;
  maxMembers: number; anonymous: boolean; organizerId: string; stage: 'gathering' | 'drawn';
  members: string[]; exclusions: [string, string][];
}
export interface Message {
  id: string; roomId: string; giverId: string; receiverId: string;
  author: 'giver' | 'receiver'; text: string; reported: boolean; at: number; demo?: boolean;
}
export interface Idea { name: string; min: number; max: number; why: string; category: CategoryId; matched: CategoryId[] }
export const STATUS_LABELS = ['Получатель назначен', 'Выбираю подарок', 'Подарок куплен', 'Подарок готов'] as const;
