import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  createSession,
  getSession,
  getLatestSessionByUser,
  getMessages,
  insertMessage,
} from '@/services/chat.service';

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');
  const userId = req.nextUrl.searchParams.get('userId');

  if (!sessionId && !userId) {
    return NextResponse.json({ error: 'Thiếu sessionId hoặc userId' }, { status: 400 });
  }

  if (sessionId) {
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Phiên không tồn tại' }, { status: 404 });
    }

    const messages = await getMessages(sessionId);
    return NextResponse.json({
      sessionId,
      messages: messages.map((m) => ({ role: m.sender, text: m.message })),
    });
  }

  const latestSession = userId ? await getLatestSessionByUser(userId) : null;
  if (!latestSession) {
    return NextResponse.json({
      sessionId: null,
      messages: [],
    });
  }

  const messages = await getMessages(latestSession.id);
  return NextResponse.json({
    sessionId: latestSession.id,
    messages: messages.map((m) => ({ role: m.sender, text: m.message })),
  });
}
interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  sale_price: number | null;
  image: string | null;
  slug: string | null;
  status: string;
  product_variants?: { price: number; size: string; color: string; stock: number }[];
  product_images?: { image_url: string; is_main: boolean }[];
}

function normalizeForMatch(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function isSaleIntent(text: string): boolean {
  const normalized = normalizeForMatch(text);
  return /(giam gia|sale|khuyen mai|uu dai|discount)/i.test(normalized);
}

function extractBudget(text: string): number | null {
  const normalized = normalizeForMatch(text);

  const prefixUsd = normalized.match(/(?:\$|usd|dollar)\s*(\d+(?:[.,]\d+)?)/i);
  if (prefixUsd) {
    const usd = Number.parseFloat(prefixUsd[1].replace(',', '.'));
    if (!Number.isNaN(usd)) {
      return Math.round(usd * 25_000);
    }
  }

  const suffix = normalized.match(
    /(\d+(?:[.,]\d+)?)\s*(k|nghin|trieu|tr|vnd|d|\$|usd|dollar)?/i
  );
  if (!suffix) return null;

  const amount = Number.parseFloat(suffix[1].replace(',', '.'));
  if (Number.isNaN(amount)) return null;

  const unit = (suffix[2] || 'k').toLowerCase();
  if (unit === '$' || unit === 'usd' || unit === 'dollar') return Math.round(amount * 25_000);
  if (unit === 'trieu' || unit === 'tr') return Math.round(amount * 1_000_000);
  if (unit === 'k' || unit === 'nghin') return Math.round(amount * 1_000);
  if (unit === 'vnd' || unit === 'd') return Math.round(amount);
  return Math.round(amount * 1_000);
}

function extractSearchKeywords(text: string): string {
  const normalized = normalizeForMatch(text);
  const cleaned = normalized
    .replace(
      /(?:\$|usd|dollar)\s*\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?\s*(k|nghin|trieu|tr|vnd|d|\$|usd|dollar)?/g,
      ' '
    )
    .replace(
      /\b(mua|tim|cho|voi|duoi|tren|tam|khoang|gia|bao|san pham|dang|khong|co|nao|giam|sale|khuyen mai|uu dai)\b/g,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.length < 2 ? '' : cleaned.slice(0, 80);
}

async function getProductContext(
  query: string,
  maxPrice?: number | null,
  options?: { saleOnly?: boolean }
): Promise<string> {
  const search = extractSearchKeywords(query);
  const hasBudget = typeof maxPrice === 'number' && maxPrice > 0;
  const saleOnly = options?.saleOnly === true;

  let dbQuery = supabaseAdmin
    .from('products')
    .select(`
      id, name, description, base_price, sale_price, image, slug, status,
      product_variants(price, size, color, stock),
      product_images(image_url, is_main)
    `)
    .eq('status', 'active');

  if (saleOnly) {
    dbQuery = dbQuery.not('sale_price', 'is', null);
  }

  if (search) {
    dbQuery = dbQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (hasBudget) {
    dbQuery = saleOnly
      ? dbQuery.lte('sale_price', maxPrice!)
      : dbQuery.or(`base_price.lte.${maxPrice},sale_price.lte.${maxPrice}`);
  }

  const { data: products, error } = await dbQuery.limit(30);

  if (error || !products?.length) {
    let fallbackQuery = supabaseAdmin
      .from('products')
      .select(`
        id, name, description, base_price, sale_price, image, slug, status,
        product_variants(price, size, color, stock),
        product_images(image_url, is_main)
      `)
      .eq('status', 'active');

    if (saleOnly) {
      fallbackQuery = fallbackQuery.not('sale_price', 'is', null);
    }

    const { data: fallback } = await fallbackQuery.limit(20);
    return formatProducts((fallback || []) as ProductRow[]);
  }

  return formatProducts(products as ProductRow[]);
}

function formatProducts(products: ProductRow[]): string {
  if (!products.length) {
    return '- KhÃ´ng cÃ³ sáº£n pháº©m phÃ¹ há»£p trong danh sÃ¡ch hiá»‡n cÃ³.';
  }

  return products
    .map((p) => {
      const price = p.sale_price ?? p.base_price;
      const priceText = p.sale_price ? `$${price} (giÃ¡ gá»‘c $${p.base_price})` : `$${price}`;
      const variants = (p.product_variants || [])
        .map((v) => `${v.size}/${v.color}: $${v.price} (cÃ²n ${v.stock})`)
        .join(', ');
      const url = p.slug ? `/product/${p.slug}` : `/product/${p.id}`;

      let imageUrl = '';
      if (p.product_images && p.product_images.length > 0) {
        const mainImg = p.product_images.find((img) => img.is_main) || p.product_images[0];
        imageUrl = mainImg.image_url;
      }
      if (!imageUrl && p.image) {
        imageUrl = p.image;
      }

      return `- TÃªn sáº£n pháº©m: ${p.name}
  + GiÃ¡: ${priceText} (${variants || 'xem chi tiáº¿t'})
  + áº¢nh: ${imageUrl ? `![áº¢nh ${p.name}](${imageUrl})` : 'khÃ´ng cÃ³'}
  + Link chi tiáº¿t: [${p.name}](${url})`;
    })
    .join('\n\n');
}

function buildFallbackReply(productContext: string, saleOnly: boolean): string {
  const normalized = productContext.trim();
  const isEmpty = normalized.startsWith('- KhÃ´ng cÃ³ sáº£n pháº©m phÃ¹ há»£p');

  if (isEmpty) {
    return saleOnly
      ? 'Hiá»‡n táº¡i shop chÆ°a cÃ³ sáº£n pháº©m giáº£m giÃ¡ phÃ¹ há»£p theo yÃªu cáº§u cá»§a báº¡n.'
      : 'Hiá»‡n táº¡i mÃ¬nh chÆ°a tÃ¬m tháº¥y sáº£n pháº©m phÃ¹ há»£p trong shop cho yÃªu cáº§u nÃ y.';
  }

  const snippets = normalized
    .split('\n\n')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join('\n\n');

  return `MÃ¬nh Ä‘ang gáº·p lá»—i káº¿t ná»‘i AI táº¡m thá»i, nhÆ°ng báº¡n cÃ³ thá»ƒ tham kháº£o nhanh cÃ¡c sáº£n pháº©m sau:\n\n${snippets}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sessionId, userId } = body as {
      message?: string;
      sessionId?: string;
      userId?: string | null;
    };

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Thiáº¿u ná»™i dung tin nháº¯n' }, { status: 400 });
    }

    const trimmed = message.trim();
    if (!trimmed) {
      return NextResponse.json({ error: 'Tin nháº¯n khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng' }, { status: 400 });
    }

    const budget = extractBudget(trimmed);
    const saleOnly = isSaleIntent(trimmed);
    const productContext = await getProductContext(trimmed, budget, { saleOnly });

    let sid = sessionId;
    if (!sid) {
      const session = await createSession(userId || null);
      if (!session) {
        return NextResponse.json({ error: 'KhÃ´ng thá»ƒ táº¡o phiÃªn chat' }, { status: 500 });
      }
      sid = session.id;
    } else {
      const existing = await getSession(sid);
      if (!existing) {
        const session = await createSession(userId || null);
        sid = session?.id ?? sid;
      }
    }

    await insertMessage(sid, userId || null, 'user', trimmed);

    const history = await getMessages(sid);
    const recentHistory = history
      .slice(0, -1)
      .slice(-10)
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.message }],
      }));

    const systemPrompt = `Báº¡n lÃ  trá»£ lÃ½ tÆ° váº¥n bÃ¡n hÃ ng cá»§a cá»­a hÃ ng thá»i trang. Tráº£ lá»i ngáº¯n gá»n, thÃ¢n thiá»‡n báº±ng tiáº¿ng Viá»‡t.
NGUYÃŠN Táº®C Báº®T BUá»˜C KHI TRáº¢ Lá»œI TÆ¯ Váº¤N/PHá»I Äá»’:
1. CHá»ˆ Ä‘Æ°á»£c nháº¯c Ä‘áº¿n vÃ  gá»£i Ã½ nhá»¯ng sáº£n pháº©m CÃ“ TRONG DANH SÃCH Dá»® LIá»†U BÃŠN DÆ¯á»šI. TUYá»†T Äá»I KHÃ”NG tá»± bá»‹a ra sáº£n pháº©m bÃªn ngoÃ i. Tuyá»‡t Ä‘á»‘i Ä‘á»«ng tá»± cháº¿ "Cargo Utility Pants", "Denim Jacket"... náº¿u nÃ³ KHÃ”NG CÃ“ TRONG DANH SÃCH BÃŠN DÆ¯á»šI.
2. Báº¤T Cá»¨ KHI NÃ€O nháº¯c Ä‘áº¿n tÃªn sáº£n pháº©m trong cÃ¢u tráº£ lá»i (bÃ¡o giÃ¡, gá»£i Ã½...), Báº®T BUá»˜C pháº£i viáº¿t TÃŠN Sáº¢N PHáº¨M á»ž Dáº NG LINK VÃ€ KÃˆM THEO áº¢NH Sáº¢N PHáº¨M. Náº¿u khÃ´ng cÃ³ áº£nh, cá»© tráº£ link sáº£n pháº©m.
3. DÃ¹ng Ä‘Ãºng chuáº©n Markdown:
   Náº¿u cÃ³ áº£nh: ![áº¢nh Sáº£n Pháº©m](link_áº£nh) **[TÃªn Sáº£n Pháº©m In Äáº­m](link_sáº£n_pháº©m)**
   Náº¿u khÃ´ng cÃ³ áº£nh: **[TÃªn Sáº£n Pháº©m In Äáº­m](link_sáº£n_pháº©m)**
4. Náº¿u khÃ¡ch há»i "sáº£n pháº©m XYZ cÃ³ khÃ´ng", vÃ  nÃ³ KHÃ”NG CÃ“ TRONG DANH SÃCH Dá»® LIá»†U, thÃ¬ nÃ³i KHÃ”NG cÃ³ vÃ  gá»£i Ã½ mÃ³n KHÃC CÃ“ TRONG DANH SÃCH Dá»® LIá»†U.`;

    const userPrompt = `[Dá»® LIá»†U Sáº¢N PHáº¨M HIá»†N CÃ“]
${productContext}

[SALE_ONLY]: ${saleOnly ? 'yes' : 'no'}
[IMPORTANT]: If SALE_ONLY is yes, only suggest products that are currently on sale.
[NGÃ‚N SÃCH KHÃCH NÃŠU (náº¿u cÃ³)]: ${budget ? `$${Math.round(budget / 25000)}` : 'khÃ´ng'}

[Tin nháº¯n khÃ¡ch]: ${trimmed}`;

    let reply = '';
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: systemPrompt,
      });

      const chat = model.startChat({
        history: recentHistory.slice(0, -1),
      });

      const result = await chat.sendMessage(userPrompt);
      reply = result.response.text();
    } catch (aiErr: unknown) {
      console.error('Gemini chat error:', aiErr);
      reply = buildFallbackReply(productContext, saleOnly);
    }

    await insertMessage(sid, userId || null, 'ai', reply);

    return NextResponse.json({
      reply,
      sessionId: sid,
    });
  } catch (err: unknown) {
    console.error('Chat API error:', err);
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('API key not valid') || msg.includes('API_KEY_INVALID')) {
      return NextResponse.json(
        {
          error:
            'API key Gemini khÃ´ng há»£p lá»‡. Vui lÃ²ng kiá»ƒm tra GEMINI_API_KEY trong .env.local vÃ  láº¥y key má»›i táº¡i https://aistudio.google.com/apikey',
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: 'Lá»—i xá»­ lÃ½ tin nháº¯n. Vui lÃ²ng thá»­ láº¡i.' }, { status: 500 });
  }
}
