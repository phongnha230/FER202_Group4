"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const SESSION_KEY = "urban_nest_chat_session";
const SESSION_USER_KEY = "urban_nest_chat_user";
const GUEST_USER = "guest";
const SUGGESTED_QUESTIONS = [
  "Mình muốn tìm áo hoodie dưới $20",
  "Gợi ý outfit đi chơi cuối tuần",
  "Có sản phẩm nào đang giảm giá không?",
  "Tư vấn áo khoác cho thời tiết mát",
];

type ProductCardData = {
  name: string;
  url: string;
  imageUrl?: string;
};

function extractProductCards(markdown: string): {
  cards: ProductCardData[];
  cleanedText: string;
} {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const linkRegex = /\[([^\]]+)\]\((\/product\/[^)\s]+)\)/g;
  const imageRegex = /!\[[^\]]*]\(([^)\s]+)\)/g;
  const cards: ProductCardData[] = [];
  const seenUrls = new Set<string>();

  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = linkRegex.exec(normalized)) !== null) {
    const [, rawName, rawUrl] = linkMatch;
    const url = rawUrl.trim();
    if (!url || seenUrls.has(url)) {
      continue;
    }

    const linkEnd = linkMatch.index + linkMatch[0].length;
    const lookBehindStart = Math.max(0, linkMatch.index - 400);
    const contextBeforeLink = normalized.slice(lookBehindStart, linkMatch.index);
    const contextAfterLink = normalized.slice(linkEnd, linkEnd + 300);
    const imageCandidates = [...contextBeforeLink.matchAll(imageRegex)];
    const imageAfterCandidates = [...contextAfterLink.matchAll(imageRegex)];
    const imageUrl =
      imageCandidates.at(-1)?.[1]?.trim() ||
      imageAfterCandidates.at(0)?.[1]?.trim();

    cards.push({
      name: rawName.trim() || "View product",
      url,
      imageUrl,
    });
    seenUrls.add(url);
  }

  const cleanedText = normalized
    .replace(/!\[[^\]]*]\(([^)\s]+)\)/g, "")
    .replace(/\*{0,2}\[([^\]]+)\]\((\/product\/[^)\s]+)\)\*{0,2}/g, "$1")
    .replace(/^\s*(?:\+|-)?\s*Link chi tiết:\s*.*$/gim, "")
    .replace(/^\s*(?:\+|-)?\s*Ảnh:\s*.*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { cards, cleanedText };
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const currentUserId = data.session?.user?.id ?? null;
      setUserId(currentUserId);

      const storedSession = localStorage.getItem(SESSION_KEY);
      const storedUser = localStorage.getItem(SESSION_USER_KEY);
      const currentUserKey = currentUserId ?? GUEST_USER;

      if (!storedSession) {
        return;
      }

      if (!storedUser || storedUser === currentUserKey) {
        setSessionId(storedSession);
        return;
      }

      // Migrate guest session to logged-in user when auth resolved after first send.
      if (storedUser === GUEST_USER && currentUserId) {
        setSessionId(storedSession);
        localStorage.setItem(SESSION_USER_KEY, currentUserId);
        return;
      }

      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_USER_KEY);
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    const query = sessionId
      ? `/api/chat?sessionId=${encodeURIComponent(sessionId)}`
      : userId
      ? `/api/chat?userId=${encodeURIComponent(userId)}`
      : null;

    if (!query) return;

    fetch(query)
      .then((res) => {
        if (res.status === 404) {
          setSessionId(null);
          localStorage.removeItem(SESSION_KEY);
          localStorage.removeItem(SESSION_USER_KEY);
          setMessages([]);
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((data) => {
        if (!data) return;

        if (data.sessionId && data.sessionId !== sessionId) {
          setSessionId(data.sessionId);
          localStorage.setItem(SESSION_KEY, data.sessionId);
          localStorage.setItem(SESSION_USER_KEY, userId ?? GUEST_USER);
        }

        if (data?.messages?.length) {
          setMessages(
            data.messages.map((m: { role: string; text: string }) => ({
              role: m.role as "user" | "ai",
              text: m.text,
            }))
          );
        } else {
          setMessages([]);
        }
      })
      .catch(() => {});
  }, [open, sessionId, userId]);

  useEffect(() => {
    if (!sessionId || !userId) return;
    const storedSession = localStorage.getItem(SESSION_KEY);
    const storedUser = localStorage.getItem(SESSION_USER_KEY);
    if (storedSession === sessionId && storedUser === GUEST_USER) {
      localStorage.setItem(SESSION_USER_KEY, userId);
    }
  }, [sessionId, userId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (presetText?: string) => {
    const text = (presetText ?? input).trim();
    if (!text || loading) return;

    if (!presetText) {
      setInput("");
    }
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const effectiveUserId =
        userId ?? (await supabase.auth.getSession()).data.session?.user?.id ?? null;

      if (effectiveUserId !== userId) {
        setUserId(effectiveUserId);
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId,
          userId: effectiveUserId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "ai", text: data.error || "Đã có lỗi xảy ra." },
        ]);
        return;
      }

      setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);

      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem(SESSION_KEY, data.sessionId);
        localStorage.setItem(SESSION_USER_KEY, effectiveUserId ?? GUEST_USER);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Không thể kết nối. Vui lòng thử lại." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 z-40 size-14 rounded-full shadow-lg"
        aria-label="Mở chat hỗ trợ"
      >
        <MessageCircle className="size-6" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Trợ lý mua sắm</SheetTitle>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4 overflow-hidden">
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto rounded-lg border bg-muted/30 p-3"
            >
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-center text-sm text-muted-foreground">
                    Chào bạn! Hãy chọn nhanh một câu hỏi gợi ý bên dưới hoặc nhập câu hỏi của bạn.
                  </p>
                  <div className="grid justify-items-end gap-2">
                    {SUGGESTED_QUESTIONS.map((question) => (
                      <button
                        key={question}
                        type="button"
                        disabled={loading}
                        onClick={() => send(question)}
                        className="w-[78%] rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-left text-sm text-foreground shadow-sm transition-colors hover:border-primary/45 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60 sm:w-[72%]"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted overflow-hidden"
                    )}
                  >
                    {m.role === "user" ? (
                      <p className="whitespace-pre-wrap">{m.text}</p>
                    ) : (
                      (() => {
                        const { cards, cleanedText } = extractProductCards(m.text);

                        return (
                          <div className="space-y-3">
                            {cleanedText && (
                              <ReactMarkdown
                                components={{
                                  a: ({ node, ...props }) => {
                                    void node;
                                    return (
                                      <a
                                        {...props}
                                        className="break-all font-medium text-primary hover:underline"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      />
                                    );
                                  },
                                  img: ({ node, ...props }) => {
                                    void node;
                                    return (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        {...props}
                                        className="my-2 h-auto max-w-[200px] rounded-md border object-cover"
                                        alt={props.alt || "Product"}
                                      />
                                    );
                                  },
                                  p: ({ node, ...props }) => {
                                    void node;
                                    return (
                                      <p
                                        {...props}
                                        className="mb-2 whitespace-pre-wrap last:mb-0"
                                      />
                                    );
                                  },
                                }}
                              >
                                {cleanedText}
                              </ReactMarkdown>
                            )}

                            {cards.length > 0 && (
                              <div className="grid gap-3 sm:grid-cols-2">
                                {cards.map((card) => (
                                  <article
                                    key={card.url}
                                    className="rounded-xl border bg-background p-2 shadow-sm transition-shadow hover:shadow-md"
                                  >
                                    {card.imageUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={card.imageUrl}
                                        alt={card.name}
                                        className="h-36 w-full rounded-lg object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-36 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                                        No image
                                      </div>
                                    )}
                                    <div className="mt-2 space-y-2">
                                      <p className="text-sm font-semibold leading-snug text-foreground">
                                        {card.name}
                                      </p>
                                      <Link
                                        href={card.url}
                                        onClick={() => setOpen(false)}
                                        className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                                      >
                                        View
                                      </Link>
                                    </div>
                                  </article>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                    <Loader2 className="size-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Đang trả lời...</span>
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập tin nhắn..."
                disabled={loading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={loading}>
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
