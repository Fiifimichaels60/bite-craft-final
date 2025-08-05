import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useNavigate } from "react-router-dom";
import FoodManagement from "@/components/admin/FoodManagement";
import CategoryManagement from "@/components/admin/CategoryManagement";
import CustomerManagement from "@/components/admin/CustomerManagement";
import OrderManagement from "@/components/admin/OrderManagement";
import MessageCenter from "@/components/admin/MessageCenter";
import AdminChat from "@/components/admin/AdminChat";
import { supabase } from "@/integrations/supabase/client";
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  ShoppingCart,
  Users,
  CreditCard,
  Save,
  LogOut,
  Shield,
  UserPlus
} from "lucide-react";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { admin, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const [hubtelApiKey, setHubtelApiKey] = useState("a7f0f2c8b7fe4e7a8636e2d47e32af44");
  const [hubtelApiId, setHubtelApiId] = useState("7nNNQXB");
  const [paystackSecretKey, setPaystackSecretKey] = useState("sk_live_84b49fd5fb26f8609e93f0f3d99203b9a23f435c");
  const [paystackPublicKey, setPaystackPublicKey] = useState("pk_live_17f317c97c729f9e877d65d23d9f45f0c959ec63");
  const [isPaystackKeySaved, setIsPaystackKeySaved] = useState(false);
  
  // Overview data states
  const [totalOrders, setTotalOrders] = useState(0);
  const [activeFoods, setActiveFoods] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  
  // New admin form states
  const [newAdminForm, setNewAdminForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin"
  });
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  useEffect(() => {
    // Always ensure the correct Paystack credentials are saved
    const savedSecretKey = localStorage.getItem('paystack_secret_key');
    const savedPublicKey = localStorage.getItem('paystack_public_key');
    
    if (savedSecretKey === paystackSecretKey && savedPublicKey === paystackPublicKey) {
      setIsPaystackKeySaved(true);
    } else {
      // Save the correct Paystack credentials
      localStorage.setItem('paystack_secret_key', paystackSecretKey);
      localStorage.setItem('paystack_public_key', paystackPublicKey);
      setIsPaystackKeySaved(true);
    }
    
    // Fetch overview data
    fetchOverviewData();
  }, [paystackSecretKey, paystackPublicKey]);

  const fetchOverviewData = async () => {
    try {
      // Fetch total orders
      const { count: ordersCount } = await supabase
        .from('nana_orders')
        .select('*', { count: 'exact', head: true });
      
      // Fetch active foods
      const { count: foodsCount } = await supabase
        .from('nana_foods')
        .select('*', { count: 'exact', head: true })
        .eq('is_available', true);
      
      // Fetch total revenue from paid orders
      const { data: revenueData } = await supabase
        .from('nana_orders')
        .select('total_amount')
        .eq('payment_status', 'paid');
      
      // Fetch total customers
      const { count: customersCount } = await supabase
        .from('nana_customers')
        .select('*', { count: 'exact', head: true });
      
      const revenue = revenueData?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      
      setTotalOrders(ordersCount || 0);
      setActiveFoods(foodsCount || 0);
      setTotalRevenue(revenue);
      setTotalCustomers(customersCount || 0);
    } catch (error) {
      console.error('Error fetching overview data:', error);
    }
  };

  const handleSavePaystackKeys = async () => {
    if (!paystackSecretKey.trim() || !paystackPublicKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter both Paystack Secret Key and Public Key",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Save Paystack credentials to local storage
      // TODO: Implement proper settings table and save to database
      localStorage.setItem('paystack_secret_key', paystackSecretKey);
      localStorage.setItem('paystack_public_key', paystackPublicKey);

      setIsPaystackKeySaved(true);
      toast({
        title: "Success",
        description: "Paystack API credentials saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save API credentials",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = () => {
    signOut();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
    navigate("/");
  };

  const handleCreateAdmin = async () => {
    if (!newAdminForm.name.trim() || !newAdminForm.email.trim() || !newAdminForm.password.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (newAdminForm.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingAdmin(true);
    try {
      const { data, error } = await supabase
        .from('nana_admin_users')
        .insert({
          name: newAdminForm.name,
          email: newAdminForm.email,
          password_hash: newAdminForm.password, // In production, this should be properly hashed
          role: newAdminForm.role,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('An admin with this email already exists');
        }
        throw error;
      }

      toast({
        title: "Success",
        description: `Admin ${newAdminForm.name} created successfully`,
      });

      // Reset form
      setNewAdminForm({
        name: "",
        email: "",
        password: "",
        role: "admin"
      });
    } catch (error) {
      console.error('Error creating admin:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create admin",
        variant: "destructive",
      });
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">BiteCraft Dashboard</h1>
              <p className="text-muted-foreground">Manage your food delivery business</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{admin?.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{admin?.email}</p>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="foods" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Foods
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Dashboard Overview</h2>
              <Button variant="outline" onClick={fetchOverviewData}>
                Refresh Data
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{totalOrders}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalOrders === 0 ? "No orders yet" : "Orders received"}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Foods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{activeFoods}</div>
                  <p className="text-xs text-muted-foreground">
                    {activeFoods === 0 ? "Add your first food item" : "Available food items"}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">₵{totalRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalRevenue === 0 ? "Start taking orders" : "From paid orders"}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{totalCustomers}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalCustomers === 0 ? "No customers yet" : "Registered customers"}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Payment Gateway Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={isPaystackKeySaved ? "default" : "secondary"}>
                  {isPaystackKeySaved ? "✓ Configured" : "⚠ Setup Required"}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {isPaystackKeySaved ? "Paystack gateway is ready to process payments" : "Configure Paystack API in Settings"}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <CategoryManagement />
          </TabsContent>

          <TabsContent value="foods" className="space-y-6">
            <FoodManagement />
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <CustomerManagement />
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <MessageCenter />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-xl font-semibold">Settings</h2>
            
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Add New Admin
                  </CardTitle>
                  <CardDescription>
                    Create a new admin user with specific role permissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-name">Full Name *</Label>
                      <Input
                        id="admin-name"
                        placeholder="Enter admin full name"
                        value={newAdminForm.name}
                        onChange={(e) => setNewAdminForm({...newAdminForm, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Email Address *</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder="admin@example.com"
                        value={newAdminForm.email}
                        onChange={(e) => setNewAdminForm({...newAdminForm, email: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-password">Password *</Label>
                      <Input
                        id="admin-password"
                        type="password"
                        placeholder="Enter secure password"
                        value={newAdminForm.password}
                        onChange={(e) => setNewAdminForm({...newAdminForm, password: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum 6 characters required
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-role">Role *</Label>
                      <Select 
                        value={newAdminForm.role} 
                        onValueChange={(value) => setNewAdminForm({...newAdminForm, role: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select admin role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      onClick={handleCreateAdmin} 
                      disabled={isCreatingAdmin}
                      className="w-full flex items-center gap-2"
                    >
                      {isCreatingAdmin ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      {isCreatingAdmin ? "Creating Admin..." : "Create Admin"}
                    </Button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    <p className="font-medium mb-1">Role Descriptions:</p>
                    <ul className="space-y-1 text-xs">
                      <li><strong>Admin:</strong> Can manage orders, customers, and food items</li>
                      <li><strong>Super Admin:</strong> Full access including admin management</li>
                      <li><strong>Manager:</strong> Can manage orders and view reports</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Paystack Payment Gateway Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure Paystack payment gateway for processing payments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="paystack-secret-key">Paystack Secret Key</Label>
                      <Input
                        id="paystack-secret-key"
                        type="password"
                        placeholder="e.g., sk_live_..."
                        value={paystackSecretKey}
                        onChange={(e) => setPaystackSecretKey(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="paystack-public-key">Paystack Public Key</Label>
                      <Input
                        id="paystack-public-key"
                        placeholder="e.g., pk_live_..."
                        value={paystackPublicKey}
                        onChange={(e) => setPaystackPublicKey(e.target.value)}
                      />
                    </div>
                    
                    <Button onClick={handleSavePaystackKeys} className="w-full flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Save Paystack Credentials
                    </Button>
                    
                    <p className="text-sm text-muted-foreground">
                      Copy both Secret Key and Public Key from your Paystack dashboard
                    </p>
                  </div>
                  
                  {isPaystackKeySaved && (
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <div className="flex items-center gap-2 text-primary">
                        <CreditCard className="w-4 h-4" />
                        <span className="font-medium">Payment Gateway Active</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Paystack payment gateway is configured and ready to process payments
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                  <CardDescription>
                    Update your business contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="business-phone">Business Phone</Label>
                      <Input
                        id="business-phone"
                        defaultValue="+233 243 762 748"
                        placeholder="Business phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business-email">Business Email</Label>
                      <Input
                        id="business-email"
                        type="email"
                        defaultValue="michaelquaicoe60@gmail.com"
                        placeholder="Business email address"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business-address">Business Address</Label>
                    <Textarea
                      id="business-address"
                      placeholder="Enter your business address"
                      rows={3}
                    />
                  </div>
                  <Button className="w-full">Update Business Information</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}