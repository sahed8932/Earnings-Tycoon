
import { InventoryItem, UserStats } from './types';

export const MIN_WITHDRAWAL = 128;
export const REFERRAL_BONUS = 25; // 25 BDT per successful referral
export const DAILY_TASK_LIMIT = 5;

export const SHOP_ITEMS: InventoryItem[] = [
  {
    id: 'energy-drink',
    name: 'এনার্জি ড্রিংক',
    description: 'তাত্ক্ষণিকভাবে ৫০ এনার্জি রিফিল করে।',
    price: 100,
    boostType: 'Energy',
    boostValue: 50,
    icon: 'fa-bolt'
  },
  {
    id: 'brain-booster',
    name: 'ব্রেইন বুস্টার',
    description: 'প্রতিটি টাস্কে ২০% বেশি টাকা এবং এক্সপি দেয়।',
    price: 500,
    boostType: 'Earning',
    boostValue: 1.2,
    icon: 'fa-brain'
  },
  {
    id: 'super-cpu',
    name: 'সুপার সিপিইউ',
    description: 'কঠিন টাস্কগুলো সহজ করে দেয়।',
    price: 2000,
    boostType: 'XP',
    boostValue: 2.0,
    icon: 'fa-microchip'
  }
];

export const INITIAL_STATS: UserStats = {
  balance: 200,
  energy: 100,
  maxEnergy: 100,
  level: 1,
  experience: 0,
  nextLevelExp: 1000,
  referralCode: 'TYCOON' + Math.floor(1000 + Math.random() * 9000),
  referralsCount: 0,
  dailyTasksDone: 0
};
