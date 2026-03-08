import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send } from "lucide-react";
import type { ChatMessage } from "@shared/schema";

interface Props {
  projectId: string;
  currentUserId: string;
  currentUserRole: string;
}

export default function ChatPanel({ projectId, currentUserId, currentUserRole }: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const isAdmin = ["admin", "engenharia", "financeiro"].includes(currentUserRole);

  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: [`/api/projects/${projectId}/chat`],
    queryFn: () => apiRequest("GET", `/api/projects/${projectId}/chat`).then(r => r.json()),
    refetchInterval: 10000,
  });

  const sendMut = useMutation({
    mutationFn: (content: string) =>
      apiRequest("POST", `/api/projects/${projectId}/chat`, { content }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/chat`] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/unread"] });
      setInput("");
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sendMut.isPending) return;
    sendMut.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: string | Date | null) => {
    if (!date) return "";
    return new Date(date).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  const roleLabel = (role: string) => {
    if (role === "admin") return "Admin";
    if (role === "engenharia") return "Engenharia";
    if (role === "financeiro") return "Financeiro";
    return "Integrador";
  };

  const isSenderAdmin = (role: string) => ["admin", "engenharia", "financeiro"].includes(role);

  return (
    <div className="flex flex-col h-full border rounded-xl bg-background overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
        <MessageSquare className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">Chat do Projeto</span>
        {messages.length > 0 && (
          <Badge variant="secondary" className="ml-auto text-xs">{messages.length} msg{messages.length !== 1 ? "s" : ""}</Badge>
        )}
      </div>

      <ScrollArea className="flex-1 px-4 py-3">
        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground py-8">Carregando...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-10">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>Nenhuma mensagem ainda.</p>
            <p className="text-xs mt-1">Inicie a conversa abaixo.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const fromMe = msg.senderId === currentUserId;
              const senderIsAdmin = isSenderAdmin(msg.senderRole);
              return (
                <div key={msg.id} className={`flex flex-col gap-1 ${fromMe ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                    fromMe
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : senderIsAdmin
                        ? "bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-100 rounded-bl-sm"
                        : "bg-muted rounded-bl-sm"
                  }`}>
                    {!fromMe && (
                      <p className={`text-xs font-semibold mb-0.5 ${senderIsAdmin ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"}`}>
                        {msg.senderName} · {roleLabel(msg.senderRole)}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                  </div>
                  <span className="text-xs text-muted-foreground px-1">{formatTime(msg.createdAt)}</span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      <div className="border-t px-3 py-2.5 flex gap-2 items-center">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Mensagem..."
          className="flex-1 text-sm"
          disabled={sendMut.isPending}
          data-testid="chat-input"
        />
        <Button size="icon" onClick={handleSend} disabled={!input.trim() || sendMut.isPending} data-testid="chat-send">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
