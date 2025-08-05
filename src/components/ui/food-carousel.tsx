import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

interface FoodCarouselProps {
  foods: Food[];
  onFoodClick: (food: Food) => void;
}

export const FoodCarousel = ({ foods, onFoodClick }: FoodCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const placeholderImage = "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400&h=300&fit=crop";

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, foods.length - 2));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, foods.length - 2)) % Math.max(1, foods.length - 2));
  };

  if (foods.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No featured foods available</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-lg">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 33.333}%)` }}
        >
          {foods.map((food) => (
            <div 
              key={food.id} 
              className="w-1/3 flex-shrink-0 px-2 animate-fade-in"
            >
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
                onClick={() => onFoodClick(food)}
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={food.image_url || placeholderImage}
                    alt={food.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-1">{food.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {food.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">₵{food.price}</span>
                    {food.delivery_price > 0 && (
                      <span className="text-xs text-muted-foreground">
                        +₵{food.delivery_price} delivery
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {foods.length > 3 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={nextSlide}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
};