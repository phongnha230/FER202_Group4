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

// Returns budget in USD to match DB price unit
function extractBudget(text: string): number | null {
  const normalized = normalizeForMatch(text);

  const prefixUsd = normalized.match(/(?:\$|usd|dollar)\s*(\d+(?:[.,]\d+)?)/i);
  if (prefixUsd) {
    const usd = Number.parseFloat(prefixUsd[1].replace(',', '.'));
    if (!Number.isNaN(usd)) {
      return usd;
    }
  }

  const suffix = normalized.match(
    /(\d+(?:[.,]\d+)?)\s*(k|nghin|trieu|tr|vnd|d|\$|usd|dollar)?/i
  );
  if (!suffix) return null;

  const amount = Number.parseFloat(suffix[1].replace(',', '.'));
  if (Number.isNaN(amount)) return null;

  const unit = (suffix[2] || 'k').toLowerCase();
  // Convert VND to USD (approx 25,000 VND = $1)
  if (unit === '$' || unit === 'usd' || unit === 'dollar') return amount;
  if (unit === 'trieu' || unit === 'tr') return Math.round((amount * 1_000_000) / 25_000);
  if (unit === 'k' || unit === 'nghin') return Math.round((amount * 1_000) / 25_000);
  if (unit === 'vnd' || unit === 'd') return Math.round(amount / 25_000);
  return Math.round((amount * 1_000) / 25_000);
}

// Returns both normalized (no-diacritic) and original (with-diacritic) keywords
// so the DB search can match both English and Vietnamese product names.
function extractSearchKeywords(text: string): { original: string; normalized: string } {
  const numbersPattern =
    /(?:\$|usd|dollar)\s*\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?\s*(k|nghin|trieu|tr|vnd|d|\$|usd|dollar)?/g;
  const stopwordsSet = new Set([
    'mua', 'tim', 'cho', 'voi', 'duoi', 'tren', 'tam', 'khoang', 'gia',
    'bao', 'san', 'pham', 'dang', 'khong', 'co', 'nao', 'giam', 'sale',
    'khuyen', 'mai', 'uu', 'dai', 'ban', 'oi', 'nhe', 'a', 'ay', 'gi',
    'toi', 'muon', 'minh', 'shop', 'hang', 'cua', 'the', 'la', 'va',
    'de', 'vay', 'ha', 'nha', 'do', 'nhu', 'biet', 'hoi', 'xem',
  ]);

  const normalizedText = normalizeForMatch(text).replace(numbersPattern, ' ');
  const normalizedWords = normalizedText.trim().split(/\s+/);
  const originalWords = text.replace(numbersPattern, ' ').trim().split(/\s+/);

  const keptIndexes: number[] = [];
  for (let i = 0; i < normalizedWords.length; i++) {
    const word = normalizedWords[i].replace(/[^a-z]/g, '');
    if (word.length > 1 && !stopwordsSet.has(word)) {
      keptIndexes.push(i);
    }
  }

  const normalized = keptIndexes.map((i) => normalizedWords[i]).join(' ').trim();
  const original = keptIndexes.map((i) => originalWords[i] || '').join(' ').trim();

  return {
    original: original.length < 2 ? '' : original.slice(0, 80),
    normalized: normalized.length < 2 ? '' : normalized.slice(0, 80),
  };
}

async function getProductContext(
  query: string,
  maxPrice?: number | null,
  options?: { saleOnly?: boolean }
): Promise<string> {
  const { original: searchOriginal, normalized: searchNormalized } = extractSearchKeywords(query);
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

  if (searchOriginal || searchNormalized) {
    const orClauses: string[] = [];
    if (searchOriginal) {
      orClauses.push(`name.ilike.%${searchOriginal}%`, `description.ilike.%${searchOriginal}%`);
    }
    if (searchNormalized && searchNormalized !== searchOriginal) {
      orClauses.push(`name.ilike.%${searchNormalized}%`, `description.ilike.%${searchNormalized}%`);
    }
    dbQuery = dbQuery.or(orClauses.join(','));
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
    return '- Không có sản phẩm phù hợp trong danh sách hiện có.';
  }

  return products
    .map((p) => {
      // Show sale price clearly so AI reports the correct discounted price
      const priceText = p.sale_price
        ? `$${p.sale_price} (giá gốc $${p.base_price}) [SALE PRICE - applies to all variants]`
        : `$${p.base_price}`;
      // When on sale, hide per-variant price to avoid AI confusion with the original price
      const variants = (p.product_variants || [])
        .map((v) =>
          p.sale_price
            ? `${v.size}/${v.color}: ${v.stock} in stock`
            : `${v.size}/${v.color}: $${v.price} (${v.stock} in stock)`
        )
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

      return `- Tên sản phẩm: ${p.name}
  + Giá: ${priceText} (${variants || 'xem chi tiết'})
  + Ảnh: ${imageUrl ? `![Ảnh ${p.name}](${imageUrl})` : 'không có'}
  + Link chi tiết: [${p.name}](${url})`;
    })
    .join('\n\n');
}

