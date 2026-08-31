import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      message,
      audioData,
      userId,
      budgetLimit,
      totalSpent,
      transactionHistory,
      goals,
      lang,
    } = body;

    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      throw new Error('N8N_WEBHOOK_URL is not configured');
    }

    const payload = {
      transcript: message || '',
      audioData: audioData || null,
      userId,
      language: lang || 'ar',

      budget: {
        monthlyLimit: Number(budgetLimit || 0),
        totalSpent: Number(totalSpent || 0),
        remaining: Number(budgetLimit || 0) - Number(totalSpent || 0),
        isOverBudget:
          Number(totalSpent || 0) > Number(budgetLimit || 0),
      },

      transactionHistory: transactionHistory || [],
      goals: goals || [],
    };

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const rawText = await response.text();

    if (!response.ok) {
      console.error('n8n error:', rawText);

      return NextResponse.json(
        {
          success: false,
          error: rawText || `n8n returned ${response.status}`,
        },
        { status: response.status }
      );
    }

    let data: any;

    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }

    const aiReply =
      typeof data === 'string'
        ? data
        : data.output ||
          data.reply ||
          data.text ||
          data.message ||
          JSON.stringify(data);

    return NextResponse.json({
      success: true,
      reply: aiReply,
    });

  } catch (error: any) {
    console.error('Chat API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}