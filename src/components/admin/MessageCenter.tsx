import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Message {
  id: string;
  sender_id: string;
  sender_type: 'customer' | 'admin';
  message: string;
  is_read: boolean;
  created_at: string;
  chat_id: string;
}

interface Chat {
  id: string;
  customer_id: string;
  admin_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  customer: {
    name: string;
    phone: string;
    email: string | null;
  };
  messages: Message[];
  unread_count?: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}

const MessageCenter = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchChats();
    fetchCustomers();

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
          fetchChats(); // Refresh chats when new messages arrive
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('nana_chats')
        .select(`
          *,
          customer:nana_customers(
            name,
            phone,
            email
          ),
          messages:nana_chat_messages(
            id,
            sender_id,
            sender_type,
            message,
            is_read,
            created_at,
            chat_id
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Calculate unread message count for each chat with proper typing
      const chatsWithUnread: Chat[] = data?.map(chat => ({
        ...chat,
        messages: chat.messages?.map((msg: any) => ({
          ...msg,
          sender_type: msg.sender_type as 'customer' | 'admin'
        })) || [],
        unread_count: chat.messages?.filter((msg: any) => !msg.is_read && msg.sender_type === 'customer').length || 0
      })) || [];

      setChats(chatsWithUnread);
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

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('nana_customers')
        .select('id, name, phone, email')
        .order('name', { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const createNewChat = async () => {
    if (!selectedCustomer) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if chat already exists
      const existingChat = chats.find(chat => chat.customer_id === selectedCustomer);
      if (existingChat) {
        setSelectedChat(existingChat);
        setSelectedCustomer("");
        return;
      }

      const { data, error } = await supabase
        .from('nana_chats')
        .insert({
          customer_id: selectedCustomer,
          status: 'active'
        })
        .select(`
          *,
          customer:nana_customers(
            name,
            phone,
            email
          )
        `)
        .single();

      if (error) throw error;

      const newChat = { ...data, messages: [], unread_count: 0 };
      setChats([newChat, ...chats]);
      setSelectedChat(newChat);
      setSelectedCustomer("");

      toast({
        title: "Success",
        description: "New chat created",
      });
    } catch (error) {
      console.error('Error creating chat:', error);
      toast({
        title: "Error",
        description: "Failed to create chat",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return;

    try {
      const { data, error } = await supabase
        .from('nana_chat_messages')
        .insert({
          chat_id: selectedChat.id,
          sender_id: 'admin', // In a real app, this would be the admin's ID
          sender_type: 'admin',
          message: newMessage.trim()
        })
        .select()
        .single();

      if (error) throw error;

      // Update the chat's updated_at timestamp
      await supabase
        .from('nana_chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedChat.id);

      setNewMessage("");
      fetchChats(); // Refresh to get the new message

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

  const markMessagesAsRead = async (chatId: string) => {
    try {
      await supabase
        .from('nana_chat_messages')
        .update({ is_read: true })
        .eq('chat_id', chatId)
        .eq('sender_type', 'customer')
        .eq('is_read', false);

      // Refresh chats to update unread counts
      fetchChats();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
    if (chat.unread_count && chat.unread_count > 0) {
      markMessagesAsRead(chat.id);
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.customer.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Message Center</h2>
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
          <h2 className="text-xl font-semibold">Message Center</h2>
          <p className="text-sm text-muted-foreground">
            Communicate with your customers ({chats.length} conversations)
          </p>
        </div>
        <Badge variant="outline" className="text-primary">
          <MessageCircle className="w-4 h-4 mr-1" />
          {chats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0)} Unread
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Chat List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Conversations</CardTitle>
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* New Chat */}
                <div className="flex gap-2">
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} - {customer.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={createNewChat} size="sm">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {filteredChats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                ) : (
                  filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`p-4 cursor-pointer hover:bg-muted transition-colors border-b ${
                        selectedChat?.id === chat.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => handleChatSelect(chat)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="font-medium">{chat.customer.name}</span>
                            {chat.unread_count && chat.unread_count > 0 && (
                              <Badge variant="default" className="text-xs">
                                {chat.unread_count}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {chat.customer.phone}
                          </div>
                          {chat.messages && chat.messages.length > 0 && (
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                              {chat.messages[chat.messages.length - 1]?.message}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(chat.updated_at).toLocaleDateString()}
                        </div>
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
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {selectedChat.customer.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {selectedChat.customer.phone}
                    {selectedChat.customer.email && ` • ${selectedChat.customer.email}`}
                  </p>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  {/* Messages */}
                  <div className="flex-1 space-y-4 mb-4 max-h-96 overflow-y-auto">
                    {selectedChat.messages && selectedChat.messages.length > 0 ? (
                      selectedChat.messages
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.sender_type === 'admin'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              <p className="text-sm">{message.message}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(message.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No messages yet. Start the conversation!</p>
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
                      className="flex-1 min-h-[80px]"
                    />
                    <Button onClick={sendMessage} className="self-end">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to start messaging</p>
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