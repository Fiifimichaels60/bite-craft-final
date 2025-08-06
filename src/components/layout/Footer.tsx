import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter, Utensils, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container mx-auto px-4 py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="space-y-6 lg:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="bg-food-primary p-2 rounded-lg">
                <Utensils className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">BiteCraft</h3>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Crafting delicious experiences, one bite at a time. Fresh, tasty meals prepared with love and delivered right to your doorstep.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://vm.tiktok.com/ZMSwWowos/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-slate-800 hover:bg-food-primary p-3 rounded-full transition-all duration-300 hover:scale-110"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="https://www.instagram.com/bitec_raft?utm_source=qr&igsh=b3cwcDk4cWt0cWJm" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-slate-800 hover:bg-food-primary p-3 rounded-full transition-all duration-300 hover:scale-110"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <div className="bg-slate-800 hover:bg-food-primary p-3 rounded-full transition-all duration-300 hover:scale-110 cursor-pointer">
                <Twitter className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <a href="#menu" className="text-slate-300 hover:text-food-primary transition-colors duration-300 flex items-center group">
                  <span className="w-2 h-2 bg-food-primary rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Our Menu
                </a>
              </li>
              <li>
                <a href="#about" className="text-slate-300 hover:text-food-primary transition-colors duration-300 flex items-center group">
                  <span className="w-2 h-2 bg-food-primary rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  About Us
                </a>
              </li>
              <li>
                <a href="#contact" className="text-slate-300 hover:text-food-primary transition-colors duration-300 flex items-center group">
                  <span className="w-2 h-2 bg-food-primary rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Contact
                </a>
              </li>
              <li>
                <a href="/admin" className="text-slate-300 hover:text-food-primary transition-colors duration-300 flex items-center group">
                  <span className="w-2 h-2 bg-food-primary rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Admin Portal
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Get In Touch</h4>
            <div className="space-y-4">
              {/* Phone Numbers */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3 group">
                  <div className="bg-green-600 p-2 rounded-lg group-hover:bg-green-500 transition-colors">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-400 mb-1">Call/WhatsApp</p>
                    <a 
                      href="tel:+233502445560" 
                      className="text-slate-300 hover:text-white transition-colors block"
                    >
                      +233 50 244 5560
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 group">
                  <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-500 transition-colors">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-400 mb-1">Call</p>
                    <div className="space-y-1">
                      <a 
                        href="tel:+233599153381" 
                        className="text-slate-300 hover:text-white transition-colors block"
                      >
                        +233 59 915 3381
                      </a>
                      <a 
                        href="tel:+233553315003" 
                        className="text-slate-300 hover:text-white transition-colors block"
                      >
                        +233 55 331 5003
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start space-x-3 group">
                <div className="bg-red-600 p-2 rounded-lg group-hover:bg-red-500 transition-colors">
                  <Mail className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-400 mb-1">Email</p>
                  <a 
                    href="mailto:michaelquaicoe60@gmail.com" 
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    michaelquaicoe60@gmail.com
                  </a>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start space-x-3 group">
                <div className="bg-purple-600 p-2 rounded-lg group-hover:bg-purple-500 transition-colors">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-400 mb-1">Location</p>
                  <span className="text-slate-300">Takoradi, Ghana</span>
                </div>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Business Hours</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-orange-600 p-2 rounded-lg">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div className="space-y-2">
                  <div className="text-slate-300">
                    <div className="font-medium text-white mb-2">We're Open!</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Monday - Friday:</span>
                        <span className="text-orange-400 font-medium">9AM - 9PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saturday:</span>
                        <span className="text-orange-400 font-medium">8AM - 5PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sunday:</span>
                        <span className="text-slate-500">Closed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Order Button */}
              <div className="pt-4">
                <Button 
                  className="w-full bg-food-primary hover:bg-food-primary/90 text-white font-medium py-3 rounded-lg transition-all duration-300 hover:scale-105"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  <Utensils className="h-4 w-4 mr-2" />
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2 text-slate-300">
              <span>© 2025 BiteCraft. Made with</span>
              <Heart className="h-4 w-4 text-red-500 fill-current" />
              <span>in Ghana</span>
            </div>
            
            <div className="flex items-center space-x-6 text-sm">
              <a href="#privacy" className="text-slate-300 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#terms" className="text-slate-300 hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#support" className="text-slate-300 hover:text-white transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-food-primary/10 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-food-secondary/10 rounded-full translate-y-12 -translate-x-12"></div>
    </footer>
  );
};