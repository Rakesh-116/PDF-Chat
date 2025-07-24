"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Doc {
  pageContent?: string;
  metadata?: {
    loc?: {
      pageNumber?: number;
    };
    source?: string;
    bookName?: string;
  };
}

interface IMessage {
  role: "assistant" | "user";
  content?: string;
  documents?: Doc[];
}

const ChatComponent: React.FC = () => {
  const [message, setMessage] = React.useState<string>("");
  const [messages, setMessages] = React.useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const handleSendChatMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage(""); // Clear input immediately
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch(
        `http://localhost:8000/chat?message=${encodeURIComponent(userMessage)}`
      );
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          documents:
            data.results?.map((res: any) => ({
              pageContent: res.content || res.pageContent,
              metadata: res.metadata || {},
            })) || [],
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChatMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <h1 className="text-xl font-semibold text-gray-800">Document Chat</h1>
        <p className="text-sm text-gray-600">
          Ask questions about your uploaded documents
        </p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            <p>
              Start a conversation by asking questions about your documents!
            </p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-3xl ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-800"
              } rounded-lg p-4 shadow-sm`}
            >
              {/* Message Content */}
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Source Documents */}
              {msg.documents && msg.documents.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Sources:
                  </p>
                  <div className="space-y-2">
                    {msg.documents.map((doc, docIndex) => (
                      <div
                        key={docIndex}
                        className="bg-gray-50 p-3 rounded text-sm"
                      >
                        <div className="text-xs text-gray-500 mb-1">
                          📄 {doc.metadata?.bookName || "Unknown Document"}
                          {doc.metadata?.loc?.pageNumber &&
                            ` - Page ${doc.metadata.loc.pageNumber}`}
                        </div>
                        <div className="text-gray-700 line-clamp-3">
                          {doc.pageContent?.substring(0, 200)}...
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Container */}
      <div className="bg-white border-t p-4">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your documents..."
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendChatMessage}
            disabled={!message.trim() || isLoading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
