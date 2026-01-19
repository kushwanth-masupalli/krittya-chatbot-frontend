import { useState, useRef, useEffect } from 'react';
import { X, MessageCircle, ChevronLeft, Send, Loader2 } from 'lucide-react';
import { knowledgeBase } from './knowledgeBase';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationStack, setConversationStack] = useState([]);
  const [currentView, setCurrentView] = useState('root');
  const [customQuery, setCustomQuery] = useState('');
  const [customHistory, setCustomHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCustomMode, setIsCustomMode] = useState(false);

  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (!chatContainerRef.current) return;

    if (isCustomMode) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    } else {
      chatContainerRef.current.scrollTop = 0;
    }
  }, [customHistory, conversationStack, isCustomMode]);

  const handleQuestionClick = (question) => {
    setError(null);
    setIsCustomMode(false);
    const newStack = [...conversationStack, { question, view: currentView }];
    setConversationStack(newStack);
    setCurrentView(question.id);
  };

  const handleBack = () => {
    if (conversationStack.length > 0) {
      const newStack = [...conversationStack];
      const previous = newStack.pop();
      setConversationStack(newStack);
      setCurrentView(previous.view);
      setError(null);
    }
  };

  const handleReset = () => {
    setConversationStack([]);
    setCurrentView('root');
    setCustomHistory([]);
    setIsCustomMode(false);
    setError(null);
  };

  const handleCustomQuery = async () => {
    if (!customQuery.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setIsCustomMode(true);

    try {
      const response = await fetch('https://krittya-chatbot-backend.onrender.com/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: customQuery.trim() }),
      });

      if (!response.ok) throw new Error('Failed to get response from server');

      const data = await response.json();
      if (!data.answer) throw new Error('No answer returned from server');

      setCustomHistory((prev) => [
        ...prev,
        { query: customQuery.trim(), answer: data.answer },
      ]);

      setCustomQuery('');
    } catch (err) {
      setError('Unable to process your query. Please try again or contact support.');
      console.error('API Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCustomQuery();
    }
  };

  const getCurrentQuestion = () => {
    if (currentView === 'root') return null;
    return knowledgeBase.questions[currentView] || knowledgeBase.root.find(q => q.id === currentView);
  };

  const getAvailableQuestions = () => {
    if (currentView === 'root') return knowledgeBase.root;

    const current = getCurrentQuestion();
    if (!current || !current.children || current.children.length === 0) return [];

    return current.children.map(childId => knowledgeBase.questions[childId]);
  };

  const currentQuestion = getCurrentQuestion();
  const availableQuestions = getAvailableQuestions();

  return (
    <div className="fixed bottom-0 right-0 z-50">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="m-6 bg-black hover:bg-gray-800 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
          aria-label="Open chat"
        >
          <MessageCircle size={28} className="text-white" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="bg-black shadow-2xl flex flex-col border border-gray-800 rounded-2xl"
          style={{
            width: '28vw',
            height: '40vh',
            minWidth: '400px',
            minHeight: '500px',
            transformOrigin: 'bottom right',
          }}
        >
          {/* Header */}
          <div className="bg-gray-900 text-white p-4 flex justify-between items-center border-b border-gray-800 rounded-t-2xl">
            <h3 className="font-semibold text-lg">Krittya Assistant</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-gray-800 rounded-full p-1 transition-colors"
              aria-label="Close chat"
            >
              <X size={24} />
            </button>
          </div>

          {/* Chat Content */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 bg-black">
            {!isCustomMode && conversationStack.length > 0 && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-colors"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              </div>
            )}

            {!isCustomMode && currentQuestion && (
              <div className="mb-6 bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-800">
                <p className="text-sm text-gray-400 mb-2">You asked:</p>
                <p className="font-medium text-white mb-3">{currentQuestion.text}</p>
                <p className="text-gray-300 leading-relaxed">{currentQuestion.answer}</p>

                {availableQuestions.length === 0 && (
                  <div className="mt-4 bg-gray-800 p-3 rounded-xl text-gray-300 text-sm">
                    Need more information? Please contact Krittya directly:<br />
                    Phone: +91 80132 97449<br />
                    Email: hello@krittya.com
                  </div>
                )}
              </div>
            )}

            {isCustomMode &&
              customHistory.map((item, index) => (
                <div
                  key={`custom-${index}`}
                  className="mb-4 bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-800"
                >
                  <p className="text-sm text-gray-400 mb-2">You asked:</p>
                  <p className="font-medium text-white mb-3">{item.query}</p>
                  <p className="text-gray-300 leading-relaxed">{item.answer}</p>
                </div>
              ))}

            {isCustomMode && customHistory.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={() => {
                    setConversationStack([]);
                    setCurrentView('root');
                    setIsCustomMode(false);
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white rounded-xl px-4 py-2 transition-colors"
                >
                  Go to Root Questions
                </button>
              </div>
            )}

            {error && (
              <div className="mb-4 bg-red-950 border border-red-800 rounded-xl p-3">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {!isCustomMode && (
              <div className="space-y-3">
                {currentView === 'root' && (
                  <p className="text-gray-300 mb-4">Please select a question to get started:</p>
                )}
                {availableQuestions.length > 0 &&
                  availableQuestions.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => handleQuestionClick(q)}
                      className="w-full text-left p-4 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-600 rounded-xl transition-all duration-200 shadow-sm"
                    >
                      <span className="text-gray-200">{q.text}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Custom query input */}
          <div className="p-4 bg-gray-900 border-t border-gray-800 rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask your own question..."
                disabled={isLoading}
                className="flex-1 bg-black border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2 focus:outline-none focus:border-gray-500 transition-colors disabled:opacity-50"
              />
              <button
                onClick={handleCustomQuery}
                disabled={isLoading || !customQuery.trim()}
                className="bg-white hover:bg-gray-200 text-black rounded-xl px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
