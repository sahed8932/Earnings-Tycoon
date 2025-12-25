
import React, { useState, useEffect, useCallback } from 'react';
import { UserStats, Task, InventoryItem, PaymentMethod } from './types';
import { INITIAL_STATS, SHOP_ITEMS, MIN_WITHDRAWAL, REFERRAL_BONUS, DAILY_TASK_LIMIT } from './constants';
import { generateTasks, verifyTaskAnswer } from './services/geminiService';

const App: React.FC = () => {
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'dashboard' | 'shop' | 'tasks' | 'withdraw' | 'referral'>('dashboard');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [answerInput, setAnswerInput] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawAccount, setWithdrawAccount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);

  const fetchTasks = useCallback(async () => {
    if (stats.dailyTasksDone >= DAILY_TASK_LIMIT) {
        showMsg(`আপনি আজকের লিমিট (${DAILY_TASK_LIMIT}) শেষ করেছেন!`, 'info');
        return;
    }
    setLoading(true);
    const newTasks = await generateTasks(stats.level);
    setTasks(newTasks);
    setLoading(false);
  }, [stats.level, stats.dailyTasksDone]);

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setStats(prev => ({
        ...prev,
        energy: Math.min(prev.maxEnergy, prev.energy + 1)
      }));
    }, 15000); 
    return () => clearInterval(timer);
  }, []);

  const showMsg = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleTaskSubmit = async () => {
    if (!activeTask) return;
    if (stats.energy < activeTask.energyCost) {
      showMsg('আপনার যথেষ্ট এনার্জি নেই!', 'error');
      return;
    }

    setLoading(true);
    const isCorrect = await verifyTaskAnswer(activeTask, answerInput);
    setLoading(false);

    if (isCorrect) {
      const xpGained = activeTask.reward / 2;
      setStats(prev => {
        let newExp = prev.experience + xpGained;
        let newLevel = prev.level;
        let newNextLevelExp = prev.nextLevelExp;
        
        if (newExp >= newNextLevelExp) {
          newLevel += 1;
          newExp = newExp - newNextLevelExp;
          newNextLevelExp = Math.floor(newNextLevelExp * 1.5);
          showMsg(`অভিনন্দন! আপনি লেভেল ${newLevel}-এ উন্নীত হয়েছেন!`, 'success');
        }

        return {
          ...prev,
          balance: prev.balance + activeTask.reward,
          energy: prev.energy - activeTask.energyCost,
          experience: newExp,
          level: newLevel,
          nextLevelExp: newNextLevelExp,
          dailyTasksDone: prev.dailyTasksDone + 1
        };
      });
      showMsg(`সফল! ৳${activeTask.reward} এবং ${xpGained} XP অর্জন করেছেন।`, 'success');
      setActiveTask(null);
      setAnswerInput('');
      setTasks(prev => prev.filter(t => t.id !== activeTask.id));
    } else {
      showMsg('উওরটি সঠিক হয়নি। আবার চেষ্টা করুন।', 'error');
      setStats(prev => ({ ...prev, energy: prev.energy - 5 }));
    }
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < MIN_WITHDRAWAL) {
      showMsg(`সর্বনিম্ন উইথড্র ৳${MIN_WITHDRAWAL} টাকা।`, 'error');
      return;
    }
    if (amount > stats.balance) {
      showMsg('আপনার ব্যালেন্স যথেষ্ট নয়!', 'error');
      return;
    }
    if (!withdrawAccount.trim()) {
      showMsg('অ্যাকাউন্ট নম্বর প্রদান করুন।', 'error');
      return;
    }

    setStats(prev => ({ ...prev, balance: prev.balance - amount }));
    showMsg('উইথড্র রিকোয়েস্ট পাঠানো হয়েছে। ২৪ ঘণ্টার মধ্যে পেমেন্ট পাবেন।', 'success');
    setWithdrawAmount('');
    setWithdrawAccount('');
  };

  const buyItem = (item: InventoryItem) => {
    if (stats.balance < item.price) {
      showMsg('আপনার যথেষ্ট টাকা নেই!', 'error');
      return;
    }
    setStats(prev => ({
      ...prev,
      balance: prev.balance - item.price,
      energy: item.boostType === 'Energy' ? Math.min(prev.maxEnergy, prev.energy + item.boostValue) : prev.energy,
    }));
    showMsg(`${item.name} কেনা হয়েছে!`, 'success');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0f172a] text-slate-100 font-['Hind_Siliguri']">
      
      {/* Sidebar Navigation */}
      <nav className="w-full md:w-64 glass-morphism p-6 flex flex-col space-y-6 border-r border-slate-800">
        <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
          <i className="fa-solid fa-gem mr-2"></i> Tycoon Pro
        </div>
        
        <div className="space-y-2">
          {[
            { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: 'fa-house' },
            { id: 'tasks', label: 'টাস্ক লিস্ট', icon: 'fa-list-check' },
            { id: 'shop', label: 'মার্কেটপ্লেস', icon: 'fa-shop' },
            { id: 'referral', label: 'রেফার করুন', icon: 'fa-users' },
            { id: 'withdraw', label: 'টাকা তুলুন', icon: 'fa-wallet' }
          ].map(nav => (
            <button 
              key={nav.id}
              onClick={() => setView(nav.id as any)}
              className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${view === nav.id ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800'}`}
            >
              <i className={`fa-solid ${nav.icon}`}></i>
              <span>{nav.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto glass-morphism p-4 rounded-xl text-center">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">আপনার রেফার কোড</div>
            <div className="bg-slate-900 p-2 rounded-lg font-mono text-blue-400 select-all">{stats.referralCode}</div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-y-auto">
        
        {/* Header Stats */}
        <header className="flex flex-wrap items-center justify-between gap-4 mb-8 sticky top-0 z-10 bg-[#0f172a]/80 backdrop-blur pb-4">
          <div className="flex items-center space-x-8">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400">মোট আয়</span>
              <div className="text-2xl font-bold text-yellow-400 flex items-center">
                <span className="text-sm mr-1">৳</span> {stats.balance.toFixed(2)}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-400">আজকের টাস্ক</span>
              <div className="text-lg font-bold text-blue-400">{stats.dailyTasksDone} / {DAILY_TASK_LIMIT}</div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-400">এনার্জি</span>
              <div className="w-32 h-3 bg-slate-700 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-cyan-400 transition-all duration-500" style={{ width: `${(stats.energy / stats.maxEnergy) * 100}%` }}></div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 bg-slate-800/50 p-2 px-4 rounded-full border border-slate-700">
            <span className="bg-blue-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">LVL {stats.level}</span>
            <div className="text-sm font-bold">{Math.round((stats.experience/stats.nextLevelExp)*100)}%</div>
          </div>
        </header>

        {message && (
          <div className="fixed bottom-8 right-8 z-50 p-4 rounded-xl shadow-2xl animate-fadeIn bg-slate-800 border-l-4 border-blue-500">
            {message.text}
          </div>
        )}

        {/* View Content */}
        {view === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-800 shadow-xl relative overflow-hidden group">
                    <i className="fa-solid fa-coins absolute -right-4 -bottom-4 text-8xl opacity-10 group-hover:scale-110 transition-transform"></i>
                    <h2 className="text-2xl font-bold mb-2">প্রতিদিনের ইনকাম শুরু করুন</h2>
                    <p className="text-blue-100 mb-6 opacity-80">আজ ৫টি টাস্ক কমপ্লিট করে ৳২৫০ পর্যন্ত ইনকাম করুন।</p>
                    <button onClick={() => setView('tasks')} className="bg-white text-blue-700 px-8 py-3 rounded-2xl font-bold hover:shadow-xl transition-all">কাজ শুরু করুন</button>
                </div>
                <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-800 shadow-xl relative overflow-hidden group">
                    <i className="fa-solid fa-users-plus absolute -right-4 -bottom-4 text-8xl opacity-10 group-hover:scale-110 transition-transform"></i>
                    <h2 className="text-2xl font-bold mb-2">বন্ধুদের ইনভাইট করুন</h2>
                    <p className="text-emerald-100 mb-6 opacity-80">প্রতিটি সফল রেফারে পাবেন ৳{REFERRAL_BONUS} টাকা বোনাস!</p>
                    <button onClick={() => setView('referral')} className="bg-white text-emerald-700 px-8 py-3 rounded-2xl font-bold hover:shadow-xl transition-all">রেফার করুন</button>
                </div>
            </div>
            
            <div className="glass-morphism p-8 rounded-3xl">
                <h3 className="text-xl font-bold mb-6">উইথড্রয়াল নোটিস</h3>
                <div className="flex items-center space-x-4 text-sm text-slate-300">
                    <div className="bg-yellow-500/20 p-3 rounded-xl text-yellow-400">
                        <i className="fa-solid fa-circle-info"></i>
                    </div>
                    <p>পেমেন্ট সাধারণত ২৪-৪৮ ঘণ্টার মধ্যে সম্পন্ন হয়। সঠিক বিকাশ/নগদ নম্বর প্রদান করুন। উইথড্রর সময় অবশ্যই আপনার ব্যালেন্সে সর্বনিম্ন ৳{MIN_WITHDRAWAL} টাকা থাকতে হবে।</p>
                </div>
            </div>
          </div>
        )}

        {view === 'tasks' && (
          <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold">এভেইলেবল টাস্ক</h2>
                <div className="text-sm bg-slate-800 p-2 px-4 rounded-xl">লিমিট: {stats.dailyTasksDone}/{DAILY_TASK_LIMIT}</div>
            </div>
            {stats.dailyTasksDone >= DAILY_TASK_LIMIT ? (
                <div className="text-center py-20 glass-morphism rounded-3xl">
                    <i className="fa-solid fa-clock text-6xl text-blue-500 mb-4"></i>
                    <h2 className="text-2xl font-bold">আজকের লিমিট শেষ!</h2>
                    <p className="text-slate-400 mt-2">আগামীকাল আবার নতুন টাস্ক পাবেন।</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasks.map(task => (
                        <div key={task.id} className="glass-morphism p-6 rounded-3xl border border-slate-700/50 hover:border-blue-500/50 transition-all">
                            <h3 className="text-lg font-bold mb-2">{task.title}</h3>
                            <p className="text-sm text-slate-400 mb-6 line-clamp-2">{task.description}</p>
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-yellow-400 font-bold">৳ {task.reward}</span>
                                <span className="text-cyan-400 text-sm"><i className="fa-solid fa-bolt mr-1"></i>{task.energyCost}</span>
                            </div>
                            <button onClick={() => setActiveTask(task)} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-2xl font-bold">কাজটি করুন</button>
                        </div>
                    ))}
                </div>
            )}
          </div>
        )}

        {view === 'referral' && (
            <div className="max-w-2xl mx-auto animate-fadeIn">
                <div className="glass-morphism p-10 rounded-3xl text-center">
                    <i className="fa-solid fa-users text-6xl text-blue-500 mb-6"></i>
                    <h2 className="text-3xl font-bold mb-4">বন্ধুকে ইনভাইট করে আয় করুন</h2>
                    <p className="text-slate-400 mb-8">আপনার ফ্রেন্ড যখন আপনার রেফার কোড ব্যবহার করে প্রথম টাস্ক কমপ্লিট করবে, আপনারা দুজনেই পাবেন ৳{REFERRAL_BONUS} বোনাস!</p>
                    
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-700 mb-8">
                        <div className="text-xs text-slate-500 uppercase mb-2">আপনার রেফার কোড</div>
                        <div className="text-4xl font-mono font-bold text-blue-400 mb-4">{stats.referralCode}</div>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(stats.referralCode);
                                showMsg('কোড কপি করা হয়েছে!', 'success');
                            }}
                            className="text-blue-500 hover:underline flex items-center justify-center mx-auto space-x-2"
                        >
                            <i className="fa-solid fa-copy"></i>
                            <span>কোড কপি করুন</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800 p-4 rounded-2xl">
                            <div className="text-2xl font-bold">{stats.referralsCount}</div>
                            <div className="text-xs text-slate-400">মোট রেফারেল</div>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-2xl">
                            <div className="text-2xl font-bold">৳ {stats.referralsCount * REFERRAL_BONUS}</div>
                            <div className="text-xs text-slate-400">রেফারেল বোনাস</div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {view === 'withdraw' && (
            <div className="max-w-xl mx-auto animate-fadeIn">
                <div className="glass-morphism p-8 rounded-3xl">
                    <h2 className="text-2xl font-bold mb-8">টাকা উত্তোলন (Withdraw)</h2>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm text-slate-400 mb-3">পেমেন্ট মেথড সিলেক্ট করুন</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'bkash', name: 'বিকাশ', icon: 'fa-mobile-screen' },
                                    { id: 'nagad', name: 'নগদ', icon: 'fa-mobile-screen-button' },
                                    { id: 'binance', name: 'Binance', icon: 'fa-bitcoin-sign' },
                                    { id: 'ton', name: 'TON Wallet', icon: 'fa-coins' }
                                ].map(m => (
                                    <button 
                                        key={m.id}
                                        onClick={() => setPaymentMethod(m.id as any)}
                                        className={`flex items-center space-x-3 p-4 rounded-2xl border transition-all ${paymentMethod === m.id ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}
                                    >
                                        <i className={`fa-solid ${m.icon}`}></i>
                                        <span className="font-bold">{m.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-2">পরিমাণ (মিনিমাম ৳{MIN_WITHDRAWAL})</label>
                            <input 
                                type="number" 
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                placeholder="৳ ০.০০"
                                className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-2">অ্যাকাউন্ট নম্বর / এড্রেস</label>
                            <input 
                                type="text" 
                                value={withdrawAccount}
                                onChange={(e) => setWithdrawAccount(e.target.value)}
                                placeholder="নম্বর বা ওয়ালেট এড্রেস দিন"
                                className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <button 
                            onClick={handleWithdraw}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-4 rounded-2xl font-bold shadow-xl hover:scale-[1.02] transition-transform"
                        >
                            উইথড্র রিকোয়েস্ট দিন
                        </button>
                    </div>
                </div>
            </div>
        )}

        {view === 'shop' && (
          <div className="animate-fadeIn">
            <h2 className="text-3xl font-bold mb-8">মার্কেটপ্লেস</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SHOP_ITEMS.map(item => (
                <div key={item.id} className="glass-morphism p-6 rounded-3xl border border-slate-700/50 hover:border-yellow-500/30 transition-all group">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-3xl text-yellow-400 mb-6 group-hover:scale-110 transition-transform">
                    <i className={`fa-solid ${item.icon}`}></i>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                  <p className="text-sm text-slate-400 mb-6">{item.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-xl font-bold text-yellow-400">৳ {item.price}</div>
                    <button onClick={() => buyItem(item)} className="bg-slate-700 hover:bg-yellow-600 hover:text-white px-6 py-2 rounded-xl transition-all font-bold">কিনুন</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Task Modal */}
      {activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="glass-morphism max-w-lg w-full p-8 rounded-3xl relative">
            <button onClick={() => setActiveTask(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white"><i className="fa-solid fa-xmark text-2xl"></i></button>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">{activeTask.title}</h3>
              <div className="flex justify-center space-x-4 text-sm font-bold">
                 <span className="text-yellow-400">৳ {activeTask.reward}</span>
                 <span className="text-cyan-400">{activeTask.energyCost} এনার্জি</span>
              </div>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-2xl mb-6 border border-slate-700 text-center italic text-lg">{activeTask.description}</div>
            <input 
                type="text" 
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                placeholder="উত্তর এখানে লিখুন..."
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 mb-4 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
                disabled={loading || !answerInput.trim()}
                onClick={handleTaskSubmit}
                className="w-full bg-blue-600 py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center space-x-2"
            >
                {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <span>সাবমিট করুন</span>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
