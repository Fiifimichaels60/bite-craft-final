import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Phone, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { Utensils } from "lucide-react"; // add this at the top with other imports


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
    <header 
      className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
      style={{
        // backgroundImage: "url('/restaurantBG.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* <h1 className="text-2xl font-bold text-food-primary">BiteCraft</h1> */}
          <h1 className="text-2xl font-bold text-food-primary flex items-center">
            <span>Bite</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v5m4-5v5m4-5v5m-6 4h6v11a1 1 0 01-2 0v-7H9v7a1 1 0 01-2 0V12z" />
            </svg>
            <span>Craft</span>
          </h1>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          {/* <a href="#menu" className="text-sm font-medium hover:text-food-primary transition-colors">
            Menu
          </a>
          <a href="#about" className="text-sm font-medium hover:text-food-primary transition-colors">
            About
          </a>
          <a href="#contact" className="text-sm font-medium hover:text-food-primary transition-colors">
            Contact
          </a> */}
        </nav>

        <div className="flex items-center space-x-4">
          <ThemeSwitcher />
          
          {/* <div className="flex items-center space-x-2 text-sm">
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">+233 50 244 5560</span>
          </div> */}
          <div className="flex items-center space-x-2 text-sm">
            <Phone className="h-4 w-4" />
            <a
              href="tel:+233502445560"
              className="hidden sm:inline hover:underline focus:outline-none focus:ring-2 focus:ring-food-primary"
            >
              +233 50 244 5560
            </a>
          </div>

          {/* <Button variant="outline" size="sm" onClick={handleAuthAction}>
            {user ? <LogOut className="h-4 w-4 mr-2" /> : <User className="h-4 w-4 mr-2" />}
            <span className="hidden sm:inline">
              {user ? `${user.user_metadata?.first_name || 'User'}` : 'Login'}
            </span>
          </Button> */}

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