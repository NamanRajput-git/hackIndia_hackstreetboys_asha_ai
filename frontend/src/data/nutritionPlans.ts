import { Sunrise, Sun, Moon, Coffee } from 'lucide-react';

export interface Meal {
  type: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  title: string;
  subtitle: string;
  tags: string[];
  icon: any;
}

export interface DailyPlan {
  day: string;
  localDay: string; // Hindi name
  meals: Meal[];
}

export const ANEMIA_PLAN: DailyPlan[] = [
  {
    day: 'Monday',
    localDay: 'Somvaar',
    meals: [
      {
        type: 'breakfast',
        title: 'Sprouted Chana + Jaggery (Gud)',
        subtitle: 'With Lemon Water',
        tags: ['High Iron', 'Energy'],
        icon: Sunrise
      },
      {
        type: 'lunch',
        title: 'Roti + Palak Dal (Spinach)',
        subtitle: 'Cooked in Iron Kadhai',
        tags: ['Iron', 'Protein'],
        icon: Sun
      },
      {
        type: 'snack',
        title: 'Roasted Peanuts + Dates',
        subtitle: 'Evening Snack',
        tags: ['Folate', 'Iron'],
        icon: Coffee
      },
      {
        type: 'dinner',
        title: 'Khichdi with Drumstick Leaves',
        subtitle: 'Light & Nutritious',
        tags: ['Digestion', 'Vitamins'],
        icon: Moon
      }
    ]
  },
  {
    day: 'Tuesday',
    localDay: 'Mangalvaar',
    meals: [
      {
        type: 'breakfast',
        title: 'Poha with Peanuts & Lemon',
        subtitle: 'Squeeze extra lemon for absorption',
        tags: ['Iron Absorption', 'Carbs'],
        icon: Sunrise
      },
      {
        type: 'lunch',
        title: 'Methi (Fenugreek) Paratha + Curd',
        subtitle: 'Green leafy vegetables are best',
        tags: ['Calcium', 'Iron'],
        icon: Sun
      },
      {
        type: 'snack',
        title: 'Sesame (Til) Ladoo',
        subtitle: 'One small ladoo',
        tags: ['Calcium', 'Iron'],
        icon: Coffee
      },
      {
        type: 'dinner',
        title: 'Vegetable Dalia',
        subtitle: 'Add carrots and peas',
        tags: ['Fiber', 'Light'],
        icon: Moon
      }
    ]
  },
  {
    day: 'Wednesday',
    localDay: 'Budhvaar',
    meals: [
      {
        type: 'breakfast',
        title: 'Oats / Dalia Porridge',
        subtitle: 'With milk or water',
        tags: ['Fiber', 'Energy'],
        icon: Sunrise
      },
      {
        type: 'lunch',
        title: 'Rajma + Rice + Salad',
        subtitle: 'Kidney beans are iron-rich',
        tags: ['Protein', 'Iron'],
        icon: Sun
      },
      {
        type: 'snack',
        title: 'Citrus Fruit (Orange/Guava)',
        subtitle: 'Vitamin C helps Iron absorption',
        tags: ['Vitamin C'],
        icon: Coffee
      },
      {
        type: 'dinner',
        title: 'Bottle Gourd (Lauki) Sabzi + Roti',
        subtitle: 'Easy to digest',
        tags: ['Hydration'],
        icon: Moon
      }
    ]
  },
  // ... Pattern continues for other days, simplified for MVP
  {
    day: 'Thursday',
    localDay: 'Guruvaar',
    meals: [
      { type: 'breakfast', title: 'Besan Chilla with Spinach', subtitle: 'Protein packed', tags: ['Protein', 'Iron'], icon: Sunrise },
      { type: 'lunch', title: 'Sarson Ka Saag + Roti', subtitle: 'Seasonal greens', tags: ['High Iron'], icon: Sun },
      { type: 'snack', title: 'Boiled Egg / Paneer', subtitle: 'Protein boost', tags: ['Protein'], icon: Coffee },
      { type: 'dinner', title: 'Moong Dal + Rice', subtitle: 'Comfort food', tags: ['Light'], icon: Moon }
    ]
  },
  {
    day: 'Friday',
    localDay: 'Shukravaar',
    meals: [
      { type: 'breakfast', title: 'Ragi (Finger Millet) Dosa/Porridge', subtitle: 'Ragi is superfood', tags: ['Calcium', 'Iron'], icon: Sunrise },
      { type: 'lunch', title: 'Soyabean Curry + Rice', subtitle: 'High protein', tags: ['Protein'], icon: Sun },
      { type: 'snack', title: 'Roasted Chana', subtitle: 'Crunchy snack', tags: ['Iron'], icon: Coffee },
      { type: 'dinner', title: 'Mixed Veg Soup + Bread', subtitle: 'Warm & light', tags: ['Vitamins'], icon: Moon }
    ]
  },
  {
    day: 'Saturday',
    localDay: 'Shanivaar',
    meals: [
      { type: 'breakfast', title: 'Upma with Peas & Carrots', subtitle: 'Veggie loaded', tags: ['Fiber'], icon: Sunrise },
      { type: 'lunch', title: 'Black Chana Curry + Rice', subtitle: 'Iron powerhouse', tags: ['High Iron'], icon: Sun },
      { type: 'snack', title: 'Jaggery Tea (No Milk)', subtitle: 'Iron boost', tags: ['Warmth'], icon: Coffee },
      { type: 'dinner', title: 'Pumpkin Sabzi + Roti', subtitle: 'Vitamin A', tags: ['Vision'], icon: Moon }
    ]
  },
  {
    day: 'Sunday',
    localDay: 'Ravivaar',
    meals: [
      { type: 'breakfast', title: 'Aloo Paratha with Curd', subtitle: 'Weekend treat', tags: ['Energy'], icon: Sunrise },
      { type: 'lunch', title: 'Special Thali (Dal, Rice, Sabzi, Salad)', subtitle: 'Balanced meal', tags: ['Complete'], icon: Sun },
      { type: 'snack', title: 'Fruit Chat', subtitle: 'Seasonal fruits', tags: ['Vitamins'], icon: Coffee },
      { type: 'dinner', title: 'Turmeric Milk + Khichdi', subtitle: 'Healing & Restful', tags: ['Immunity'], icon: Moon }
    ]
  }
];

export const SUPERFOODS = [
  {
    id: 'jaggery',
    name: 'Jaggery (Gud)',
    desc: 'Natural Iron Source',
    image: '🍯',
    color: 'bg-amber-900/10 text-amber-700 dark:text-amber-400'
  },
  {
    id: 'spinach',
    name: 'Spinach (Palak)',
    desc: 'Vitamin Rich',
    image: '🥬',
    color: 'bg-green-900/10 text-green-700 dark:text-green-400'
  },
  {
    id: 'citrus',
    name: 'Lemon/Amla',
    desc: 'Boosts Absorption',
    image: '🍋',
    color: 'bg-yellow-900/10 text-yellow-700 dark:text-yellow-400'
  }
];
