import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

type SupportedMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

interface ParsedItem {
  name: string;
  price: number;
}

interface ParsedReceipt {
  items: ParsedItem[];
  subtotal?: number;
  tax?: number;
  tip?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Extract base64 data and media type
    const match = image.match(/^data:(image\/[\w+-]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }

    const mediaType = match[1] as SupportedMediaType;
    const base64Data = match[2];

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `Analyze this receipt image and extract the line items with their prices.

Return a JSON object with this exact structure:
{
  "items": [
    {"name": "Item name", "price": 12.99},
    ...
  ],
  "subtotal": 50.00,
  "tax": 4.50,
  "tip": 10.00
}

Rules:
- Include only actual menu items/products, not subtotals or totals
- Price should be a number, not a string
- If tax is listed, include it
- If tip is listed, include it (often not on receipt)
- If subtotal is listed, include it
- Omit fields that aren't on the receipt

Return ONLY the JSON object, no explanation or markdown.`,
            },
          ],
        },
      ],
    });

    // Extract text content from response
    const textContent = message.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    // Parse the JSON response
    let parsed: ParsedReceipt;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      console.error('Failed to parse AI response:', textContent.text);
      return NextResponse.json(
        { error: 'Failed to parse receipt. Please try again or enter items manually.' },
        { status: 500 }
      );
    }

    // Validate the parsed data
    if (!Array.isArray(parsed.items)) {
      return NextResponse.json(
        { error: 'Invalid receipt format. Please enter items manually.' },
        { status: 500 }
      );
    }

    // Clean and validate items
    parsed.items = parsed.items
      .filter((item) => item.name && typeof item.price === 'number' && item.price > 0)
      .map((item) => ({
        name: String(item.name).trim(),
        price: Math.round(item.price * 100) / 100,
      }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Receipt parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to process receipt. Please try again.' },
      { status: 500 }
    );
  }
}
