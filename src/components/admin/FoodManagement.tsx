import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Upload,
  Save,
  X,
  Trash,
  Eye,
  EyeOff
} from "lucide-react";

interface Food {
  id: string;
  name: string;
  description: string | null;
  price: number;
  delivery_price: number;
  category_id: string | null;
  is_available: boolean;
  image_url: string | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

export default function FoodManagement() {
  const { toast } = useToast();
  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    delivery_price: "",
    category_id: "",
    is_available: true,
    image_url: ""
  });

  useEffect(() => {
    fetchFoods();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("nana_categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchFoods = async () => {
    try {
      const { data, error } = await supabase
        .from('nana_foods')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFoods(data || []);
    } catch (error) {
      console.error('Error fetching foods:', error);
      toast({
        title: "Error",
        description: "Failed to fetch food items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      toast({
        title: "Error",
        description: "Name and price are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const foodData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        delivery_price: parseFloat(formData.delivery_price) || 0,
        category_id: formData.category_id === "none" ? null : formData.category_id || null,
        is_available: formData.is_available,
        image_url: formData.image_url || null,
      };

      if (editingFood) {
        const { error } = await supabase
          .from('nana_foods')
          .update(foodData)
          .eq('id', editingFood.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Food item updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('nana_foods')
          .insert([foodData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Food item added successfully",
        });
      }

      fetchFoods();
      resetForm();
      setIsAddDialogOpen(false);
      setEditingFood(null);
    } catch (error) {
      console.error('Error saving food:', error);
      toast({
        title: "Error",
        description: "Failed to save food item",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('nana_foods')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Food item deleted successfully",
      });
      fetchFoods();
    } catch (error) {
      console.error('Error deleting food:', error);
      toast({
        title: "Error",
        description: "Failed to delete food item",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFoods.length === 0) return;

    try {
      const { error } = await supabase
        .from('nana_foods')
        .delete()
        .in('id', selectedFoods);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedFoods.length} food items deleted successfully`,
      });
      setSelectedFoods([]);
      fetchFoods();
    } catch (error) {
      console.error('Error deleting foods:', error);
      toast({
        title: "Error",
        description: "Failed to delete food items",
        variant: "destructive",
      });
    }
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('nana_foods')
        .update({ is_available: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Food item ${!currentStatus ? 'enabled' : 'disabled'} successfully`,
      });
      fetchFoods();
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      delivery_price: "",
      category_id: "",
      is_available: true,
      image_url: ""
    });
  };

  const openEditDialog = (food: Food) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      description: food.description || "",
      price: food.price.toString(),
      delivery_price: food.delivery_price.toString(),
      category_id: food.category_id || "",
      is_available: food.is_available,
      image_url: food.image_url || ""
    });
    setIsAddDialogOpen(true);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFoods(foods.map(food => food.id));
    } else {
      setSelectedFoods([]);
    }
  };

  const handleSelectFood = (foodId: string, checked: boolean) => {
    if (checked) {
      setSelectedFoods([...selectedFoods, foodId]);
    } else {
      setSelectedFoods(selectedFoods.filter(id => id !== foodId));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-semibold">Manage Foods</h2>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Manage Foods</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Total: {foods.length} items | Available: {foods.filter(f => f.is_available).length} | Unavailable: {foods.filter(f => !f.is_available).length}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedFoods.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Delete Selected ({selectedFoods.length})</span>
                  <span className="sm:hidden">Delete ({selectedFoods.length})</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Selected Foods</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedFoods.length} food items? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) {
              setEditingFood(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Food Item</span>
                <span className="sm:hidden">Add Food</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingFood ? 'Edit Food Item' : 'Add New Food Item'}</DialogTitle>
                <DialogDescription>
                  {editingFood ? 'Update food item details' : 'Add a new food item to your menu'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                      placeholder="https://example.com/food-image.jpg"
                    />
                    <Button type="button" variant="outline" size="icon">
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.image_url && (
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      className="w-full h-32 object-cover rounded-md"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Food Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Jollof Rice with Chicken"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the food item..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({...formData, category_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₵) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery_price">Delivery Fee (₵)</Label>
                    <Input
                      id="delivery_price"
                      type="number"
                      step="0.01"
                      value={formData.delivery_price}
                      onChange={(e) => setFormData({...formData, delivery_price: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_available"
                    checked={formData.is_available}
                    onCheckedChange={(checked) => setFormData({...formData, is_available: checked})}
                  />
                  <Label htmlFor="is_available">Available for orders</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    {editingFood ? 'Update Food' : 'Add Food'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setEditingFood(null);
                      resetForm();
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Food Items ({foods.length})</CardTitle>
          <CardDescription>
            Manage your food menu items, prices, and availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          {foods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No food items yet. Add your first menu item to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8 sm:w-12">
                      <Checkbox
                        checked={selectedFoods.length === foods.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="hidden md:table-cell">Delivery</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {foods.map((food) => (
                    <TableRow key={food.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedFoods.includes(food.id)}
                          onCheckedChange={(checked) => handleSelectFood(food.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {food.image_url ? (
                          <img 
                            src={food.image_url} 
                            alt={food.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-md"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-md flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{food.name}</div>
                          {food.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-xs hidden sm:block">
                              {food.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">₵{food.price.toFixed(2)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">₵{food.delivery_price.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={food.is_available ? "default" : "secondary"} className="text-xs">
                            {food.is_available ? "Available" : "Unavailable"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAvailability(food.id, food.is_available)}
                          >
                            {food.is_available ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(food)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Food Item</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{food.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(food.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}