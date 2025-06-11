'use client'; // This is a Client Component, as it uses state and effects

import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from '../../components/ChatMessage';
import ChatInput from '../../components/ChatInput';

// Define the structure of a message
interface Message {
  text: string;
  sender: 'user' | 'tutor';
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentModuleId, setCurrentModuleId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // Function to add a new message to the state
  const addMessage = (text: string, sender: 'user' | 'tutor') => {
    setMessages(prev => [...prev, { text, sender }]);
  };

  // Effect to scroll to the bottom of the chat box when new messages are added
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  // Effect to start the lesson when the component mounts
  useEffect(() => {
    const startLesson = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${BACKEND_URL}/start_lesson`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        addMessage(data.message, 'tutor');
        setCurrentModuleId(data.module_id);
        addMessage("Now, can you try to write the code for that? Give it a shot!", 'tutor');

      } catch (error) {
        console.error('Error starting lesson:', error);
        addMessage('Oops! I had a problem starting the lesson. Please refresh the page.', 'tutor');
      } finally {
        setIsLoading(false);
      }
    };

    startLesson();
  }, []); // The empty array [] means this effect runs only once on mount

  // Function to handle sending a message from the user
  const handleSendMessage = async (userMessage: string) => {
    if (!currentModuleId) return;

    addMessage(userMessage, 'user');
    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/submit_answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_id: currentModuleId, answer: userMessage }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();

      // 1. Show feedback on the user's answer
      addMessage(data.feedback, 'tutor');

      // 2. If there's a next module, present it
      if (data.next_module_id) {
        setCurrentModuleId(data.next_module_id);
        addMessage(data.next_explanation, 'tutor');
        if (data.next_question) {
          addMessage(data.next_question, 'tutor');
        }
      } else {
        // Course is finished
        setCurrentModuleId(null);
        addMessage("You've finished the course! Great job!", 'tutor');
      }

    } catch (error) {
      console.error('Error submitting answer:', error);
      addMessage('Sorry, there was an error processing your answer. Please try again.', 'tutor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex h-screen bg-gray-100 justify-center items-center">
      <div className="flex flex-col w-full max-w-2xl h-[90vh] bg-white rounded-lg shadow-xl">
        <div className="p-4 bg-blue-600 text-white text-center font-bold rounded-t-lg">
          <h1>AI Python Tutor</h1>
        </div>
        
        <div ref={chatBoxRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
          {messages.map((msg, index) => (
            <ChatMessage key={index} text={msg.text} sender={msg.sender} />
          ))}
          {isLoading && messages.length > 0 && (
            <div className="self-start">
              <div className="p-3 rounded-lg bg-gray-200 text-gray-500">
                Tutor is typing...
              </div>
            </div>
          )}
        </div>

        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading || !currentModuleId} />
      </div>
    </main>
  );
}