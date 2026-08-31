'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Wallet, TrendingDown, LogOut, Moon, Sun, Languages, Mic, Sparkles, Target, Trophy, Trash2, RotateCcw, Send, Plus, Calendar, FolderArchive, Menu, X } from 'lucide-react';

const translations = {
  en: {
    title: "Budget Coach AI",
    subtitle: "Sign in to manage your everyday spending",
    emailLbl: "Email",
    passLbl: "Password",
    signInBtn: "Sign In",
    signUpBtn: "Sign Up",
    signOutBtn: "Sign Out",
    totalSpent: "Total Spent",
    budgetLimit: "Monthly Budget Limit",
    remainingBudget: "Remaining Budget",
    aiStatus: "AI Financial Status",
    onTrack: "On Track 🟢",
    recentTitle: "Recent Transactions",
    noTrans: "No transactions added for this month.",
    tblCat: "Category",
    tblDesc: "Description",
    tblAmt: "Amount",
    tblAction: "Action",
    goalsTitle: "Financial Goals",
    addFunds: "Add Funds",
    amountToAdd: "Amount to add (EGP)",
    saveFunds: "Save Funds",
    cancel: "Cancel",
    clearChat: "Clear Chat",
    delete: "Delete",
    newMonthBtn: "Start New Month",
    archiveTitle: "Monthly Archive",
    currentMonth: "Current Month",
    aiWelcome: "Hello! I am your AI financial coach. Tell me your expenses or goals (by typing or voice) and I will manage them for you!",
    aiCleared: "Hello! Chat cleared. How can I help you today?",
    insightsTitle: "AI Financial Insights",
    close: "Close"
  },
  ar: {
    title: "المساعد المالي الذكي",
    subtitle: "سجل الدخول لإدارة نفقاتك اليومية",
    emailLbl: "البريد الإلكتروني",
    passLbl: "كلمة المرور",
    signInBtn: "تسجيل الدخول",
    signUpBtn: "إنشاء حساب",
    signOutBtn: "تسجيل الخروج",
    totalSpent: "إجمالي المصروفات",
    budgetLimit: "ميزانية الشهر",
    remainingBudget: "المتبقي من الميزانية",
    aiStatus: "الوضع المالي الذكي",
    onTrack: "في المسار الصحيح 🟢",
    recentTitle: "أحدث المعاملات",
    noTrans: "لا توجد معاملات مسجلة في هذا الشهر.",
    tblCat: "الفئة",
    tblDesc: "الوصف",
    tblAmt: "المبلغ",
    tblAction: "إجراء",
    goalsTitle: "الأهداف المالية",
    addFunds: "إضافة رصيد",
    amountToAdd: "المبلغ المضاف (جنيه)",
    saveFunds: "حفظ الرصيد",
    cancel: "إلغاء",
    clearChat: "مسح المحادثة",
    delete: "حذف",
    newMonthBtn: "بدء شهر جديد",
    archiveTitle: "أرشيف الشهور",
    currentMonth: "الشهر الحالي",
    aiWelcome: "أهلاً بك! أنا مساعدك المالي الذكي. أخبرني بمصروفاتك أو أهدافك (كتابة أو بالصوت) وسأقوم بتسجيلها لك أوتوماتيكياً!",
    aiCleared: "أهلاً بك! تم مسح المحادثة. كيف يمكنني مساعدتك اليوم؟",
    insightsTitle: "التحليل المالي الذكي",
    close: "إغلاق"
  }
};

