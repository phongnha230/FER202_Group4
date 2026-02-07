"use client";

import { useState, useRef, useEffect } from "react";
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

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) setSessionId(stored);

    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!open || !sessionId) return;
    fetch(`/api/chat?sessionId=${encodeURIComponent(sessionId)}`)
      .then((res) => {
        if (res.status === 404) {
          setSessionId(null);
          localStorage.removeItem(SESSION_KEY);
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((data) => {
        if (data?.messages?.length) {
          setMessages(
            data.messages.map((m: { role: string; text: string }) => ({
              role: m.role as "user" | "ai",
              text: m.text,
            }))
          );
        }
      })
      .catch(() => {});
  }, [open, sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId,
          userId,
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
                <p className="text-center text-sm text-muted-foreground">
                  Chào bạn! Hỏi tôi về sản phẩm, giá cả hoặc gợi ý mua sắm nhé.
                </p>
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
                        : "bg-muted"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
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
