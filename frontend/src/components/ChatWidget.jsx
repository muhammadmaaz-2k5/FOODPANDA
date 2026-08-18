'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { MessageSquare, Send, X, User, Store, Bike, ShieldAlert } from 'lucide-react';

export default function ChatWidget({ orderId, restaurantName, riderName }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('RESTAURANT'); // 'RESTAURANT' or 'RIDER'
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      if (res.data.success && res.data.data?.length > 0) {
        setConversations(res.data.data);
        
        // Find matching conversation based on active tab
        const matched = res.data.data.find(c => {
          if (activeTab === 'RESTAURANT') {
            return c.type === 'CUSTOMER_RESTAURANT' && (orderId ? c.orderId === orderId : true);
          } else {
            return c.type === 'CUSTOMER_RIDER' && (orderId ? c.orderId === orderId : true);
          }
        }) || res.data.data[0];

        setActiveConversation(matched);

        if (matched) {
          const msgRes = await api.get(`/chat/conversations/${matched.id}/messages`);
          if (msgRes.data.success) {
            setMessages(msgRes.data.data);
          }
        }
      }
    } catch (err) {
      console.error('Chat load error:', err.message);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
      setUnreadCount(0);
    }
  }, [orderId, isOpen, activeTab]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (msg.conversationId === activeConversation?.id) {
        setMessages((prev) => [...prev, msg]);
        setIsTyping(false);
      } else if (!isOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    const handleUserTyping = (data) => {
      if (data.conversationId === activeConversation?.id && data.userId !== user?.id) {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 2500);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
    };
  }, [socket, activeConversation, user, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    if (socket && activeConversation) {
      socket.emit('typing', {
        conversationId: activeConversation.id,
        userId: user?.id,
      });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConversation) return;

    try {
      setLoading(true);
      const text = inputMessage;
      setInputMessage('');
      const res = await api.post(`/chat/conversations/${activeConversation.id}/messages`, {
        body: text,
        type: 'TEXT',
      });
      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.data]);
      }
    } catch (err) {
      console.error('Failed to send message:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickPresets = [
    'Please add extra napkins & cutlery 🍴',
    'Please don’t ring the doorbell 🤫',
    'I’m waiting downstairs in the lobby 🏢',
    'Is the order on the way? 🛵',
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="relative foodpanda-btn px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-2.5 font-bold text-sm text-white cursor-pointer transition transform hover:scale-105"
        >
          <MessageSquare className="w-5 h-5" />
          <span>Live Support & Chat</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-white text-[#d70f64] text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-[#d70f64] animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      ) : (
        <div className="w-84 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[520px] animate-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#d70f64] to-[#b50b52] text-white flex items-center justify-between shadow-md">
            <div>
              <div className="flex items-center gap-1.5 font-black text-sm tracking-tight">
                <MessageSquare className="w-4 h-4" /> Live In-App Chat
              </div>
              <span className="text-[10px] text-rose-100 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Connected to WebSockets
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-white/20 text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Channel Tabs (Restaurant / Rider) */}
          <div className="flex border-b border-slate-200 bg-slate-100/70 p-1 gap-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('RESTAURANT')}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'RESTAURANT'
                  ? 'bg-white text-[#d70f64] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Store className="w-3.5 h-3.5" /> {restaurantName || 'Kitchen Staff'}
            </button>
            <button
              onClick={() => setActiveTab('RIDER')}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'RIDER'
                  ? 'bg-white text-[#d70f64] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Bike className="w-3.5 h-3.5" /> {riderName || 'Assigned Rider'}
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs space-y-2">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-[#d70f64]">
                  💬
                </div>
                <p className="font-bold text-slate-700">No messages yet</p>
                <p>Send a quick note or special instruction to the {activeTab === 'RESTAURANT' ? 'kitchen' : 'rider'}.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[78%] p-3 rounded-2xl text-xs font-medium ${
                        isMe
                          ? 'bg-[#d70f64] text-white rounded-br-none shadow-xs'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs'
                      }`}
                    >
                      {msg.body}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}

            {/* Real-time Typing Bubble */}
            {isTyping && (
              <div className="flex items-center gap-1.5 p-2 rounded-2xl bg-white border border-slate-200 w-20 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Preset Replies */}
          <div className="p-2 border-t border-slate-100 bg-white flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none text-[10px]">
            {quickPresets.map((preset, i) => (
              <button
                key={i}
                onClick={() => setInputMessage(preset)}
                className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-[#d70f64] transition cursor-pointer shrink-0"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              placeholder={`Message ${activeTab === 'RESTAURANT' ? 'Restaurant' : 'Rider'}...`}
              value={inputMessage}
              onChange={handleInputChange}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-[#d70f64]"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="p-2.5 rounded-xl bg-[#d70f64] text-white hover:bg-[#b50b52] disabled:opacity-40 transition cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
