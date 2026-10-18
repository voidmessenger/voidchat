import { useMemo, useRef, useState } from "react";
import {
  Activity, Archive, ArrowDownLeft, ArrowLeft, AudioLines, Bell,
  CheckCheck, ChevronDown, CircleHelp, LockKeyhole,
  MessageCircle, Mic, MoreHorizontal, Paperclip, Phone, Plus, Search,
  Send, Settings, ShieldCheck, Smile, Sparkles, Users, Video, X
} from "lucide-react";

type Chat = {
  id: number;
  name: string;
  handle: string;
  avatar: string;
  color: string;
  group?: boolean;
  online?: boolean;
  preview: string;
  time: string;
  unread?: number;
};
type Message = { id: number; from: "me" | "them"; text: string; time: string; reply?: string; reaction?: string };

const initialChats: Chat[] = [
  { id: 1, name: "Alex Morgan", handle: "@alexm", avatar: "A", color: "lilac", online: true, preview: "окей, увидимся позже", time: "09:42", unread: 2 },
  { id: 2, name: "NIGHT SHIFT", handle: "8 участников", avatar: "N", color: "blue", group: true, preview: "Mira: закинула демку", time: "09:35" },
  { id: 3, name: "Mira Sol", handle: "@mirasol", avatar: "M", color: "pink", online: true, preview: "🎧 новый трек уже здесь", time: "Вчера" },
  { id: 4, name: "Design room", handle: "12 участников", avatar: "D", color: "orange", group: true, preview: "You: выглядит отлично", time: "Вчера" },
  { id: 5, name: "Noah Williams", handle: "@noahw", avatar: "N", color: "green", preview: "голосовое сообщение", time: "Пн" }
];

const initialMessages: Record<number, Message[]> = {
  1: [
    { id: 1, from: "them", text: "ты уже посмотрел новый макет?", time: "09:38" },
    { id: 2, from: "me", text: "да, очень нравится направление с фиолетовым", time: "09:39", reaction: "💜" },
    { id: 3, from: "them", text: "окей, увидимся позже", time: "09:42" }
  ],
  2: [
    { id: 1, from: "them", text: "выложила обновлённую демку в папку", time: "09:31" },
    { id: 2, from: "me", text: "сейчас послушаю 👀", time: "09:33" },
    { id: 3, from: "them", text: "Mira: закинула демку", time: "09:35" }
  ],
  3: [{ id: 1, from: "them", text: "🎧 новый трек уже здесь", time: "Вчера" }],
  4: [{ id: 1, from: "me", text: "выглядит отлично", time: "Вчера" }],
  5: [{ id: 1, from: "them", text: "голосовое сообщение", time: "Пн" }]
};

function Avatar({ chat, small = false }: { chat: Chat; small?: boolean }) {
  return <div className={`avatar ${chat.color} ${small ? "small" : ""}`}>
    {chat.group ? <Users size={small ? 15 : 19} /> : chat.avatar}
    {chat.online && <span className="online-dot" />}
  </div>;
}

