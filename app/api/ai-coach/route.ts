import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transcript, userId, amount, category, budgetLimit, transactionHistory } = body;

    // Calculate total spent dynamically and accurately from the transaction history array
    const history = transactionHistory || [];
    const calculatedTotalSpent = history.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0) + (amount || 0);
    const limit = budgetLimit || 1500;

    const financialContext = {
      transcript,
      userId,
      newExpense: { amount, category },
      budget: {
        monthlyLimit: limit,
        totalSpent: calculatedTotalSpent,
        remaining: limit - calculatedTotalSpent,
        isOverBudget: calculatedTotalSpent > limit
      },
      transactionHistory: history
    };

    const n8nWebhookUrl = 'https://yousuf1212.app.n8n.cloud/webhook-test/chat-input';

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(financialContext),
    });

    const data = await response.json().catch(() => ({ status: 'success' }));
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}