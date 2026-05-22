'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './PlexChat.module.css';

const PLEX_URL = process.env.NEXT_PUBLIC_PLEX_SIGNALS_URL || 'http://localhost:3002';

// ── Icons ──────────────────────────────────────────────────────────────────────
function PlexIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="#575afd" strokeWidth="1.8" />
      <path d="M8 12h8M12 8l4 4-4 4" stroke="#575afd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

// ── Simple markdown renderer (bold + links) ────────────────────────────────────
function renderText(text: string) {
  return text.split('\n').map((line, i) => {
    if (!line) return <br key={i} />;
    const parts = line.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
    return (
      <p key={i}>
        {parts.map((part, j) => {
          if (/^\*\*(.+)\*\*$/.test(part)) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
          const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
          if (linkMatch) {
            return (
              <a key={j} href={linkMatch[2]} target="_blank" rel="noopener noreferrer">
                {linkMatch[1]}
              </a>
            );
          }
          return part;
        })}
      </p>
    );
  });
}

// ── Message type ───────────────────────────────────────────────────────────────
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// ── PlexChat widget ────────────────────────────────────────────────────────────
export default function PlexChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Plex, your Liquiplex AI guide.\n\nAsk me about $Zi staking (~12% APR), trading on the DEX, how to get started, or our Zi Edge signal subscriptions.",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, open]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    setHistory((h) => [...h, { role: 'user', content: text }]);
    setInput('');
    setSending(true);

    try {
      // Admin token present (dev/testing) → gets elite signals AI
      // No token (production visitors) → gets sales/support AI from zi-edge-eliza
      const adminToken = process.env.NEXT_PUBLIC_PLEX_ADMIN_TOKEN;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;

      const res = await fetch(`${PLEX_URL}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: text,
          history: history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const reply: string = data?.data?.text || "Sorry, I couldn't get a response. Please try again.";
      setHistory((h) => [...h, { role: 'assistant', content: reply }]);
    } catch {
      setHistory((h) => [
        ...h,
        { role: 'assistant', content: 'Could not reach Plex right now. Please try again in a moment.' },
      ]);
    } finally {
      setSending(false);
    }
  }, [input, sending, history]);

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close Plex AI' : 'Open Plex AI'}
        title="Plex AI"
      >
        {open ? <CloseIcon /> : <PlexIcon />}
        <span className={styles.triggerLabel}>Plex AI</span>
      </button>

      {/* Chat panel */}
      {open && (
        <div className={styles.panel} role="dialog" aria-label="Plex AI Chat">
          {/* Header */}
          <div className={styles.header}>
            <PlexIcon />
            <div className={styles.headerText}>
              <span className={styles.headerTitle}>Plex</span>
              <span className={styles.headerSub}>Liquiplex AI · Zig3</span>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setOpen(false)}
              aria-label="Close Plex"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div className={styles.messages}>
            {history.map((msg, i) => (
              <div
                key={i}
                className={`${styles.msg} ${msg.role === 'user' ? styles.msgUser : styles.msgPlex}`}
              >
                {msg.role === 'assistant' && <span className={styles.msgAvatar}>P</span>}
                <div className={styles.msgBubble}>{renderText(msg.content)}</div>
              </div>
            ))}

            {sending && (
              <div className={`${styles.msg} ${styles.msgPlex}`}>
                <span className={styles.msgAvatar}>P</span>
                <div className={`${styles.msgBubble} ${styles.typing}`}>
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className={styles.inputRow}>
            <textarea
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about $Zi, staking, DEX, signals…"
              rows={1}
              maxLength={1000}
              disabled={sending}
            />
            <button
              type="button"
              className={styles.sendBtn}
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              aria-label="Send"
            >
              <SendIcon />
            </button>
          </div>

          <p className={styles.disclaimer}>Not financial advice · DYOR</p>
        </div>
      )}
    </>
  );
}