export default function App() {
  const [chats, setChats] = useState(initialChats);
  const [activeId, setActiveId] = useState(1);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "unread" | "groups">("all");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showDetails, setShowDetails] = useState(true);
  const [notice, setNotice] = useState("Демонстрационный режим · сервер ещё не подключён");
  const [searchOpen, setSearchOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeChat = chats.find(c => c.id === activeId) ?? chats[0];
  const activeMessages = messages[activeId] ?? [];
  const filteredChats = useMemo(() => chats.filter(c => {
    const matches = `${c.name} ${c.handle} ${c.preview}`.toLowerCase().includes(query.toLowerCase());
    return matches && (tab === "all" || (tab === "unread" && !!c.unread) || (tab === "groups" && c.group));
  }), [chats, query, tab]);

  function chooseChat(id: number) {
    setActiveId(id);
    setChats(old => old.map(c => c.id === id ? { ...c, unread: 0 } : c));
    setReplyTo(null);
  }
  function sendMessage(text = draft) {
    const clean = text.trim();
    if (!clean) return;
    const next: Message = { id: Date.now(), from: "me", text: clean, time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }), reply: replyTo?.text };
    setMessages(old => ({ ...old, [activeId]: [...(old[activeId] ?? []), next] }));
    setChats(old => old.map(c => c.id === activeId ? { ...c, preview: clean, time: "сейчас" } : c));
    setDraft("");
    setReplyTo(null);
    setNotice("Сообщение добавлено локально. Для доставки другим пользователям нужен сервер.");
  }
  function addReaction(message: Message) {
    setMessages(old => ({ ...old, [activeId]: (old[activeId] ?? []).map(m => m.id === message.id ? { ...m, reaction: m.reaction ? undefined : "💜" } : m) }));
  }
  function fileChosen(file?: File) {
    if (!file) return;
    sendMessage(`📎 ${file.name} (${Math.ceil(file.size / 1024)} КБ) — выбран локально`);
    setNotice("Файл не загружен на сервер. Реальная передача появится после настройки защищённого хранилища.");
  }
  function startCall(kind: "аудио" | "видео") {
    setNotice(`${kind === "аудио" ? "Аудиозвонок" : "Видеозвонок"} пока не подключён: потребуется WebRTC и сервер сигнализации.`);
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand-row">
        <div className="brand-mark"><MessageCircle size={21} strokeWidth={2.4} /></div>
        <div><div className="brand-name">VOID<span>CHAT</span></div><div className="brand-sub">PRIVATE SPACE</div></div>
        <button className="icon-btn top-more" aria-label="Дополнительно"><MoreHorizontal size={20}/></button>
      </div>

      <button className="profile-card" onClick={() => setNotice("Профиль пользователя появится после подключения авторизации.")}>
        <div className="avatar me-avatar">V<span className="online-dot"/></div>
        <div className="profile-copy"><strong>Void User</strong><span><i/> В сети</span></div>
        <ChevronDown size={16} className="muted-icon"/>
      </button>

      <div className="search-box">
        <Search size={17}/>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск чатов..." aria-label="Поиск чатов"/>
        <kbd>⌘ K</kbd>
      </div>

      <div className="section-head"><span>СООБЩЕНИЯ</span><button className="icon-btn" aria-label="Создать чат" onClick={() => setNotice("Поиск пользователей и создание чатов подключим следующим этапом.")}><Plus size={17}/></button></div>
      <div className="filter-tabs">
        <button className={tab === "all" ? "selected" : ""} onClick={() => setTab("all")}>Все</button>
        <button className={tab === "unread" ? "selected" : ""} onClick={() => setTab("unread")}>Непрочитанные</button>
        <button className={tab === "groups" ? "selected" : ""} onClick={() => setTab("groups")}>Группы</button>
      </div>

      <div className="chat-list">
        {filteredChats.map(chat => <button key={chat.id} className={`chat-item ${activeId === chat.id ? "active" : ""}`} onClick={() => chooseChat(chat.id)}>
          <Avatar chat={chat}/>
          <div className="chat-item-copy">
            <div className="chat-item-top"><strong>{chat.name}</strong><span>{chat.time}</span></div>
            <div className="chat-preview">{chat.preview}</div>
          </div>
          {!!chat.unread && <span className="unread-count">{chat.unread}</span>}
        </button>)}
        {filteredChats.length === 0 && <div className="empty-search">Ничего не найдено</div>}
      </div>

      <div className="sidebar-bottom">
        <div className="encryption-note"><div className="lock-bubble"><LockKeyhole size={15}/></div><div><strong>Твоё пространство</strong><span>E2EE ещё не активировано</span></div><span className="status-pip"/></div>
        <button className="nav-bottom" onClick={() => setNotice("Настройки появятся после реализации аккаунтов и серверной части.")}><Settings size={17}/> Настройки <span>⌘ ,</span></button>
        <button className="nav-bottom" onClick={() => setNotice("Справочный центр будет добавлен позже.")}><CircleHelp size={17}/> Помощь</button>
      </div>
    </aside>

    <main className="chat-main">
      <header className="chat-header">
        <button className="mobile-back icon-btn" aria-label="Назад"><ArrowLeft size={19}/></button>
        <Avatar chat={activeChat} small/>
        <div className="header-person"><strong>{activeChat.name}</strong><span>{activeChat.group ? activeChat.handle : activeChat.online ? "● В сети" : "Не в сети"}</span></div>
        <div className="header-actions">
          <button className="icon-btn" aria-label="Поиск по переписке" onClick={() => setSearchOpen(!searchOpen)}><Search size={19}/></button>
          <button className="icon-btn" aria-label="Аудиозвонок" onClick={() => startCall("аудио")}><Phone size={18}/></button>
          <button className="icon-btn" aria-label="Видеозвонок" onClick={() => startCall("видео")}><Video size={19}/></button>
          <div className="header-divider"/>
          <button className={`icon-btn ${showDetails ? "is-on" : ""}`} aria-label="Информация о чате" onClick={() => setShowDetails(!showDetails)}><Activity size={19}/></button>
        </div>
      </header>

      {searchOpen && <div className="inline-search"><Search size={16}/><input placeholder="Поиск в переписке (демо)" onChange={e => setNotice(`Поиск по сообщениям: ${e.target.value || "—"} (локальный прототип)`)} autoFocus/><button className="icon-btn" onClick={() => setSearchOpen(false)}><X size={16}/></button></div>}

      <div className="secure-banner"><ShieldCheck size={15}/><span>Сообщения защищены при передаче только после настройки инфраструктуры. <button onClick={() => setNotice("E2EE не реализовано. Не отправляй реальные секреты в этот прототип.")}>Подробнее</button></span></div>

      <section className="messages-area">
        <div className="date-divider"><span>СЕГОДНЯ</span></div>
        <div className="welcome-chip"><Sparkles size={14}/> Это начало вашей истории</div>
        {activeMessages.map(message => <div key={message.id} className={`message-row ${message.from === "me" ? "mine" : ""}`}>
          {message.from === "them" && <Avatar chat={activeChat} small/>}
          <div className="message-stack">
            {message.reply && <div className="reply-context"><span/>Ответ на: {message.reply}</div>}
            <div className={`message-bubble ${message.from === "me" ? "sent" : "received"}`}>
              {message.text}
              <div className="message-meta"><span>{message.time}</span>{message.from === "me" && <CheckCheck size={14}/>}</div>
              {message.reaction && <button className="reaction-pill" onClick={() => addReaction(message)}>{message.reaction} <span>1</span></button>}
            </div>
            <div className="message-tools">
              <button onClick={() => { setReplyTo(message); inputRef.current?.focus(); }} title="Ответить"><ArrowDownLeft size={13}/></button>
              <button onClick={() => addReaction(message)} title="Реакция"><Smile size={13}/></button>
            </div>
          </div>
        </div>)}
        <div className="typing-line"><span className="typing-dots"><i/><i/><i/></span> {activeChat.online ? `${activeChat.name.split(" ")[0]} может быть здесь` : "История переписки"}</div>
      </section>

      {replyTo && <div className="reply-bar"><div><strong>Ответ для сообщения</strong><span>{replyTo.text}</span></div><button className="icon-btn" onClick={() => setReplyTo(null)}><X size={16}/></button></div>}
      <div className="composer-wrap">
        <div className="composer">
          <button className="composer-icon" aria-label="Прикрепить файл" onClick={() => fileRef.current?.click()}><Paperclip size={19}/></button>
          <input ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder={`Написать ${activeChat.group ? "в группу" : "сообщение"}...`} aria-label="Текст сообщения"/>
          <input ref={fileRef} type="file" hidden onChange={e => fileChosen(e.target.files?.[0])}/>
          <button className="composer-icon voice-btn" aria-label="Голосовое сообщение" onClick={() => setNotice("Запись голосовых сообщений подключим через MediaRecorder; отправка пока недоступна.")}><Mic size={19}/></button>
          <button className="send-btn" aria-label="Отправить сообщение" onClick={() => sendMessage()}><Send size={17}/></button>
        </div>
        <div className="composer-hint"><span><LockKeyhole size={11}/> Не отправляй реальные секреты: E2EE пока не реализовано</span><span><kbd>ENTER</kbd> отправить</span></div>
      </div>
    </main>

    {showDetails && <aside className="details-panel">
      <div className="details-head"><span>ИНФОРМАЦИЯ</span><button className="icon-btn" onClick={() => setShowDetails(false)} aria-label="Закрыть"><X size={16}/></button></div>
      <div className="contact-card">
        <div className={`avatar contact-avatar ${activeChat.color}`}>{activeChat.group ? <Users size={27}/> : activeChat.avatar}{activeChat.online && <span className="online-dot"/>}</div>
        <h2>{activeChat.name}</h2><p>{activeChat.handle}</p>
        <div className="contact-actions">
          <button onClick={() => setNotice("Звонки будут доступны после настройки WebRTC.")}><Phone size={16}/><span>Звонок</span></button>
          <button onClick={() => setNotice("Поиск пользователей появится после подключения API.")}><Search size={16}/><span>Найти</span></button>
          <button onClick={() => setNotice("Уведомления настраиваются в следующем этапе.")}><Bell size={16}/><span>Звук</span></button>
        </div>
      </div>
      <div className="detail-section">
        <div className="detail-title">ОБЩАЯ ИНФОРМАЦИЯ <ChevronDown size={14}/></div>
        <div className="detail-row"><Users size={17}/><div><strong>{activeChat.group ? activeChat.handle : "Личный чат"}</strong><span>{activeChat.group ? "Участники группы" : "Персональный диалог"}</span></div></div>
        <div className="detail-row"><Archive size={17}/><div><strong>Медиа и файлы</strong><span>Пока нет загруженных файлов</span></div></div>
      </div>
      <div className="detail-section security-section">
        <div className="detail-title">БЕЗОПАСНОСТЬ <ChevronDown size={14}/></div>
        <div className="security-card"><div className="security-icon"><LockKeyhole size={17}/></div><div><strong>Сквозное шифрование</strong><span>Не настроено</span></div><span className="warning-dot"/></div>
        <p className="security-copy">Этот интерфейс — прототип. Не используй его для конфиденциальной переписки до реализации и независимой проверки криптографии.</p>
      </div>
      <div className="build-card"><div className="build-icon"><AudioLines size={17}/></div><div><strong>VOIDCHAT v0.1</strong><span>UI prototype · локальные данные</span></div></div>
    </aside>}

    <div className="toast" role="status"><span className="toast-dot"/>{notice}<button onClick={() => setNotice("Демонстрационный режим · сервер ещё не подключён")} aria-label="Сбросить уведомление"><X size={13}/></button></div>
  </div>;
}
