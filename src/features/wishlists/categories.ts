import type { CategoryId } from '@/types';
export const CATEGORIES: { id: CategoryId; label: string; hint: string }[] = [
  { id: 'books', label: 'Книги', hint: 'Проза, комиксы, нон-фикшн' },
  { id: 'games', label: 'Игры', hint: 'Приставки, настолки, пазлы' },
  { id: 'tech', label: 'Техника', hint: 'Гаджеты и аксессуары' },
  { id: 'coffee', label: 'Кофе и чай', hint: 'Зерно, листья, посуда' },
  { id: 'beauty', label: 'Красота', hint: 'Уход и ароматы' },
  { id: 'fashion', label: 'Мода', hint: 'Шарфы, шапки, аксессуары' },
  { id: 'art', label: 'Творчество', hint: 'Краски, наборы, хобби' },
  { id: 'home', label: 'Уют', hint: 'Свечи, пледы, декор' },
  { id: 'sports', label: 'Спорт', hint: 'Тренировки и активный отдых' },
  { id: 'other', label: 'Другое', hint: 'Сюрпризы без категории' },
];
export const catLabel = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)?.label ?? 'Другое';
