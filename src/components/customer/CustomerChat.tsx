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
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  messages: Message[];
}

interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
}

const CustomerChat = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    phone: "",
    email: ""
  });
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (chat) {
      fetchMessages();
      
      // Set up real-time subscription for new messages
      const channel = supabase
        .channel('customer-chat-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'nana_chat_messages',
            filter: `chat_id=eq.${chat.id}`
          },
          (payload) => {
            const newMessage = payload.new as Message;
            setMessages(prev => [...prev, newMessage]);
            
            // Show notification for admin messages
            if (newMessage.sender_type === 'admin') {
              toast({
                title: "New message from admin",
                description: newMessage.message.slice(0, 100) + (newMessage.message.length > 100 ? '...' : ''),
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [chat]);

  const fetchMessages = async () => {
    if (!chat) return;

    try {
      const { data, error } = await supabase
        .from('nana_chat_messages')
        .select('*')
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      const typedMessages = data?.map(msg => ({
        ...msg,
        sender_type: msg.sender_type as 'customer' | 'admin'
      })) || [];
      setMessages(typedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const createOrFindChat = async () => {
    if (!customerInfo.name.trim() || !customerInfo.phone.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name and phone number",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // First, create or find customer
      let customerId: string;
      
      const { data: existingCustomer } = await supabase
        .from('nana_customers')
        .select('id')
        .eq('phone', customerInfo.phone)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from('nana_customers')
          .insert({
            name: customerInfo.name,
            phone: customerInfo.phone,
            email: customerInfo.email || null
          })
          .select('id')
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }

      // Find existing chat or create new one
      const { data: existingChat } = await supabase
        .from('nana_chats')
        .select('*')
        .eq('customer_id', customerId)
        .single();

      if (existingChat) {
        setChat({ ...existingChat, messages: [] });
      } else {
        const { data: newChat, error: chatError } = await supabase
          .from('nana_chats')
          .insert({
            customer_id: customerId,
            status: 'active'
          })
          .select('*')
          .single();

        if (chatError) throw chatError;
        setChat({ ...newChat, messages: [] });
      }

      setShowChat(true);
      toast({
        title: "Success",
        description: "Chat initialized successfully",
      });
    } catch (error) {
      console.error('Error creating chat:', error);
      toast({
        title: "Error",
        description: "Failed to initialize chat",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!chat || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('nana_chat_messages')
        .insert({
          chat_id: chat.id,
          sender_id: chat.customer_id,
          sender_type: 'customer',
          message: newMessage.trim()
        });

      if (error) throw error;

      // Update chat timestamp
      await supabase
        .from('nana_chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chat.id);

      setNewMessage("");
      toast({
        title: "Message sent",
        description: "Your message has been sent to the admin",
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

  return (
    <Dialog open={showChat} onOpenChange={setShowChat}>
      <DialogTrigger asChild>
        <Button 
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md h-[500px] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Chat with Admin
              </DialogTitle>
              <DialogDescription>
                Get help with your orders and questions
              </DialogDescription>
            </div>
            {chat && (
              <Badge variant="outline" className="text-green-600">
                <Clock className="w-3 h-3 mr-1" />
                Online
              </Badge>
            )}
          </div>
        </DialogHeader>

        {!chat ? (
          <div className="flex-1 p-4 space-y-4">
            <div className="text-center mb-6">
              <User className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-semibold">Start a conversation</h3>
              <p className="text-sm text-muted-foreground">
                Enter your details to chat with our admin team
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="Enter your phone number"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <Button 
                onClick={createOrFindChat} 
                className="w-full"
                disabled={loading}
              >
                {loading ? "Starting chat..." : "Start Chat"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-80">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg ${
                        message.sender_type === 'customer'
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
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
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
                  className="flex-1 min-h-[60px] resize-none"
                />
                <Button onClick={sendMessage} size="icon" className="self-end">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CustomerChat;