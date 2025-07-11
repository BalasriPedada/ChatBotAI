import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

function Chatbot() {
  const [messages, setMessages] = useState([]); // Initialize as empty, will fetch from backend
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Effect to load existing messages from the backend when the component mounts
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        // Fetch all conversations from your Flask backend
        // Your current Flask backend only has a POST /api/chat.
        // You'll need to add a GET /api/conversations or similar endpoint to your Flask app.
        // For now, let's assume the /api/chat endpoint can also handle GET for simplicity,
        // though typically you'd have a separate endpoint for fetching history.
        // If your Flask app only has POST for /api/chat, this GET request will fail.
        // I will provide an update to app.py below to add a GET endpoint for history.
        const res = await axios.get('http://localhost:5000/api/conversations'); // Assuming a new GET endpoint
        const loadedMessages = [];
        res.data.forEach(item => {
          loadedMessages.push({ role: 'user', text: item.user });
          loadedMessages.push({ role: 'bot', text: item.bot });
        });
        setMessages(loadedMessages);
      } catch (err) {
        console.error("Error fetching chat history:", err);
        // Fallback or error message if history cannot be loaded
        setMessages([{ role: 'bot', text: 'Could not load previous conversations.' }]);
      }
    };

    fetchChatHistory();
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', text: input };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages); // Optimistically add user message to UI
    setInput('');
    setLoading(true);

    try {
      // Send the user message to your Flask backend.
      // The backend will generate a reply AND save both messages to MongoDB.
      const res = await axios.post('http://localhost:5000/api/chat', {
        message: userMessage.text,
        // Note: The history parameter in your app.py's chat function is not explicitly used
        // for storing the *entire* history, but rather for context to the AI model.
        // Since we're now relying on the DB for full history,
        // you might adjust how generate_reply uses 'history' or remove it if not needed for context.
        // For simplicity, we'll just send the current message here.
      });

      const botMessage = { role: 'bot', text: res.data.reply };
      // Update state with the bot's reply. The saving to DB is handled by the backend.
      setMessages((prevMessages) => [...prevMessages, botMessage]);

    } catch (err) {
      console.error("Error sending message:", err);
      const errorMsg = { role: 'bot', text: 'Something went wrong!' };
      setMessages((prevMessages) => [...prevMessages, errorMsg]);
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.chatBox}>
        <h2 style={styles.header}>AI Chatbot Assistant</h2>
        <div style={styles.chatArea}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                ...styles.messageRow,
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {msg.role === 'bot' && <div style={styles.avatar}>🤖</div>}
              <div
                style={{
                  ...styles.bubble,
                  backgroundColor: msg.role === 'user' ? '#007bff' : '#e0e0e0',
                  color: msg.role === 'user' ? '#fff' : '#000',
                }}
              >
                {msg.text}
              </div>
              {msg.role === 'user' && <div style={styles.avatar}>👤</div>}
            </div>
          ))}
          {loading && <p style={styles.typing}>🤖 Bot is typing...</p>}
          <div ref={chatEndRef} />
        </div>
        <div style={styles.inputRow}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            style={styles.input}
          />
          <button onClick={sendMessage} style={styles.button}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    width: '100vw',
    backgroundColor: '#f2f2f2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    margin: 0,
  },
  chatBox: {
    width: '100%',
    maxWidth: '700px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
    borderRadius: '0px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  },
  header: {
    textAlign: 'center',
    padding: '20px',
    borderBottom: '1px solid #ddd',
  },
  chatArea: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-end',
    marginBottom: '10px',
  },
  bubble: {
    maxWidth: '60%',
    padding: '10px 15px',
    borderRadius: '20px',
    fontSize: '14px',
    wordWrap: 'break-word',
  },
  avatar: {
    margin: '0 8px',
    fontSize: '20px',
  },
  typing: {
    fontStyle: 'italic',
    color: '#555',
    margin: '8px 0',
  },
  inputRow: {
    display: 'flex',
    padding: '10px 20px',
    borderTop: '1px solid #ddd',
  },
  input: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '14px',
  },
  button: {
    marginLeft: '10px',
    padding: '12px 20px',
    borderRadius: '8px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};

export default Chatbot;