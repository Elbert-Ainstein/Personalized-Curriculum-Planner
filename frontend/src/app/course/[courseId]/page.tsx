"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import ChatMessage from "components/ChatMessage";
import ChatInput from "components/ChatInput";
import dynamic from "next/dynamic";
import Prism from "prismjs";
import "prismjs/themes/prism.css";
import "prismjs/components/prism-python";

interface Message {
  text: string;
  sender: "user" | "tutor";
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
const SimpleCodeEditor = dynamic(() => import("react-simple-code-editor"), { ssr: false, loading: () => <textarea className="w-full h-40 font-mono border rounded p-2" disabled value="Loading code editor..." /> });

export default function CourseDetailPage() {
  const guestId = "guest@student.com";
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentModuleId, setCurrentModuleId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [isTutorTyping, setIsTutorTyping] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("guest") === "true") {
      setIsGuest(true);
    }
  }, []);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if ((!session && !isGuest) || !courseId) return;
    setMessages([]);
    setCurrentModuleId(null);
    setShowCodeEditor(false);
    setCodeInput("");
    setIsLoading(true);
    setIsTutorTyping(true);
    const studentId = session?.user?.email || guestId;
    const startLesson = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/start_lesson_multi?course_id=${courseId}&student_id=${studentId}`);
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        await new Promise(res => setTimeout(res, 800));
        setCourseTitle(data.course_id ? data.course_id.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) : "Course");
        setMessages([{ text: data.message, sender: "tutor" }]);
        setCurrentModuleId(data.module_id);
        setShowCodeEditor(data.expects_code ?? false);
        if (data.question) {
          setMessages(prev => [...prev, { text: data.question, sender: "tutor" }]);
        }
      } catch (error) {
        setMessages([{ text: "Oops! I had a problem starting the lesson. Please refresh the page.", sender: "tutor" }]);
      } finally {
        setIsLoading(false);
        setIsTutorTyping(false);
      }
    };
    startLesson();
  }, [courseId, session, isGuest]);

  const addMessage = (text: string, sender: "user" | "tutor") => {
    setMessages(prev => [...prev, { text, sender }]);
  };

  const handleSendMessage = async (userMessage: string) => {
    if (!currentModuleId) return;
    addMessage(userMessage, "user");
    setIsLoading(true);
    setIsTutorTyping(true);
    const studentId = session?.user?.email || guestId;
    try {
      const response = await fetch(`${BACKEND_URL}/submit_answer_multi?course_id=${courseId}&student_id=${studentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_id: currentModuleId, answer: userMessage }),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      await new Promise(res => setTimeout(res, 800));
      addMessage(data.feedback, "tutor");
      if (data.next_module_id) {
        setCurrentModuleId(data.next_module_id);
        addMessage(data.next_explanation, "tutor");
        if (data.next_question) {
          addMessage(data.next_question, "tutor");
        }
        setShowCodeEditor(data.expects_code ?? false);
      } else {
        setCurrentModuleId(null);
        addMessage("You've finished the course! Great job!", "tutor");
        setShowCodeEditor(false);
      }
    } catch (error) {
      addMessage("Sorry, there was an error processing your answer. Please try again.", "tutor");
    } finally {
      setIsLoading(false);
      setIsTutorTyping(false);
    }
  };

  const studentEmail = session?.user?.email || (isGuest ? guestId : "");

  if (status === "loading") {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  if (!session && !isGuest) {
    router.push("/");
    return null;
  }

  return (
    <main className="flex h-screen bg-gradient-to-br from-gray-100 to-blue-100 justify-center items-center">
      <div className="flex flex-col w-full max-w-2xl h-[90vh] bg-white rounded-lg shadow-xl">
        <div className="p-4 bg-blue-600 text-white font-bold rounded-t-lg flex justify-between items-center">
          <button className="bg-gray-800 text-white px-3 py-1 rounded text-xs hover:bg-gray-700" onClick={() => router.push("/")}>Back</button>
          <h1 className="text-lg">{courseTitle}</h1>
          <span className="text-xs">{studentEmail}</span>
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
                  highlight={code => Prism.highlight(code, Prism.languages.python, "python")}
                  padding={10}
                  style={{ fontFamily: "monospace", fontSize: 16, minHeight: 160, border: "1px solid #ccc", borderRadius: 8, background: "#f9f9f9" }}
                />
              </div>
              <button
                className="bg-blue-500 text-white px-6 py-2 rounded font-semibold hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed mt-4 md:mt-0 md:self-end"
                disabled={isLoading || !codeInput.trim()}
                onClick={() => { handleSendMessage(codeInput); setCodeInput(""); }}
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