'use client';

import { useEffect, useRef, useState } from 'react';
import Markdown from '@/app/components/Markdown';
import Citations from '@/app/components/Citations';

const EXAMPLES = [
  'Pano kliması seçerken nelere dikkat edilmeli?',
  'Evaporatif soğutma nasıl çalışır?',
  'Fan coil termostatı ne işe yarar?',
];

export default function ChatBox() {
  const [messages, setMessages] = useState([]); // {role:'user'|'assistant', text, citations?}
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setError('');
    const history = [...messages, { role: 'user', text: q }];
    setMessages(history);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Bir hata oluştu. Lütfen tekrar deneyin.');
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: data.answer, citations: data.citations },
      ]);
    } catch (err) {
      setError(err.message);
      // Başarısız kullanıcı mesajını koru; kullanıcı tekrar gönderebilsin.
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const started = messages.length > 0;

  return (
    <div className="ks-chat">
      {started ? (
        <div className="ks-chat-head">
          <span className="ks-chat-title">❄️ KlimaSun Asistan</span>
          <button
            type="button"
            className="ks-chat-reset"
            onClick={() => {
              setMessages([]);
              setError('');
              setInput('');
            }}
          >
            ↻ Yeni sohbet
          </button>
        </div>
      ) : (
        <div className="ks-chat-intro">
          <p>
            Bir soru yazın; asistan yüklü teknik dokümanlardan kaynak göstererek cevaplar.
            <b> Ek bilgi sorarsa yanıtlayıp sohbete devam edebilirsiniz.</b>
          </p>
          <div className="ks-chat-examples">
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" className="ks-chat-chip" onClick={() => send(ex)}>
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {started && (
        <div className="ks-chat-msgs">
          {messages.map((m, i) =>
            m.role === 'user' ? (
              <div className="ks-msg ks-msg-user" key={i}>
                <div className="ks-msg-bubble">{m.text}</div>
              </div>
            ) : (
              <div className="ks-msg ks-msg-bot" key={i}>
                <div className="ks-msg-card">
                  <div className="answer-body">
                    <Markdown>{m.text}</Markdown>
                  </div>
                  <Citations citations={m.citations} />
                </div>
              </div>
            ),
          )}
          {loading && (
            <div className="ks-msg ks-msg-bot">
              <div className="ks-msg-card ks-msg-typing">
                <span className="ks-spin" aria-hidden="true" /> Dokümanlar taranıyor…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}

      {error && (
        <div className="ks-ask-error" role="alert">
          {error}
        </div>
      )}

      <form
        className="ks-chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={started ? 'Yanıtınızı yazın veya yeni bir soru sorun…' : 'Sorunuzu yazın…'}
          aria-label="Mesaj"
          maxLength={2000}
          className="ks-ask-input"
        />
        <button type="submit" className="ks-ask-btn" disabled={loading || !input.trim()}>
          {loading ? <span className="ks-spin" aria-hidden="true" /> : 'GÖNDER'}
        </button>
      </form>
      <p className="ks-chat-note">
        Cevaplar yalnızca yüklenen teknik dokümanlara dayanır ve kaynak gösterir.
      </p>
    </div>
  );
}
