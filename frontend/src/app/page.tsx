'use client'; // This is a Client Component, as it uses state and effects

import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from '../../components/ChatMessage';
import ChatInput from '../../components/ChatInput';
import dynamic from 'next/dynamic';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-python';

// Define the structure of a message
interface Message {
  text: string;
  sender: 'user' | 'tutor';
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

// Dynamically import react-simple-code-editor if available
const SimpleCodeEditor = dynamic(() => import('react-simple-code-editor'), { ssr: false, loading: () => <textarea className="w-full h-40 font-mono border rounded p-2" disabled value="Loading code editor..." /> });

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentModuleId, setCurrentModuleId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // Add state for code editor
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('python-basics');

  // Function to add a new message to the state
  const addMessage = (text: string, sender: 'user' | 'tutor') => {
    setMessages(prev => [...prev, { text, sender }]);
  };

  // Typing effect state
  const [isTutorTyping, setIsTutorTyping] = useState(false);

  // Effect to scroll to the bottom of the chat box when new messages are added
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch courses on mount
  useEffect(() => {
    fetch(`${BACKEND_URL}/courses`)
      .then(res => res.json())
      .then(data => {
        setCourses(data);
        if (data.length > 0) setSelectedCourse(data[0].id);
      });
  }, []);

  // Reset chat and start lesson when course changes
  useEffect(() => {
    if (!selectedCourse) return;
    setMessages([]);
    setCurrentModuleId(null);
    setShowCodeEditor(false);
    setCodeInput('');
    setIsLoading(true);
    setIsTutorTyping(true);
    const startLesson = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/start_lesson_multi?course_id=${selectedCourse}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        await new Promise(res => setTimeout(res, 800));
        addMessage(data.message, 'tutor');
        setCurrentModuleId(data.module_id);
        setShowCodeEditor(data.expects_code ?? false);
        // Always show the assignment/question after the explanation if available
        if (data.question) {
          addMessage(data.question, 'tutor');
        } else if (selectedCourse === 'python-basics' && data.expects_code) {
          addMessage("Now, can you try to write the code for that? Give it a shot!", 'tutor');
        }
      } catch (error) {
        console.error('Error starting lesson:', error);
        addMessage('Oops! I had a problem starting the lesson. Please refresh the page.', 'tutor');
      } finally {
        setIsLoading(false);
        setIsTutorTyping(false);
      }
    };
    startLesson();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse]);

  // Function to handle sending a message from the user
  const handleSendMessage = async (userMessage: string) => {
    if (!currentModuleId) return;
    addMessage(userMessage, 'user');
    setIsLoading(true);
    setIsTutorTyping(true);
    try {
      const response = await fetch(`${BACKEND_URL}/submit_answer_multi?course_id=${selectedCourse}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_id: currentModuleId, answer: userMessage }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      await new Promise(res => setTimeout(res, 800));
      addMessage(data.feedback, 'tutor');
      if (data.next_module_id) {
        setCurrentModuleId(data.next_module_id);
        addMessage(data.next_explanation, 'tutor');
        if (data.next_question) {
          addMessage(data.next_question, 'tutor');
        }
        setShowCodeEditor(data.expects_code ?? false);
      } else {
        setCurrentModuleId(null);
        addMessage("You've finished the course! Great job!", 'tutor');
        setShowCodeEditor(false);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      addMessage('Sorry, there was an error processing your answer. Please try again.', 'tutor');
    } finally {
      setIsLoading(false);
      setIsTutorTyping(false);
    }
  };

  return (
    <main className="flex h-screen bg-gray-100 justify-center items-center">
      <div className="flex flex-col w-full max-w-2xl h-[90vh] bg-white rounded-lg shadow-xl">
        <div className="p-4 bg-blue-600 text-white text-center font-bold rounded-t-lg">
          <h1>AI Python Tutor</h1>
          <div className="mt-2">
            <label htmlFor="course-select" className="mr-2">Select Course:</label>
            <select
              id="course-select"
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              className="p-1 rounded border text-black"
            >
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div ref={chatBoxRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
          {messages.map((msg, index) => (
            <ChatMessage key={index} text={msg.text} sender={msg.sender} />
          ))}
          {isTutorTyping && (
            <div className="self-start">
              <div className="p-3 rounded-lg bg-gray-200 text-gray-500 animate-pulse">
                Tutor is typing<span className="animate-blink">...</span>
              </div>
            </div>
          )}
        </div>

        {showCodeEditor ? (
          <div className="w-full border-t border-gray-200 bg-gray-50 p-4 flex flex-col">
            <label className="mb-2 font-semibold">Write your code below:</label>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 min-w-0">
                <SimpleCodeEditor
                  value={codeInput}
                  onValueChange={setCodeInput}
                  highlight={code => Prism.highlight(code, Prism.languages.python, 'python')}
                  padding={10}
                  style={{ fontFamily: 'monospace', fontSize: 16, minHeight: 160, border: '1px solid #ccc', borderRadius: 8, background: '#f9f9f9' }}
                />
              </div>
              <button
                className="bg-blue-500 text-white px-6 py-2 rounded font-semibold hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed mt-4 md:mt-0 md:self-end"
                disabled={isLoading || !codeInput.trim()}
                onClick={() => { handleSendMessage(codeInput); setCodeInput(''); }}
              >
                Submit Code
              </button>
            </div>
          </div>
        ) : (
          <ChatInput onSendMessage={handleSendMessage} disabled={isLoading || !currentModuleId} />
        )}
      </div>
    </main>
  );
}