const getCurrentMonthKey = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const formatMoney = (amount: number) => {
  if (isNaN(amount)) return '0';
  return Number(amount.toFixed(2)).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  
  const currentKey = getCurrentMonthKey();
  const [selectedMonth, setSelectedMonth] = useState<string>(currentKey);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [activeGoal, setActiveGoal] = useState<any>(null);
  const [fundAmount, setFundAmount] = useState('');

  const [showInsightModal, setShowInsightModal] = useState(false);
  const [insightText, setInsightText] = useState('');
  const [isInsightLoading, setIsInsightLoading] = useState(false);

  const [budgetLimit, setBudgetLimit] = useState(10000);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const t = translations[lang];

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: 'ai', text: t.aiWelcome }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const chatBottomRef = useRef<any>(null);

  const getCategoryName = (cat: string) => {
    const categoryMap: Record<string, { en: string, ar: string }> = {
      'Food': { en: 'Food & Drinks', ar: 'طعام ومشروبات' },
      'Rent': { en: 'Rent & Housing', ar: 'إيجار وسكن' },
      'Utilities': { en: 'Utilities', ar: 'فواتير وخدمات' },
      'Entertainment': { en: 'Entertainment', ar: 'ترفيه' },
      'Shopping': { en: 'Shopping', ar: 'تسوق' },
      'Savings': { en: 'Goal Savings', ar: 'تحويش أهداف' },
    };
    return categoryMap[cat] ? categoryMap[cat][lang] : cat;
  };

  useEffect(() => {
    setChatMessages((prev) => {
      if (prev.length === 1 && (prev[0].text === translations.en.aiWelcome || prev[0].text === translations.ar.aiWelcome)) {
        return [{ sender: 'ai', text: translations[lang].aiWelcome }];
      }
      return prev;
    });
  }, [lang]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAllTransactions(session.user.id);
        fetchGoals(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAllTransactions(session.user.id);
        fetchGoals(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAllTransactions = async (userId: string) => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      setTransactions(data);
      const months = Array.from(new Set(data.map(tx => tx.month_year || currentKey)));
      if (!months.includes(currentKey)) months.unshift(currentKey);
      setAvailableMonths(months.sort().reverse());
    }
  };

  const fetchGoals = async (userId: string) => {
    const { data } = await supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: true });
    if (data) setGoals(data);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setMessage(error.message);
    else setMessage(lang === 'en' ? 'Account created!' : 'تم إنشاء الحساب!');
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setTransactions([]);
    setGoals([]);
  };

  const filteredTransactions = transactions.filter(tx => (tx.month_year || currentKey) === selectedMonth);
  const transactionsSpent = filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const goalsSavedTotal = goals.reduce((acc, curr) => acc + (curr.saved_amount || 0), 0);
  const totalSpent = transactionsSpent + (selectedMonth === currentKey ? goalsSavedTotal : 0);
  const remainingBudget = budgetLimit - totalSpent;

  const handleStartNewMonth = () => {
    setSelectedMonth(currentKey);
    alert(lang === 'ar' ? '✨ أنت الآن في الشهر الجديد وجاهز لتسجيل مصروفاتك!' : 'You are now viewing the new month!');
  };

  const updateGoalFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGoal || !fundAmount || !user) return;

    const addedValue = parseFloat(fundAmount) || 0;
    const newTotalSaved = Number(activeGoal.saved_amount || 0) + addedValue;

    const { error: goalError } = await supabase
      .from('goals')
      .update({ saved_amount: newTotalSaved })
      .eq('id', activeGoal.id);

    if (goalError) {
      alert(goalError.message);
      return;
    }

    await supabase
      .from('transactions')
      .insert([
        {
          user_id: user.id,
          amount: addedValue,
          category: 'Savings',
          description: lang === 'ar' ? `تحويش لهدف: ${activeGoal.goal_name}` : `Savings for goal: ${activeGoal.goal_name}`,
          type: 'expense',
          month_year: currentKey
        }
      ]);

    setShowAddFundsModal(false);
    setFundAmount('');
    setActiveGoal(null);
    fetchGoals(user.id);
    fetchAllTransactions(user.id);
    setSelectedMonth(currentKey);
  };

  // دالة حذف المعاملات أو الأهداف مباشرة
  const handleDeleteItem = async (id: string, type: 'transaction' | 'goal') => {
    const confirmMsg = lang === 'ar' ? 'هل أنت متأكد من رغبتك في الحذف؟' : 'Are you sure you want to delete this item?';
    if (!window.confirm(confirmMsg)) return;

    if (type === 'transaction') {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (!error && user) fetchAllTransactions(user.id);
      else if (error) alert(error.message);
    } else if (type === 'goal') {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (!error && user) fetchGoals(user.id);
      else if (error) alert(error.message);
    }
  };

  const clearChatMessages = () => {
    setChatMessages([{ sender: 'ai', text: t.aiCleared }]);
  };

  const handleGetInsights = async () => {
    if (!user) return;
    setShowInsightModal(true);
    setIsInsightLoading(true);
    setInsightText('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: lang === 'ar' ? `أريد تقريراً تحليلياً لشهر ${selectedMonth}.` : `Give me analytical report for month ${selectedMonth}.`,
          userId: user.id,
          budgetLimit,
          totalSpent,
          transactionHistory: filteredTransactions,
          goals,
          lang
        })
      });

      const data = await res.json();
      if (data.success) {
        setInsightText(data.reply);
      } else {
        setInsightText(lang === 'ar' ? 'عذراً، تعذر جلب التحليل.' : 'Could not fetch insights.');
      }
    } catch (err) {
      setInsightText(lang === 'ar' ? 'خطأ في الاتصال.' : 'Connection error.');
    } finally {
      setIsInsightLoading(false);
    }
  };

  const handleBrowserVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(lang === 'ar' ? 'متصفحك لا يدعم الإدخال الصوتي' : 'Speech recognition is not supported in this browser.');
      return;
    }
    if (isRecording) { setIsRecording(false); return; }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'ar' ? 'ar-EG' : 'en-US';
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInputMessage(transcript);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  const sendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !user) return;

    const userText = inputMessage;
    setInputMessage('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setIsChatLoading(true);
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          userId: user.id,
          budgetLimit,
          totalSpent,
          transactionHistory: filteredTransactions,
          goals,
          lang
        })
      });

      const data = await res.json();
      console.log('Chat API response:', data);
      if (data.success && data.reply) {
        setChatMessages((prev) => [...prev, { sender: 'ai', text: data.reply }]);
      }
      else {
        setChatMessages((prev) => [...prev,
          {
            sender: 'ai',
            text: data.error || 'No response received from AI'
          }
        ]);}
    } catch (err) {
      setChatMessages((prev) => [...prev, { sender: 'ai', text: 'Error' }]);
    } finally {
      setIsChatLoading(false);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      fetchAllTransactions(user.id);
      fetchGoals(user.id);
    }
  };

  const formatAIResponse = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">$1</strong>')
      .replace(/\n/g, '<br class="my-1" />');
  };

  if (!user) {
    return (
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className={`p-8 rounded-2xl shadow-lg max-w-md w-full ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}`}>
          <div className="flex justify-between mb-4">
            <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="flex items-center gap-2 p-2 rounded-lg font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950"><Languages className="w-5 h-5" /> {lang === 'en' ? 'عربي' : 'EN'}</button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
          </div>
          <h1 className="text-3xl font-bold text-center text-emerald-600 mb-2">{t.title}</h1>
          <p className={`text-center mb-8 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.subtitle}</p>
          <form className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t.emailLbl}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-black'}`} required />
            </div>
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t.passLbl}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={`mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-black'}`} required />
            </div>
            {message && <p className="text-sm text-center text-emerald-600 font-medium bg-emerald-50 p-2 rounded">{message}</p>}
            <div className="flex gap-4 pt-4">
              <button onClick={handleSignIn} disabled={loading} className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors">{t.signInBtn}</button>
              <button onClick={handleSignUp} disabled={loading} className={`w-full py-2 border border-emerald-600 rounded-lg font-medium transition-colors ${isDarkMode ? 'text-emerald-400 hover:bg-slate-700' : 'text-emerald-600 hover:bg-emerald-50'}`}>{t.signUpBtn}</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`min-h-screen transition-colors duration-300 flex ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Sidebar Archive */}
      <aside className={`fixed lg:static inset-y-0 z-40 w-72 p-6 flex flex-col justify-between transition-all duration-300 transform ${
        isSidebarOpen ? 'translate-x-0 border-r' : lang === 'ar' ? 'translate-x-full lg:translate-x-0 lg:w-0 lg:p-0 lg:overflow-hidden lg:border-none' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:p-0 lg:overflow-hidden lg:border-none'
      } ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Wallet className="w-7 h-7 text-emerald-600" />
              <h2 className="font-bold text-base">{t.title}</h2>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-2">
              <FolderArchive className="w-4 h-4" />
              <span>{t.archiveTitle}</span>
            </div>
            
            {availableMonths.map((monthKey) => (
              <button
                key={monthKey}
                onClick={() => setSelectedMonth(monthKey)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  selectedMonth === monthKey
                    ? 'bg-emerald-600 text-white shadow-md'
                    : isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-emerald-50 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 opacity-80" />
                  <span>{monthKey === currentKey ? `${t.currentMonth} (${monthKey})` : monthKey}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <button 
            onClick={handleStartNewMonth}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.newMonthBtn}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        
        {/* Header */}
        <header className={`border-b px-8 py-4 flex justify-between items-center shadow-xs transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              title="Toggle Archive Sidebar"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-200/50 dark:border-emerald-900">
              📅 {selectedMonth === currentKey ? t.currentMonth : `${t.archiveTitle}: ${selectedMonth}`}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className={`text-sm font-medium hidden md:block ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{user.email}</span>
            <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="flex items-center gap-2 p-2 rounded-lg font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"><Languages className="w-5 h-5" /> {lang === 'en' ? 'عربي' : 'EN'}</button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
            <button onClick={handleSignOut} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}><LogOut className="w-4 h-4" /> <span className="hidden md:inline">{t.signOutBtn}</span></button>
          </div>
        </header>

        <main className="max-w-7xl w-full mx-auto px-8 py-8 space-y-8">
          
          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className={`p-6 rounded-2xl shadow-sm border flex items-center justify-between ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.totalSpent}</p>
                <h3 className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatMoney(totalSpent)} EGP</h3>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"><TrendingDown className="w-6 h-6" /></div>
            </div>
            
            <div className={`p-6 rounded-2xl shadow-sm border flex items-center justify-between ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.budgetLimit}</p>
                {isEditingBudget ? (
                  <input type="number" value={budgetLimit} onChange={(e) => setBudgetLimit(Number(e.target.value))} onBlur={() => setIsEditingBudget(false)} autoFocus className={`w-full text-2xl font-bold bg-transparent border-b-2 border-emerald-500 outline-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`} />
                ) : (
                  <h3 className={`text-2xl font-bold mt-1 cursor-pointer hover:text-emerald-500 ${isDarkMode ? 'text-white' : 'text-slate-900'}`} onClick={() => setIsEditingBudget(true)}>{formatMoney(budgetLimit)} EGP</h3>
                )}
              </div>
              <div className="p-3 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"><Wallet className="w-6 h-6" /></div>
            </div>

            <div className={`p-6 rounded-2xl shadow-sm border flex items-center justify-between ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.remainingBudget}</p>
                <h3 className={`text-2xl font-bold mt-1 ${remainingBudget < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{formatMoney(remainingBudget)} EGP</h3>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"><Wallet className="w-6 h-6" /></div>
            </div>

            <div className={`p-6 rounded-2xl shadow-sm border flex items-center justify-between ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.aiStatus}</p>
                <h3 className="text-base font-bold text-emerald-500 mt-2">{totalSpent > budgetLimit ? 'Over Budget 🔴' : t.onTrack}</h3>
              </div>
              <button onClick={handleGetInsights} className="p-3 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-950 dark:text-purple-400 transition-all cursor-pointer"><Sparkles className="w-6 h-6" /></button>
            </div>
          </div>

          {/* Goals & Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className={`lg:col-span-1 p-6 rounded-2xl shadow-sm border h-fit ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-6">
                <Target className="w-6 h-6 text-indigo-500" />
                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.goalsTitle}</h3>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {goals.length === 0 ? (
                  <p className={`text-sm text-center py-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No goals added yet.</p>
                ) : (
                  goals.map(goal => {
                    const progress = Math.min((goal.saved_amount / goal.target_amount) * 100, 100);
                    return (
                      <div key={goal.id} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className={`font-semibold text-sm flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}><Trophy className="w-4 h-4 text-yellow-500"/> {goal.goal_name}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{progress.toFixed(0)}%</span>
                            {selectedMonth === currentKey && (
                              <button onClick={() => { setActiveGoal(goal); setShowAddFundsModal(true); }} className="text-indigo-600 dark:text-indigo-400 p-1 bg-indigo-50 dark:bg-indigo-950 rounded-md hover:bg-indigo-100"><Plus className="w-4 h-4" /></button>
                            )}
                            {/* زرار حذف الهدف يعمل الآن بفاعلية */}
                            <button onClick={() => handleDeleteItem(goal.id, 'goal')} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5 mb-2 overflow-hidden">
                          <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                        <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{formatMoney(goal.saved_amount)} EGP / {formatMoney(goal.target_amount)} EGP</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className={`lg:col-span-2 p-6 rounded-2xl shadow-sm border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h3 className={`text-lg font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.recentTitle} ({selectedMonth})</h3>
              {filteredTransactions.length === 0 ? (
                <p className={`text-sm py-12 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.noTrans}</p>
              ) : (
                <div className="overflow-x-auto max-h-[500px]">
                  <table className={`min-w-full divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-200'}`}>
                    <thead>
                      <tr>
                        <th className={`px-4 py-3 text-start text-xs font-medium uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.tblCat}</th>
                        <th className={`px-4 py-3 text-start text-xs font-medium uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.tblDesc}</th>
                        <th className={`px-4 py-3 text-end text-xs font-medium uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.tblAmt}</th>
                        <th className={`px-4 py-3 text-end text-xs font-medium uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.tblAction}</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-200'}`}>
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className={`px-4 py-3 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>{getCategoryName(tx.category)}</td>
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{tx.description || '—'}</td>
                          <td className="px-4 py-3 text-sm text-end font-semibold text-emerald-500">{formatMoney(tx.amount)} EGP</td>
                          <td className="px-4 py-3 text-sm text-end">
                            {/* زرار حذف المعاملة يعمل الآن بفاعلية */}
                            <button onClick={() => handleDeleteItem(tx.id, 'transaction')} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4 inline" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modals & Chat Widget */}
      {showAddFundsModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className={`p-6 rounded-2xl max-w-sm w-full ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <h3 className="text-lg font-bold mb-4">{t.addFunds} - {activeGoal?.goal_name}</h3>
            <form onSubmit={updateGoalFunds} className="space-y-4">
              <input type="number" step="0.01" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} required autoFocus className={`w-full px-3 py-2 border rounded-lg ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'}`} placeholder="1000" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAddFundsModal(false)} className={`w-full py-2 rounded-lg ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-800'}`}>{t.cancel}</button>
                <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-lg">{t.saveFunds}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة التحليل الذكي */}
      {showInsightModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className={`p-6 rounded-3xl max-w-lg w-full flex flex-col max-h-[85vh] ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}`}>
            <div className="flex justify-between items-center mb-4 border-b pb-3 border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold flex items-center gap-2"><Sparkles className="text-purple-500" /> {t.insightsTitle} ({selectedMonth})</h3>
              <button onClick={() => setShowInsightModal(false)} className="font-bold">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto text-sm leading-relaxed space-y-3">
              {isInsightLoading ? <p className="text-center py-12">🤖 جاري التحليل...</p> : <div dangerouslySetInnerHTML={{ __html: formatAIResponse(insightText) }} />}
            </div>
            <button onClick={() => setShowInsightModal(false)} className="w-full mt-4 py-2.5 bg-purple-600 text-white rounded-xl font-semibold">{t.close}</button>
          </div>
        </div>
      )}

      {/* Floating AI Chatbot Widget */}
      <div className={`fixed bottom-6 z-50 transition-all duration-300 ${
        lang === 'ar' 
          ? (isSidebarOpen ? 'left-6 sm:left-80' : 'left-6') 
          : (isSidebarOpen ? 'right-6 sm:right-80' : 'right-6')
      }`}>
        {!isChatOpen ? (
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-full shadow-2xl transition-all hover:scale-105 font-bold"
          >
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span>{lang === 'ar' ? 'المستشار المالي الذكي' : 'AI Financial Coach'}</span>
          </button>
        ) : (
          <div className={`w-[90vw] sm:w-[420px] h-[600px] rounded-3xl shadow-2xl border flex flex-col overflow-hidden transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
            
            <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl"><Sparkles className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-bold text-base">Budget Coach AI</h3>
                  <p className="text-xs text-emerald-100">Online & Ready</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={clearChatMessages} className="p-2 rounded-full bg-black/20 hover:bg-black/45 transition-colors" title={t.clearChat}><RotateCcw className="w-4 h-4" /></button>
                <button onClick={() => setIsChatOpen(false)} className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/45 flex items-center justify-center font-bold">✕</button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl leading-relaxed shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-emerald-600 text-white rounded-br-none' 
                      : isDarkMode ? 'bg-slate-700 text-slate-100 rounded-bl-none border border-slate-600' : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                  }`}>
                    {msg.sender === 'ai' ? <div dangerouslySetInnerHTML={{ __html: formatAIResponse(msg.text) }} /> : <p>{msg.text}</p>}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className={`p-4 rounded-2xl rounded-bl-none animate-pulse text-xs font-medium ${isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                    🤖 جاري معالجة طلبك...
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            <div className={`p-3 border-t flex flex-col gap-2 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleBrowserVoiceInput} className={`p-3 rounded-xl transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}><Mic className="w-5 h-5" /></button>
                <form onSubmit={sendChatMessage} className="flex-1 flex gap-2">
                  <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="Type or click mic..." className={`flex-1 px-4 py-2.5 rounded-xl border text-sm focus:outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                  <button type="submit" disabled={isChatLoading || !inputMessage.trim()} className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors"><Send className="w-5 h-5" /></button>
                </form>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}