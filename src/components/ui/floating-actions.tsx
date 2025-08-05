import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChatDialog } from "@/components/chat/ChatDialog";

export const FloatingActions = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <>
      {/* Chat Admin Button - Left Side */}
      <div className="fixed left-4 bottom-20 z-50 animate-fade-in">
        <Dialog open={chatOpen} onOpenChange={setChatOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 bg-primary text-primary-foreground"
            >
              <MessageCircle className="h-6 w-6" />
              <span className="sr-only">Chat with admin</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Chat with Admin</DialogTitle>
              <DialogDescription>
                Send a message to our support team
              </DialogDescription>
            </DialogHeader>
            <ChatDialog onClose={() => setChatOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Back to Top Button - Right Side */}
      {showBackToTop && (
        <div className="fixed right-4 bottom-20 z-50 animate-fade-in">
          <Button
            onClick={scrollToTop}
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 bg-secondary text-secondary-foreground"
          >
            <ArrowUp className="h-6 w-6" />
            <span className="sr-only">Back to top</span>
          </Button>
        </div>
      )}
    </>
  );
};