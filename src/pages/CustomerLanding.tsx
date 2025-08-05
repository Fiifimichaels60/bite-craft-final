import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Phone, MapPin, Clock, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import CustomerChat from "@/components/customer/CustomerChat";
import { Footer } from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { FoodGrid } from "@/components/food/FoodGrid";
import { Cart } from "@/components/cart/Cart";
// import { FloatingActions } from "@/components/ui/floating-actions";
import { FoodCarousel } from "@/components/ui/food-carousel";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { color } from "html2canvas/dist/types/css/types/color";

interface Food {
  id: string;
  name: string;
  description: string;
  price: number;
  delivery_price: number;
  image_url: string;
  category_id: string;
  is_available: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string;
  image_url: string;
}

const CustomerLanding = () => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [deliveryFeeFilter, setDeliveryFeeFilter] = useState("all");

  useEffect(() => {
    fetchFoodsAndCategories();
  }, []);

  const fetchFoodsAndCategories = async () => {
    try {
      const [foodsResponse, categoriesResponse] = await Promise.all([
        supabase.from("nana_foods").select("*").eq("is_available", true),
        supabase.from("nana_categories").select("*").eq("is_active", true)
      ]);

      if (foodsResponse.data) setFoods(foodsResponse.data);
      if (categoriesResponse.data) setCategories(categoriesResponse.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFoods = foods.filter(food => {
    // Category filter
    const categoryMatch = selectedCategory === "all" || food.category_id === selectedCategory;
    
    // Search filter
    const searchMatch = searchTerm === "" || 
      food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      food.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Price filter
    let priceMatch = true;
    if (priceFilter === "under-10") priceMatch = food.price < 10;
    else if (priceFilter === "10-20") priceMatch = food.price >= 10 && food.price <= 20;
    else if (priceFilter === "20-30") priceMatch = food.price >= 20 && food.price <= 30;
    else if (priceFilter === "over-30") priceMatch = food.price > 30;
    
    // Delivery fee filter
    let deliveryMatch = true;
    if (deliveryFeeFilter === "free") deliveryMatch = food.delivery_price === 0;
    else if (deliveryFeeFilter === "under-5") deliveryMatch = food.delivery_price > 0 && food.delivery_price < 5;
    else if (deliveryFeeFilter === "over-5") deliveryMatch = food.delivery_price >= 5;
    
    return categoryMatch && searchMatch && priceMatch && deliveryMatch;
  });

  const addToCart = (food: Food, orderType: 'delivery' | 'pickup') => {
    console.log('addToCart function called:', food.name, orderType);
    const existingItem = cartItems.find(item => item.id === food.id && item.orderType === orderType);
    
    if (existingItem) {
      console.log('Updating existing item in cart');
      setCartItems(cartItems.map(item => 
        item.id === food.id && item.orderType === orderType
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      console.log('Adding new item to cart');
      setCartItems([...cartItems, { 
        ...food, 
        quantity: 1, 
        orderType,
        total: orderType === 'delivery' ? food.price + food.delivery_price : food.price
      }]);
    }
    console.log('Cart items updated, new count:', cartItems.length + 1);
  };

  const removeFromCart = (foodId: string, orderType: string) => {
    setCartItems(cartItems.filter(item => !(item.id === foodId && item.orderType === orderType)));
  };

  const updateCartQuantity = (foodId: string, orderType: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(foodId, orderType);
    } else {
      setCartItems(cartItems.map(item => 
        item.id === foodId && item.orderType === orderType
          ? { ...item, quantity }
          : item
      ));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading delicious food...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Header 
        cartItemsCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)} 
        onCartClick={() => setShowCart(true)}
      />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="text-food-primary-foreground py-20 animate-fade-in font-bold text-food-primary"
          style={{ backgroundImage: "url('/BG2.png')", 
          backgroundSize: "cover", backgroundPosition: "center" }}>
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-6 animate-scale-in">Delicious Food Delivered</h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Fresh, tasty meals prepared with love and delivered right to your doorstep
            </p>
            <div className="flex justify-center gap-6 text-sm animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>30-45 min delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                <span>24/7 Support</span>
              </div>
              {/* <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>Free delivery over $25</span>
              </div> */}
            </div>
          </div>
        </section>

        {/* Featured Foods Carousel */}
        {/* {foods.length > 0 && (
          <section className="py-12 animate-fade-in">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-8">Featured Dishes</h2>
              <FoodCarousel 
                foods={foods.slice(0, 6)} 
                onFoodClick={(food) => setSelectedFood(food)} 
              />
            </div>
          </section>
        )} */}

        {/* Search and Filter Section */}
        <section className="py-8 animate-fade-in">
          <div className="container mx-auto px-4">
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Filter className="h-6 w-6" />
                Find Your Food
              </h2>
              
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for food by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Price Range</label>
                  <Select value={priceFilter} onValueChange={setPriceFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Prices" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="under-10">Under ₵10</SelectItem>
                      <SelectItem value="10-20">₵10 - ₵20</SelectItem>
                      <SelectItem value="20-30">₵20 - ₵30</SelectItem>
                      <SelectItem value="over-30">Over ₵30</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Delivery Fee</label>
                  <Select value={deliveryFeeFilter} onValueChange={setDeliveryFeeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Fees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Fees</SelectItem>
                      <SelectItem value="free">Free Delivery</SelectItem>
                      <SelectItem value="under-5">Under ₵5</SelectItem>
                      <SelectItem value="over-5">₵5 and Above</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Category Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  onClick={() => setSelectedCategory("all")}
                  size="sm"
                  className="rounded-full"
                >
                  All Items
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category.id)}
                    size="sm"
                    className="rounded-full"
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Food Grid */}
        <section className="pb-12 animate-fade-in">
          <div className="container mx-auto px-4">
            <div className="mb-4 text-center text-muted-foreground">
              Showing {filteredFoods.length} of {foods.length} items
            </div>
            <FoodGrid foods={filteredFoods} onAddToCart={addToCart} />
          </div>
        </section>
      </main>

      <Footer />
      <CustomerChat />

      {/* Floating Action Buttons */}
      {/* <FloatingActions /> */}

      {/* Cart Sidebar */}
      <Cart
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        items={cartItems}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
      />
    </div>
  );
};

export default CustomerLanding;