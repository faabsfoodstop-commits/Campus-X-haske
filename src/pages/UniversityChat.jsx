import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { IconArrowLeft } from '../components/Icons';

export default function UniversityChat() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userData?.university) {
      fetchMessages();
      // Refresh messages every 5 seconds
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [userData]);

  const fetchUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      if (user) {
        setUserData(user);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user:', err);
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!userData?.university) return;

    try {
      const { data: messages, error } = await supabase
        .from('university_chat_messages')
        .select('*')
        .eq('university', userData.university)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages((messages || []).reverse());
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !userData?.university) return;

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      await supabase.from('university_chat_messages').insert({
        university: userData.university,
        user_id: session.user.id,
        user_name: userData?.full_name || session.user.email,
        department: userData?.department || 'N/A',
        message: messageText.trim(),
        likes: 0
      });

      setMessageText('');
      await fetchMessages();
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!userData?.university) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please complete your profile to use university chat.</p>
          <Button onClick={() => navigate('/profile')} variant="primary">
            Complete Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded transition"
            >
              <IconArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-primary">Campus Chat</h1>
              <p className="text-sm text-gray-600">{userData?.university}</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Chat Area */}
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 bg-white rounded-lg shadow mb-4 p-6 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No messages yet. Be the first to start a conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="border-l-4 border-primary pl-4 py-2">
                <div className="flex items-baseline gap-2 mb-1">
                  <p className="font-bold text-gray-800">{msg.user_name}</p>
                  <p className="text-xs text-gray-500">{msg.department}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <p className="text-gray-700">{msg.message}</p>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              maxLength={500}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button
              onClick={handleSendMessage}
              variant="primary"
              size="md"
              loading={sending}
            >
              Send
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">{messageText.length}/500</p>
        </div>
      </div>
    </div>
  );
}