function buildFallbackReply(productContext: string, saleOnly: boolean): string {
  const normalized = productContext.trim();
  const isEmpty = normalized.startsWith('- Không có sản phẩm phù hợp');

  if (isEmpty) {
    return saleOnly
      ? 'Hiện tại shop chưa có sản phẩm giảm giá phù hợp theo yêu cầu của bạn.'
      : 'Hiện tại mình chưa tìm thấy sản phẩm phù hợp trong shop cho yêu cầu này.';
  }

  const snippets = normalized
    .split('\n\n')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join('\n\n');

  return `Mình đang gặp lỗi kết nối AI tạm thời, nhưng bạn có thể tham khảo nhanh các sản phẩm sau:\n\n${snippets}`;
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
      return NextResponse.json({ error: 'Thiếu nội dung tin nhắn' }, { status: 400 });
    }

    const trimmed = message.trim();
    if (!trimmed) {
      return NextResponse.json({ error: 'Tin nhắn không được để trống' }, { status: 400 });
    }

    const budget = extractBudget(trimmed);
    const saleOnly = isSaleIntent(trimmed);
    const productContext = await getProductContext(trimmed, budget, { saleOnly });

    let sid = sessionId;
    if (!sid) {
      const session = await createSession(userId || null);
      if (!session) {
        return NextResponse.json({ error: 'Không thể tạo phiên chat' }, { status: 500 });
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

    const systemPrompt = `Bạn là trợ lý tư vấn bán hàng của cửa hàng thời trang. Trả lời ngắn gọn, thân thiện bằng tiếng Việt.
NGUYÊN TẮC BẮT BUỘC KHI TRẢ LỜI TƯ VẤN/PHỐI ĐỒ:
1. CHỈ được nhắc đến và gợi ý những sản phẩm CÓ TRONG DANH SÁCH DỮ LIỆU BÊN DƯỚI. TUYỆT ĐỐI KHÔNG tự bịa ra sản phẩm bên ngoài. Tuyệt đối đừng tự chế "Cargo Utility Pants", "Denim Jacket"... nếu nó KHÔNG CÓ TRONG DANH SÁCH BÊN DƯỚI.
2. BẤT CỨ KHI NÀO nhắc đến tên sản phẩm trong câu trả lời (báo giá, gợi ý...), BẮT BUỘC phải viết TÊN SẢN PHẨM Ở DẠNG LINK VÀ KÈM THEO ẢNH SẢN PHẨM. Nếu không có ảnh, cứ trả link sản phẩm.
3. Dùng đúng chuẩn Markdown:
   Nếu có ảnh: ![Ảnh Sản Phẩm](link_ảnh) **[Tên Sản Phẩm In Đậm](link_sản_phẩm)**
   Nếu không có ảnh: **[Tên Sản Phẩm In Đậm](link_sản_phẩm)**
4. Nếu khách hỏi "sản phẩm XYZ có không", và nó KHÔNG CÓ TRONG DANH SÁCH DỮ LIỆU, thì nói KHÔNG có và gợi ý món KHÁC CÓ TRONG DANH SÁCH DỮ LIỆU.`;

    const userPrompt = `[DỮ LIỆU SẢN PHẨM HIỆN CÓ]
${productContext}

[SALE_ONLY]: ${saleOnly ? 'yes' : 'no'}
[IMPORTANT]: If SALE_ONLY is yes, only suggest products that are currently on sale.
[NGÂN SÁCH KHÁCH NÊU (nếu có)]: ${budget ? `${budget}` : 'không'}

[Tin nhắn khách]: ${trimmed}`;

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

    // Extract product slugs/IDs from AI reply and fetch accurate price + image from DB
    const productUrlMatches = [...reply.matchAll(/\/product\/([a-zA-Z0-9_-]+)/g)];
    const slugsOrIds = [...new Set(productUrlMatches.map((m) => m[1]))];

    let suggestedProducts: Array<{
      name: string;
      url: string;
      imageUrl: string;
      base_price: number;
      sale_price: number | null;
    }> = [];

    if (slugsOrIds.length > 0) {
      const isUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
      const slugValues = slugsOrIds.filter((s) => !isUUID(s));
      const idValues = slugsOrIds.filter((s) => isUUID(s));
      const orParts = [
        ...slugValues.map((s) => `slug.eq.${s}`),
        ...idValues.map((id) => `id.eq.${id}`),
      ];
      if (orParts.length === 0) orParts.push('slug.eq.__none__');

      const { data: prods } = await supabaseAdmin
        .from('products')
        .select('id, name, slug, base_price, sale_price, image, product_images(image_url, is_main)')
        .or(orParts.join(','));

      if (prods) {
        suggestedProducts = prods.map((p) => {
          const imgs = (p.product_images as { image_url: string; is_main: boolean }[]) || [];
          const mainImg = imgs.find((i) => i.is_main) || imgs[0];
          const imageUrl = mainImg?.image_url || p.image || '';
          // Use the URL format the AI actually used in its reply so productMap lookup always succeeds
          const url = (p.slug && slugValues.includes(p.slug))
            ? `/product/${p.slug}`
            : idValues.includes(p.id)
            ? `/product/${p.id}`
            : p.slug ? `/product/${p.slug}` : `/product/${p.id}`;
          return { name: p.name, url, imageUrl, base_price: p.base_price, sale_price: p.sale_price ?? null };
        });
      }
    }

    return NextResponse.json({
      reply,
      sessionId: sid,
      suggestedProducts,
    });
  } catch (err: unknown) {
    console.error('Chat API error:', err);
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('API key not valid') || msg.includes('API_KEY_INVALID')) {
      return NextResponse.json(
        {
          error:
            'API key Gemini không hợp lệ. Vui lòng kiểm tra GEMINI_API_KEY trong .env.local và lấy key mới tại https://aistudio.google.com/apikey',
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: 'Lỗi xử lý tin nhắn. Vui lòng thử lại.' }, { status: 500 });
  }
}
