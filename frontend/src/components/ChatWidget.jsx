'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { MessageSquare, Send, X, User, Store } from 'lucide-react';

export default function ChatWidget({ orderId, restaurantName }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchChat = async () => {
    try {
      const res = await api.get('/chat/conversations');
      if (res.data.success && res.data.data?.length > 0) {
        // Find conversation for this order or take first
        const conv = res.data.data.find((c) => c.orderId === orderId) || res.data.data[0];
        setConversation(conv);
        if (conv) {
          const msgRes = await api.get(`/chat/conversations/${conv.id}/messages`);
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
    if (orderId && isOpen) {
      fetchChat();
    }
  }, [orderId, isOpen]);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', (msg) => {
      if (msg.conversationId === conversation?.id) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off('new_message');
    };
  }, [socket, conversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !conversation) return;

    try {
      setLoading(true);
      const text = inputMessage;
      setInputMessage('');
      const res = await api.post(`/chat/conversations/${conversation.id}/messages`, {
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

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="foodpanda-btn px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-2.5 font-bold text-sm text-white cursor-pointer transition transform hover:scale-105"
        >
          <MessageSquare className="w-5 h-5" /> Chat with {restaurantName || 'Restaurant'}
        </button>
      ) : (
        <div className="w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[480px] animate-in slide-in-from-bottom-5 duration-200">
          {/* Chat Header */}
          <div className="p-4 bg-[#d70f64] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              <div>
                <h4 className="font-bold text-sm leading-tight">{restaurantName || 'Restaurant Support'}</h4>
                <span className="text-[10px] text-rose-100 flex items-center gap-1">● Online</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-white/20 text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center p-6 text-slate-400 text-xs">
                Send a message to the kitchen or rider regarding special requests.
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
                      className={`max-w-[75%] p-3 rounded-2xl text-xs font-medium ${
                        isMe
                          ? 'bg-[#d70f64] text-white rounded-br-none'
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
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-[#d70f64]"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="p-2.5 rounded-xl bg-[#d70f64] text-white hover:bg-[#b50b52] disabled:opacity-40 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
