import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
  text: string;
  sender: 'user' | 'tutor';
}

const ChatMessage: React.FC<ChatMessageProps> = ({ text, sender }) => {
  const messageClass = sender === 'user'
    ? 'bg-blue-500 text-white self-end'
    : 'bg-gray-200 text-gray-800 self-start';

  return (
    <div className={`p-3 rounded-lg max-w-[80%] break-words ${messageClass} prose prose-sm max-w-none`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: {
            node?: any;
            inline?: boolean;
            className?: string;
            children?: React.ReactNode;
            [key: string]: any;
          }) {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <code
                className="block w-full bg-gray-800 text-white p-3 my-2 rounded-md overflow-x-auto"
                {...props}
              >
                {children}
              </code>
            ) : (
              <code className="bg-gray-300 text-red-600 px-1 rounded" {...props}>
                {children}
              </code>
            );
          },
          p({ node, children, ...props }: { node?: any; children?: React.ReactNode; [key: string]: any }) {
            return <p className="mb-0" {...props}>{children}</p>;
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};

export default ChatMessage;