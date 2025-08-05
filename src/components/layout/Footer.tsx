import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-food-primary">BiteCraft</h3>
            <p className="text-sm text-muted-foreground">
              Delivering fresh, delicious meals to your doorstep since 2024.
            </p>
            <div className="flex space-x-4">
              <a href="https://vm.tiktok.com/ZMSwWowos/" target="_blank" rel="noopener noreferrer">
                <Facebook className="h-5 w-5 text-muted-foreground hover:text-food-primary cursor-pointer transition-colors" />
              </a>
              <a href="https://www.instagram.com/bitec_raft?utm_source=qr&igsh=b3cwcDk4cWt0cWJm" target="_blank" rel="noopener noreferrer">
                <Instagram className="h-5 w-5 text-muted-foreground hover:text-food-primary cursor-pointer transition-colors" />
              </a>
              <Twitter className="h-5 w-5 text-muted-foreground hover:text-food-primary cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#menu" className="text-muted-foreground hover:text-food-primary transition-colors">Menu</a></li>
              {/* <li><a href="#about" className="text-muted-foreground hover:text-food-primary transition-colors">About Us</a></li>
              <li><a href="#contact" className="text-muted-foreground hover:text-food-primary transition-colors">Contact</a></li>
              <li><a href="/admin" className="text-muted-foreground hover:text-food-primary transition-colors">Admin</a></li> */}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold">Contact Info</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-food-primary" />
                <span className="text-muted-foreground">+233 243 762 748</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-food-primary" />
                <span className="text-muted-foreground">michaelquaicoe60@gmail.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-food-primary" />
                <span className="text-muted-foreground">Takoradi, Ghana</span>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div className="space-y-4">
            <h4 className="font-semibold">Hours</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-food-primary" />
                <span>Mon-Fri: 9AM-9PM</span>
              </div>
              <div className="ml-6">Sat: 8AM-5PM</div>
              <div className="text-food-primary font-medium">Now Open!</div>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 BiteCraft. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
