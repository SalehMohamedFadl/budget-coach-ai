import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // تأكد أن مسار سوبابيز صح عندك

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, budgetLimit, lang } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    // 1. جلب أحدث الأهداف مباشرة من Supabase لضمان دقة الأرقام (مثل الـ 4500 الحقيقية)
    const { data: latestGoals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId);

    if (goalsError) console.error("Error fetching goals:", goalsError.message);

    // 2. جلب أحدث المعاملات مباشرة من Supabase
    const { data: latestTransactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (txError) console.error("Error fetching transactions:", txError.message);

    const goals = latestGoals || [];
    const transactions = latestTransactions || [];

    // 3. حساب إجمالي المصروفات الحقيقي (المعاملات العادية + إجمالي المدخرات في الأهداف)
    const transactionsSpent = transactions.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
    const goalsSavedTotal = goals.reduce((acc: number, curr: any) => acc + (curr.saved_amount || 0), 0);
    const totalSpent = transactionsSpent + goalsSavedTotal;

    // 4. تجهيز الـ Payload بأحدث وأدق بيانات من الداتا بيز مباشرة
    const payload = {
      transcript: "User requested manual financial coaching analysis.",
      userId,
      language: lang || 'ar',
      budget: {
        monthlyLimit: budgetLimit,
        totalSpent: totalSpent,
        remaining: budgetLimit - totalSpent,
        isOverBudget: totalSpent > budgetLimit
      },
      transactionHistory: transactions,
      goals: goals // <--- الأهداف بأحدث قيم محدثة من الداتا بيز (4500)
    };

    // رابط الـ Webhook الخاص بك على n8n
    const n8nWebhookUrl = 'https://yousuf1212.app.n8n.cloud/webhook-test/chat-input';
    
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json({ success: true, data });
    
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}