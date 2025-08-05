import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Phone, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

interface HeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
}

export const Header = ({ cartItemsCount, onCartClick }: HeaderProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuthAction = () => {
    if (user) {
      handleSignOut();
    } else {
      navigate("/auth");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-food-primary">Bite Craft</h1>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          <a href="#menu" className="text-sm font-medium hover:text-food-primary transition-colors">
            Menu
          </a>
          <a href="#about" className="text-sm font-medium hover:text-food-primary transition-colors">
            About
          </a>
          <a href="#contact" className="text-sm font-medium hover:text-food-primary transition-colors">
            Contact
          </a>
        </nav>

        <div className="flex items-center space-x-4">
          <ThemeSwitcher />
          
          <div className="flex items-center space-x-2 text-sm">
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">+233 243 762 748</span>
          </div>
          
          <Button variant="outline" size="sm" onClick={handleAuthAction}>
            {user ? <LogOut className="h-4 w-4 mr-2" /> : <User className="h-4 w-4 mr-2" />}
            <span className="hidden sm:inline">
              {user ? `${user.user_metadata?.first_name || 'User'}` : 'Login'}
            </span>
          </Button>

          <Button 
            variant="default" 
            size="sm" 
            onClick={onCartClick} 
            className="relative"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Cart</span>
            {cartItemsCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                {cartItemsCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;