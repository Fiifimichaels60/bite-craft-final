import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Truck, Package, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface FoodGridProps {
  foods: Food[];
  onAddToCart: (food: Food, orderType: 'delivery' | 'pickup') => void;
}

export const FoodGrid = ({ foods, onAddToCart }: FoodGridProps) => {
  const { toast } = useToast();

  const handleAddToCart = (food: Food, orderType: 'delivery' | 'pickup') => {
    console.log('Add to cart clicked:', food.name, orderType);
    console.log('Adding to cart:', food, orderType);
    onAddToCart(food, orderType);
    toast({
      title: "Item added to cart!",
      description: `${food.name} has been added to your cart.`,
    });
  };
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);

  const placeholderImage = "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400&h=300&fit=crop";

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {foods.map((food) => (
          <Card key={food.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div 
              className="aspect-square overflow-hidden cursor-pointer"
              onClick={() => setSelectedFood(food)}
            >
              <img
                src={food.image_url || placeholderImage}
                alt={food.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <CardHeader className="pb-2 p-3 md:p-6">
              <CardTitle className="text-sm md:text-lg line-clamp-1">{food.name}</CardTitle>
              <CardDescription className="text-xs md:text-sm line-clamp-2">
                {food.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 md:p-6">
              <div className="flex flex-col gap-2 md:gap-3">
                <div>
                   <span className="text-lg md:text-2xl font-bold text-food-primary">₵{food.price}</span>
                   {food.delivery_price > 0 && (
                     <span className="text-xs md:text-sm text-muted-foreground block md:inline md:ml-2">
                       +₵{food.delivery_price} delivery
                     </span>
                   )}
                </div>
                <Button 
                  className="w-full text-xs md:text-sm" 
                  variant="outline"
                  onClick={() => setSelectedFood(food)}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Full Food Image Dialog */}
      {selectedFood && (
        <Dialog open={!!selectedFood} onOpenChange={() => setSelectedFood(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedFood.name}</DialogTitle>
              <DialogDescription className="text-base">
                {selectedFood.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="aspect-video overflow-hidden rounded-lg">
                <img
                  src={selectedFood.image_url || placeholderImage}
                  alt={selectedFood.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Pickup</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-food-primary">₵{selectedFood.price}</span>
                    <Badge variant="secondary">
                      <Package className="h-3 w-3 mr-1" />
                      Ready in 15-20 min
                    </Badge>
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => {
                      handleAddToCart(selectedFood, 'pickup');
                      setSelectedFood(null);
                    }}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Add to Cart (Pickup)
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Delivery</h4>
                  <div className="flex items-center justify-between">
                     <span className="text-2xl font-bold text-food-primary">
                       ₵{selectedFood.price + selectedFood.delivery_price}
                     </span>
                    <Badge variant="secondary">
                      <Truck className="h-3 w-3 mr-1" />
                      30-45 min
                    </Badge>
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => {
                      handleAddToCart(selectedFood, 'delivery');
                      setSelectedFood(null);
                    }}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Add to Cart (Delivery)
                  </Button>
                </div>
              </div>
              
              {/* Call to Place Order */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Prefer to order by phone?
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    window.location.href = 'tel:+233123456789';
                  }}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call to Place Order: +233 123 456 789
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {foods.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No food items available at the moment.</p>
        </div>
      )}
    </>
  );
};