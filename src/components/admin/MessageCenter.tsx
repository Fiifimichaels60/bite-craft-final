import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageCircle, 
  Send, 
  User, 
  Clock,
  Phone,
} from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  sender_type: 'customer' | 'admin';
  message: string;
  is_read: boolean;
  created_at: string;
  chat_id: string;
}

interface CustomerChat {
  id: string;
  customer_id: string;
  customer: {
    name: string;
    phone: string;
    email: string | null;
  };
  messages: Message[];
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

const MessageCenter = () => {
  const [customerChats, setCustomerChats] = useState<CustomerChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<CustomerChat | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomerChats();

    // Set up real-time subscription for messages
    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nana_chat_messages'
        },
        () => {
          fetchCustomerChats(); // Refresh chats when new messages arrive
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCustomerChats = async () => {
    try {
      setLoading(true);
      
      // Get all customers who have sent messages
      const { data: customers, error } = await supabase
        .from('nana_customers')
        .select(`
          id,
          name,
          phone,
          email
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // For each customer, get their messages and create chat objects
      const customerChatsData: CustomerChat[] = [];
      
      for (const customer of customers || []) {
        const { data: messages } = await supabase
          .from('nana_chat_messages')
          .select('*')
          .eq('sender_id', customer.id)
          .order('created_at', { ascending: false });

        if (messages && messages.length > 0) {
          const unreadCount = messages.filter(msg => 
            msg.sender_type === 'customer' && !msg.is_read
          ).length;

          customerChatsData.push({
            id: customer.id,
            customer_id: customer.id,
            customer: {
              name: customer.name,
              phone: customer.phone,
              email: customer.email
            },
            messages: messages.map(msg => ({
              ...msg,
              sender_type: msg.sender_type as 'customer' | 'admin'
            })),
            last_message: messages[0]?.message,
            last_message_time: messages[0]?.created_at,
            unread_count: unreadCount
          });
        }
      }

      // Sort by last message time
      customerChatsData.sort((a, b) => 
        new Date(b.last_message_time || 0).getTime() - new Date(a.last_message_time || 0).getTime()
      );

      setCustomerChats(customerChatsData);
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch chats",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return;

    try {
      const { data, error } = await supabase
        .from('nana_chat_messages')
        .insert({
          chat_id: null, // We're not using the chat table anymore
          sender_id: 'admin', // In a real app, this would be the admin's ID
          sender_type: 'admin',
          message: newMessage.trim()
        })
        .select()
        .single();

      if (error) throw error;

      setNewMessage("");
      fetchCustomerChats(); // Refresh to get the new message

      toast({
        title: "Success",
        description: "Message sent",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const markMessagesAsRead = async (customerId: string) => {
    try {
      await supabase
        .from('nana_chat_messages')
        .update({ is_read: true })
        .eq('sender_id', customerId)
        .eq('sender_type', 'customer')
        .eq('is_read', false);

      // Refresh chats to update unread counts
      fetchCustomerChats();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleChatSelect = (chat: CustomerChat) => {
    setSelectedChat(chat);
    if (chat.unread_count > 0) {
      markMessagesAsRead(chat.customer_id);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold">Message Center</h2>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Message Center</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Communicate with your customers ({customerChats.length} conversations)
          </p>
        </div>
        <Badge variant="outline" className="text-primary">
          <MessageCircle className="w-4 h-4 mr-1" />
          {customerChats.reduce((sum, chat) => sum + chat.unread_count, 0)} Unread
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-[500px] sm:h-[600px]">
        {/* Chat List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Customer Messages</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1 max-h-80 sm:max-h-96 overflow-y-auto">
                {customerChats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs sm:text-sm">No customer messages yet</p>
                  </div>
                ) : (
                  customerChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`p-3 sm:p-4 cursor-pointer hover:bg-muted transition-colors border-b ${
                        selectedChat?.id === chat.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => handleChatSelect(chat)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="font-medium text-sm">{chat.customer.name}</span>
                            {chat.unread_count > 0 && (
                              <Badge variant="default" className="text-xs">
                                {chat.unread_count}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {chat.customer.phone}
                          </div>
                          {chat.last_message && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {chat.last_message}
                            </p>
                          )}
                        </div>
                        {chat.last_message_time && (
                          <div className="text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(chat.last_message_time).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Messages */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            {selectedChat ? (
              <>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {selectedChat.customer.name}
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {selectedChat.customer.phone}
                    {selectedChat.customer.email && ` • ${selectedChat.customer.email}`}
                  </p>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  {/* Messages */}
                  <div className="flex-1 space-y-3 sm:space-y-4 mb-4 max-h-64 sm:max-h-96 overflow-y-auto">
                    {selectedChat.messages && selectedChat.messages.length > 0 ? (
                      selectedChat.messages
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                                message.sender_type === 'admin'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              <p className="text-xs sm:text-sm">{message.message}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(message.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs sm:text-sm">No messages yet. Start the conversation!</p>
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      className="flex-1 min-h-[60px] sm:min-h-[80px] text-sm"
                    />
                    <Button onClick={sendMessage} className="self-end" size="sm">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Select a customer to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MessageCenter;