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
      return NextResponse.json(
        {
          success: false,
          error: 'N8N_WEBHOOK_URL is not configured',
        },
        { status: 500 }
      );
    }

    const payload = {
      transcript: message || '',
      audioData: audioData || null,
      userId,
      language: lang || 'ar',

      budget: {
        monthlyLimit: Number(budgetLimit || 0),
        totalSpent: Number(totalSpent || 0),
        remaining:
          Number(budgetLimit || 0) - Number(totalSpent || 0),
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

    const reply = await response.text();

    console.log('n8n status:', response.status);
    console.log('n8n reply:', reply);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: reply || `n8n error ${response.status}`,
        },
        { status: response.status }
      );
    }

    if (!reply || !reply.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'n8n returned an empty response',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      reply: reply.trim(),
    });

  } catch (error: any) {
    console.error('Chat API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Unknown server error',
      },
      { status: 500 }
    );
  }
}