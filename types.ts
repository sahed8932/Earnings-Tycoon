
export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  energyCost: number;
  difficulty: 'সহজ' | 'মাঝারি' | 'কঠিন';
  type: 'Riddle' | 'Coding' | 'Creative';
  answer?: string;
}

export interface UserStats {
  balance: number;
  energy: number;
  maxEnergy: number;
  level: number;
  experience: number;
  nextLevelExp: number;
  referralCode: string;
  referralsCount: number;
  dailyTasksDone: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  price: number;
  boostType: 'Energy' | 'Earning' | 'XP';
  boostValue: number;
  icon: string;
}

export type PaymentMethod = 'bkash' | 'nagad' | 'binance' | 'ton';

export interface WithdrawalRequest {
  amount: number;
  method: PaymentMethod;
  accountNumber: string;
  status: 'pending' | 'completed' | 'rejected';
}
