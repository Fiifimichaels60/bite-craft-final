import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, MessageCircle, User, Clock } from "lucide-react";

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel('admin_chat_messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'nana_chat_messages' },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("nana_chat_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("nana_chat_messages")
        .update({ is_read: true })
        .eq("id", messageId);

      if (error) throw error;
      
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from("nana_chat_messages")
        .insert([{
          sender_id: "admin",
          sender_type: "admin",
          message: `Reply to: ${selectedMessage.message.split('\n')[0]}\n\n${replyText}`,
          is_read: false
        }]);

      if (error) throw error;

      toast({
        title: "Reply sent!",
        description: "Your reply has been sent successfully.",
      });

      setReplyText("");
      setSelectedMessage(null);
      fetchMessages();
    } catch (error) {
      console.error("Error sending reply:", error);
      toast({
        title: "Error",
        description: "Failed to send reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const parseCustomerMessage = (message: string) => {
    const lines = message.split('\n');
    const name = lines.find(line => line.startsWith('Name:'))?.replace('Name:', '').trim();
    const email = lines.find(line => line.startsWith('Email:'))?.replace('Email:', '').trim();
    const messageContent = lines.slice(lines.findIndex(line => line.startsWith('Message:')) + 1).join('\n').trim();
    
    return { name, email, messageContent };
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Chat Messages</h2>
        <p className="text-muted-foreground">Manage customer messages and support requests</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Recent Messages ({messages.filter(msg => msg.sender_type === 'customer').length})
            </CardTitle>
            <CardDescription>
              Customer support messages and inquiries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {messages.filter(msg => msg.sender_type === 'customer').length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No customer messages yet.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {messages
                  .filter(msg => msg.sender_type === 'customer')
                  .map((message) => {
                    const { name, email, messageContent } = parseCustomerMessage(message.message);
                    return (
                      <div 
                        key={message.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedMessage?.id === message.id ? 'bg-muted' : ''
                        } ${!message.is_read ? 'border-primary' : ''}`}
                        onClick={() => {
                          setSelectedMessage(message);
                          if (!message.is_read) {
                            markAsRead(message.id);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{name || 'Anonymous'}</span>
                            {!message.is_read && (
                              <Badge variant="default" className="text-xs">New</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(message.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        {email && (
                          <p className="text-sm text-muted-foreground mb-2">{email}</p>
                        )}
                        <p className="text-sm line-clamp-2">{messageContent}</p>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Detail & Reply */}
        <Card>
          <CardHeader>
            <CardTitle>Message Details & Reply</CardTitle>
            <CardDescription>
              {selectedMessage ? "Respond to customer message" : "Select a message to view details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedMessage ? (
              <div className="space-y-4">
                {(() => {
                  const { name, email, messageContent } = parseCustomerMessage(selectedMessage.message);
                  return (
                    <>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{name || 'Anonymous'}</span>
                        </div>
                        {email && (
                          <p className="text-sm text-muted-foreground mb-2">{email}</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{messageContent}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(selectedMessage.created_at).toLocaleString()}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Your Reply</label>
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your reply here..."
                          rows={4}
                        />
                        <Button 
                          onClick={sendReply} 
                          disabled={!replyText.trim() || sending}
                          className="w-full"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {sending ? "Sending..." : "Send Reply"}
                        </Button>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a message from the list to view details and reply.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Admin Replies History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Admin Replies</CardTitle>
          <CardDescription>
            Your recent responses to customer messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages.filter(msg => msg.sender_type === 'admin').length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No admin replies yet.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {messages
                .filter(msg => msg.sender_type === 'admin')
                .slice(0, 5)
                .map((message) => (
                  <div key={message.id} className="p-3 bg-primary/5 rounded-lg">
                    <p className="text-sm line-clamp-2">{message.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}