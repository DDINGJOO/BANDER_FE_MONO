import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  type ChatMessageResponse,
  type ChatRoomResponse,
  type ChatRoomType,
  getChatMessages,
  getChatRoomDetail,
  getMyChatRooms,
  markAsRead,
  sendMessage,
} from '../api/chat';
import { fetchVendorDetail, type VendorDetailDto } from '../api/spaces';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { SearchIcon } from '../components/shared/Icons';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { loadAuthSession, saveAuthSession } from '../data/authSession';
import {
  type ChatVendorPanel,
  chatMessageToUiMessage,
  chatRoomToThread,
  resolveChatPageModel,
} from '../data/chatPage';
import { useChatWebSocket } from '../hooks/useChatWebSocket';

function CameraGlyph24() {
  return (
    <svg aria-hidden="true" fill="none" height="24" viewBox="0 0 24 24" width="24">
      <path
        d="M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M4 8.5h2.2L7.8 6h8.4l1.6 2.5H20a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18V10A1.5 1.5 0 0 1 4 8.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function SendGlyph24() {
  return (
    <svg aria-hidden="true" fill="none" height="24" viewBox="0 0 24 24" width="24">
      <path
        d="M4.4 12.2 19.2 5.4c.5-.2.8.4.4.8l-6.3 12.4c-.2.4-.8.4-1-.1l-1.9-5.7-5.1-1.6c-.5-.1-.6-.8-.1-1z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function MoreGlyph30() {
  return (
    <svg aria-hidden="true" fill="none" height="30" viewBox="0 0 30 30" width="30">
      <circle cx="15" cy="8" fill="currentColor" r="1.5" />
      <circle cx="15" cy="15" fill="currentColor" r="1.5" />
      <circle cx="15" cy="22" fill="currentColor" r="1.5" />
    </svg>
  );
}

const FALLBACK_PANEL: ChatVendorPanel = {
  name: '',
  statusLine: '',
  stats: [],
};

export function ChatPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const authSession = loadAuthSession();
  const isAuthenticated = Boolean(authSession);
  const currentUserId = authSession?.userId ?? 0;

  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);
  const [chatFilter, setChatFilter] = useState<'vendor' | 'personal'>('personal');

  // API state
  const [rooms, setRooms] = useState<ChatRoomResponse[]>([]);
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [vendorDetail, setVendorDetail] = useState<VendorDetailDto | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const activeRoomId = searchParams.get('t') ?? null;

  const filteredSuggestions = HEADER_SEARCH_KEYWORD_SUGGESTIONS.filter((item) =>
    item.toLowerCase().includes(headerSearchQuery.toLowerCase()),
  );

  const onHeaderSearchSubmit = useCallback(
    (value: string) => {
      const q = value.trim();
      if (!q) return;
      navigate(`/search?q=${encodeURIComponent(q)}`);
    },
    [navigate],
  );

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?returnTo=${encodeURIComponent(`/chat?${searchParams.toString()}`)}`, {
        replace: true,
      });
    }
  }, [isAuthenticated, navigate, searchParams]);

  // Close header search on outside click
  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!headerSearchRef.current?.contains(event.target as Node)) {
        setHeaderSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  // 전체 채팅방 로드 (클라이언트에서 필터링)
  const [allRooms, setAllRooms] = useState<ChatRoomResponse[]>([]);
  useEffect(() => {
    if (!isAuthenticated || !authSession) return;
    const savedSession = authSession;
    setLoading(true);
    getMyChatRooms()
      .then((page) => {
        setAllRooms(page.content);
        setLoading(false);
        // activeRoomId가 있으면 해당 방의 필터로 자동 전환
        if (activeRoomId) {
          const targetRoom = page.content.find((r) => String(r.chatRoomId) === activeRoomId);
          if (targetRoom) {
            setChatFilter(targetRoom.chatRoomType === 'VENDOR' ? 'vendor' : 'personal');
          }
        }
      })
      .catch((err: unknown) => {
        console.error('[ChatPage] getMyChatRooms failed:', err);
        saveAuthSession(savedSession);
        setLoading(false);
      });
  }, [isAuthenticated]);

  // 클라이언트 필터링
  useEffect(() => {
    const filterType = chatFilter === 'vendor' ? 'VENDOR' : 'PERSONAL';
    const filtered = allRooms.filter((r) => r.chatRoomType === filterType);
    setRooms(filtered);
    // 활성 방이 현재 필터에 없으면 첫 번째 방 선택
    if (filtered.length > 0 && !filtered.some((r) => String(r.chatRoomId) === activeRoomId)) {
      const next = new URLSearchParams(searchParams);
      next.set('t', String(filtered[0].chatRoomId));
      setSearchParams(next);
    }
  }, [allRooms, chatFilter]);

  // Load messages when active room changes
  useEffect(() => {
    if (!activeRoomId) {
      setMessages([]);
      return;
    }
    getChatMessages(activeRoomId)
      .then((page) => {
        // 백엔드는 DESC(최신 먼저) 반환 → reverse해서 오래된 것이 위, 최신이 아래
        setMessages([...page.items].reverse());
      })
      .catch((err) => {
        console.error('[ChatPage] getChatMessages failed:', err);
        setMessages([]);
      });
    markAsRead(activeRoomId).catch((err) => {
      console.error('[ChatPage] markAsRead failed:', err);
    });
  }, [activeRoomId]);

  // Load vendor detail for vendor-type rooms
  useEffect(() => {
    const room = rooms.find((r) => String(r.chatRoomId) === activeRoomId) ?? null;
    if (room?.chatRoomType === 'VENDOR' && room.vendorSlug) {
      fetchVendorDetail(room.vendorSlug)
        .then((dto) => setVendorDetail(dto))
        .catch(() => setVendorDetail(null));
    } else {
      setVendorDetail(null);
    }
  }, [activeRoomId, rooms]);

  // WebSocket: real-time message updates
  useChatWebSocket(activeRoomId, (msg) => {
    setMessages((prev) => [...prev, msg]);
  });

  // 메시지 변경 시 맨 아래로 자동 스크롤
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const setThread = (roomId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('t', roomId);
    next.delete('empty');
    setSearchParams(next);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !activeRoomId) return;
    try {
      const msg = await sendMessage(activeRoomId, { content: inputValue.trim() });
      setMessages((prev) => [...prev, msg]);
      setInputValue('');
    } catch (err) {
      console.error('[ChatPage] sendMessage failed:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  // Derive UI model from API data
  const threads = rooms.map(chatRoomToThread);
  // chatRoomId는 number/bigint지만 URL param은 string이므로 String() 비교
  const activeRoom = rooms.find((r) => String(r.chatRoomId) === activeRoomId) ?? null;
  const partnerNickname = activeRoom?.partnerNickname ?? undefined;

  const uiMessages = messages.map((msg) =>
    chatMessageToUiMessage(msg, currentUserId, partnerNickname),
  );

  const showEmptyPrompt = uiMessages.length === 0;

  // 활성 채팅방의 상대방/업체 정보를 패널에 표시
  const panel: ChatVendorPanel = activeRoom
    ? activeRoom.chatRoomType === 'VENDOR' && vendorDetail
      ? {
          name: vendorDetail.name,
          statusLine: '',
          stats: [],
          description: vendorDetail.description ?? undefined,
          tags: vendorDetail.hashTags.length > 0 ? vendorDetail.hashTags : undefined,
        }
      : {
          name: activeRoom.partnerNickname ?? '상대방',
          statusLine: '',
          stats: [],
        }
    : FALLBACK_PANEL;

  const threadListTitle = loading
    ? '불러오는 중...'
    : rooms.length > 0
      ? `${rooms.length}개의 채팅`
      : '0개의 채팅';

  const displayThreads = threads;
  const displayActiveThreadId = activeRoomId ?? (displayThreads[0]?.id ?? '');

  // 오늘 날짜를 KST로 표시
  const todayLabel = new Date().toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: '2-digit',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <main className="chat-page">
      <HomeHeader
        authenticated
        filteredSuggestions={filteredSuggestions}
        onGuestCta={() => navigate('/login')}
        onSearchChange={(value) => {
          setHeaderSearchQuery(value);
          setHeaderSearchOpen(Boolean(value.trim()));
        }}
        onSearchClear={() => {
          setHeaderSearchQuery('');
          setHeaderSearchOpen(false);
        }}
        onSearchFocus={() => setHeaderSearchOpen(Boolean(headerSearchQuery.trim()))}
        onSearchSubmit={onHeaderSearchSubmit}
        onSuggestionSelect={(value) => {
          setHeaderSearchOpen(false);
          onHeaderSearchSubmit(value);
        }}
        searchOpen={headerSearchOpen}
        searchQuery={headerSearchQuery}
        searchRef={headerSearchRef}
      />

      <h1 className="visually-hidden">채팅</h1>
      <div className="chat-page__shell">
        <aside className="chat-page__sidebar" aria-label="채팅 목록">
          <div className="chat-page__segment" role="tablist" aria-label="채팅 구분">
            <button
              type="button"
              role="tab"
              aria-selected={chatFilter === 'vendor'}
              className={`chat-page__segment-btn${chatFilter === 'vendor' ? ' chat-page__segment-btn--active' : ''}`}
              onClick={() => setChatFilter('vendor')}
            >
              업체
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={chatFilter === 'personal'}
              className={`chat-page__segment-btn${chatFilter === 'personal' ? ' chat-page__segment-btn--active' : ''}`}
              onClick={() => setChatFilter('personal')}
            >
              개인
            </button>
          </div>

          <label className="chat-page__search">
            <SearchIcon />
            <input className="chat-page__search-input" placeholder="채팅방 검색" type="search" />
          </label>

          <p className="chat-page__list-title">{threadListTitle}</p>

          <ul className="chat-page__thread-list">
            {displayThreads.map((thread) => {
              const active = thread.id === displayActiveThreadId;
              return (
                <li key={thread.id}>
                  <button
                    type="button"
                    className={`chat-page__thread${active ? ' chat-page__thread--active' : ''}`}
                    onClick={() => setThread(thread.id)}
                  >
                    <span className="chat-page__thread-avatar" aria-hidden />
                    <span className="chat-page__thread-body">
                      <span className="chat-page__thread-title">{thread.title}</span>
                      <span className="chat-page__thread-preview">{thread.preview}</span>
                    </span>
                    <span className="chat-page__thread-meta">
                      <span className="chat-page__thread-time">{thread.timeLabel}</span>
                      {thread.unread != null ? (
                        <span className="chat-page__thread-badge">
                          {thread.unreadOverflow ? '99+' : thread.unread}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="chat-page__center-card">
          <section className="chat-page__main-col" aria-label="대화">
            <p className="chat-page__date-pill">{todayLabel}</p>

            <div className="chat-page__messages" ref={messagesContainerRef}>
              {showEmptyPrompt ? (
                <div className="chat-page__empty">
                  <div className="chat-page__empty-illu" aria-hidden />
                  <p className="chat-page__empty-text">대화를 시작해볼까요?</p>
                </div>
              ) : (
                <div className="chat-page__bubble-stack">
                  {uiMessages.map((msg) =>
                    msg.kind === 'out' ? (
                      <div className="chat-page__row chat-page__row--out" key={msg.id}>
                        <div className="chat-page__out-cluster">
                          <span className="chat-page__msg-time">{msg.time}</span>
                          <div className="chat-page__bubble chat-page__bubble--out">
                            {msg.lines.map((line, li) => (
                              <p key={`${msg.id}-l${li}`}>{line}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="chat-page__row chat-page__row--in" key={msg.id}>
                        <span className="chat-page__in-avatar" aria-hidden />
                        <div className="chat-page__in-block">
                          <p className="chat-page__in-name">{msg.senderName}</p>
                          <div className="chat-page__in-line">
                            <div className="chat-page__bubble chat-page__bubble--in">
                              <p>{msg.text}</p>
                            </div>
                            <span className="chat-page__msg-time chat-page__msg-time--in">
                              {msg.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>

            <footer className="chat-page__composer">
              <button type="button" className="chat-page__composer-camera" aria-label="사진 첨부">
                <CameraGlyph24 />
              </button>
              <div className="chat-page__composer-input-wrap">
                <input
                  className="chat-page__composer-input"
                  placeholder="메세지를 입력해주세요."
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="button"
                  className="chat-page__composer-send"
                  aria-label="보내기"
                  onClick={handleSend}
                >
                  <SendGlyph24 />
                </button>
              </div>
            </footer>
          </section>

          <aside className="chat-page__vendor-col" aria-label="상대 정보">
            <div className="chat-page__vendor-top">
              <span className="chat-page__vendor-avatar" aria-hidden />
              <button type="button" className="chat-page__vendor-more" aria-label="더보기">
                <MoreGlyph30 />
              </button>
            </div>
            <div className="chat-page__vendor-id">
              <p className="chat-page__vendor-name">{panel.name}</p>
              <p className="chat-page__vendor-status">{panel.statusLine}</p>
            </div>
            <hr className="chat-page__vendor-rule" />
            <div className="chat-page__vendor-stats">
              {panel.stats.map((row) => (
                <div className="chat-page__vendor-stat-row" key={row.label}>
                  <span>{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
            </div>
            {panel.addressLine ? (
              <p className="chat-page__vendor-address">{panel.addressLine}</p>
            ) : null}
            {panel.ratingLabel ? (
              <p className="chat-page__vendor-rating">{panel.ratingLabel}</p>
            ) : null}
            {panel.description ? <p className="chat-page__vendor-desc">{panel.description}</p> : null}
            {panel.tags && panel.tags.length > 0 ? (
              <div className="chat-page__vendor-tags">
                {panel.tags.map((tag) => (
                  <span className="chat-page__vendor-tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </aside>
        </div>
      </div>

      <HomeFooter />
    </main>
  );
}
