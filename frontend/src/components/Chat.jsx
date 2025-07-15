import React, { useState, useContext, useEffect, useRef } from 'react';
import { chatContext } from '../chatReducer';
import socket from '../Socket';
import { useNavigate } from 'react-router-dom';

export const Chat = () => {
  const { state, dispatch } = useContext(chatContext);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Restore roomId and userName from localStorage if missing
  useEffect(() => {
    if (!state.roomId) {
      const storedRoomId = localStorage.getItem('roomId');
      if (storedRoomId) {
        dispatch({ type: 'JOIN_ROOM', payload: storedRoomId });
      }
    }
    if (!state.userName) {
      const storedUserName = localStorage.getItem('userName');
      if (storedUserName) {
        dispatch({ type: 'SET_USERNAME', payload: storedUserName });
      }
    }
  }, [state.roomId, state.userName, dispatch]);

  // Join room on mount if info is available
  useEffect(() => {
    if (state.roomId && state.userName) {
      socket.emit('join-room', { roomId: state.roomId, userName: state.userName });
    }
  }, [state.roomId, state.userName]);

  // Listen for messages and history
  useEffect(() => {
    socket.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    socket.on('room-joined', ({ messages }) => {
      setMessages(messages || []);
    });
    return () => {
      socket.off('message');
      socket.off('room-joined');
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && state.roomId) {
      socket.emit('send-message', {
        roomId: state.roomId,
        message,
        sender: state.userName,
      });
      setMessage('');
    }
  };

  // Save roomId to localStorage when it changes
  useEffect(() => {
    if (state.roomId) {
      localStorage.setItem('roomId', state.roomId);
    }
  }, [state.roomId]);

  useEffect(() => {
    socket.on('leader-left', () => {
      alert('The leader has left. You will be redirected to Home.');
      navigate('/Home');
    });
    return () => {
      socket.off('leader-left');
    };
  }, [navigate]);

  useEffect(() => {
    socket.on('room-join-error', (msg) => {
      alert(msg);
      navigate('/Home');
    });
    return () => {
      socket.off('room-join-error');
    };
  }, [navigate]);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <h1 className="text-3xl font-bold mb-4">
          Room: <span className="text-blue-400">{state.roomId}</span>
        </h1>
        <div className="space-y-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === state.userName ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.sender === state.userName
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-100'
                }`}
              >
                <span className="font-semibold">{msg.sender}: </span>
                <span>{msg.text}</span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <form
        onSubmit={handleSendMessage}
        className="flex items-center bg-gray-800 p-4"
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-gray-700 text-gray-100 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 border-none outline-none"
        />
        <button
          type="submit"
          className="ml-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold transition"
        >
          Send
        </button>
      </form>
    </div>
  );
};
