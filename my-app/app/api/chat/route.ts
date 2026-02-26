import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  createSession,
  getSession,
  getMessages,
  insertMessage,
} from '@/services/chat.service';

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ error: 'Thiếu sessionId' }, { status: 400 });
  }
  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Phiên không tồn tại' }, { status: 404 });
  }
  const messages = await getMessages(sessionId);
  return NextResponse.json({
    messages: messages.map((m) => ({ role: m.sender, text: m.message })),
  });
}

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  sale_price: number | null;
  slug: string | null;
  status: string;
  product_variants?: { price: number; size: string; color: string; stock: number }[];
  product_images?: { image_url: string; is_main: boolean }[];
}

function extractBudget(text: string): number | null {
  const match = text.match(/(\d+)\s*(k|nghìn|triệu|tr|vnd|đ|\$|usd|dollar)?/i);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  const unit = (match[2] || 'k').toLowerCase();
  if (unit === '$' || unit === 'usd' || unit === 'dollar') return num * 25_000;
  if (unit === 'triệu' || unit === 'tr') return num * 1_000_000;
  if (unit === 'k' || unit === 'nghìn') return num * 1_000;
  if (unit === 'vnd' || unit === 'đ') return num;
  return num * 1_000;
}

function extractSearchKeywords(text: string): string {
  return text
    .replace(/\d+\s*(k|nghìn|triệu|tr|vnd|đ)?/gi, '')
    .replace(/\b(mua|tìm|cho|với|dưới|trên|tầm|khoảng|giá|bao nhiêu)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

async function getProductContext(query: string, maxPrice?: number | null): Promise<string> {
  const search = extractSearchKeywords(query);
  const hasBudget = typeof maxPrice === 'number' && maxPrice > 0;

  let dbQuery = supabaseAdmin
    .from('products')
    .select(`
      id, name, description, base_price, sale_price, slug, status,
      product_variants(price, size, color, stock),
      product_images(image_url, is_main)
    `)
    .eq('status', 'active');

  if (search) {
    dbQuery = dbQuery.or(
      `name.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  if (hasBudget) {
    dbQuery = dbQuery.or(`base_price.lte.${maxPrice},sale_price.lte.${maxPrice}`);
  }

  const { data: products, error } = await dbQuery.limit(30);

  if (error || !products?.length) {
    const { data: fallback } = await supabaseAdmin
      .from('products')
      .select(`
        id, name, description, base_price, sale_price, slug, status,
        product_variants(price, size, color, stock),
        product_images(image_url, is_main)
      `)
      .eq('status', 'active')
      .limit(20);
    return formatProducts(fallback || []);
  }

  return formatProducts(products as ProductRow[]);
}

function formatProducts(products: ProductRow[]): string {
  return products
    .map((p) => {
      const price = p.sale_price ?? p.base_price;
      const variants = (p.product_variants || [])
        .map((v) => `${v.size}/${v.color}: ${v.price}đ (còn ${v.stock})`)
        .join(', ');
      const url = p.slug ? `/product/${p.slug}` : `/product/${p.id}`;
      
      let imageUrl = '';
      if (p.product_images && p.product_images.length > 0) {
        const mainImg = p.product_images.find(img => img.is_main) || p.product_images[0];
        imageUrl = mainImg.image_url;
      }
      
      return `- Tên sản phẩm: ${p.name}
  + Giá: ${price}đ (${variants || 'xem chi tiết'})
  + Ảnh: ${imageUrl ? `![Ảnh ${p.name}](${imageUrl})` : 'không có'}
  + Link chi tiết: [${p.name}](${url})`;
    })
    .join('\n\n');
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
      return NextResponse.json(
        { error: 'Thiếu nội dung tin nhắn' },
        { status: 400 }
      );
    }

    const trimmed = message.trim();
    if (!trimmed) {
      return NextResponse.json(
        { error: 'Tin nhắn không được để trống' },
        { status: 400 }
      );
    }

    const budget = extractBudget(trimmed);
    const productContext = await getProductContext(trimmed, budget);

    let sid = sessionId;
    if (!sid) {
      const session = await createSession(userId || null);
      if (!session) {
        return NextResponse.json(
          { error: 'Không thể tạo phiên chat' },
          { status: 500 }
        );
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
2. BẤT CỨ KHI NÀO nhắc đến thẻ tên sản phẩm trong câu trả lời (dù là để báo giá, gợi ý, khen ngợi), BẮT BUỘC phải viết TÊN SẢN PHẨM Ở DẠNG LINK VÀ KÈM THEO ẢNH SẢN PHẨM. Nếu không có ảnh, cứ trả link sản phẩm.
3. Cùng với điểm số 2, Dùng đúng chuẩn Markdown: 
   Nếu có ảnh: ![Ảnh Sản Phẩm](link_ảnh) **[Tên Sản Phẩm Được In Đậm](link_sản_phẩm)**
   Nếu không có ảnh: **[Tên Sản Phẩm Được In Đậm](link_sản_phẩm)**
4. Nếu khách hỏi "sản phẩm XYZ có không", và nó K CÓ TRONG DANH SÁCH DỮ LIỆU, thì hãy nói KHÔNG có và gợi ý món KHÁC CÓ TRONG DANH SÁCH DỮ LIỆU.`;

    const userPrompt = `[DỮ LIỆU SẢN PHẨM HIỆN CÓ]
${productContext}

[NGÂN SÁCH KHÁCH NÊU (nếu có)]: ${budget ? `${budget}đ` : 'không'}

[Tin nhắn khách]: ${trimmed}`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({
      history: recentHistory.slice(0, -1),
    });

    const result = await chat.sendMessage(userPrompt);
    const reply = result.response.text();

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
        { error: 'API key Gemini không hợp lệ. Vui lòng kiểm tra GEMINI_API_KEY trong .env.local và lấy key mới tại https://aistudio.google.com/apikey' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Lỗi xử lý tin nhắn. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
