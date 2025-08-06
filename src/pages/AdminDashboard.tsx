import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useNavigate } from "react-router-dom";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { ThemeProvider, useTheme } from "@/components/ui/theme-provider";
import { NotificationBadge } from "@/components/admin/NotificationBadge";
import GrowthMetrics from "@/components/admin/GrowthMetrics";
import SuperAdminSettings from "@/components/admin/SuperAdminSettings";
import FoodManagement from "@/components/admin/FoodManagement";
import CategoryManagement from "@/components/admin/CategoryManagement";
import CustomerManagement from "@/components/admin/CustomerManagement";
import OrderManagement from "@/components/admin/OrderManagement";
import MessageCenter from "@/components/admin/MessageCenter";
import { supabase } from "@/integrations/supabase/client";
import { 
  Settings, 
  Package, 
  ShoppingCart,
  Users,
  LogOut,
  Shield,
  Moon,
  Sun,
  Monitor,
  MessageCircle,
  Bell
} from "lucide-react";

function AdminDashboardContent() {
  const { toast } = useToast();
  const { admin, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  
  // Overview data states
  const [totalOrders, setTotalOrders] = useState(0);
  const [activeFoods, setActiveFoods] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  
  // Notification states
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [newCustomers, setNewCustomers] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  // Auto logout after 30 minutes of inactivity
  useAutoLogout({
    onLogout: () => {
      signOut();
      toast({
        title: "Session Expired",
        description: "You have been logged out due to inactivity.",
        variant: "destructive",
      });
      navigate("/admin/login");
    },
    timeoutMinutes: 30
  });

  useEffect(() => {
    fetchOverviewData();
    fetchNotificationCounts();
    
    // Set up real-time subscriptions for notifications
    const ordersChannel = supabase
      .channel('admin-orders-notifications')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'nana_orders' },
        () => fetchNotificationCounts()
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('admin-messages-notifications')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'nana_chat_messages' },
        () => fetchNotificationCounts()
      )
      .subscribe();

    const customersChannel = supabase
      .channel('admin-customers-notifications')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'nana_customers' },
        () => fetchNotificationCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(customersChannel);
    };
  }, []);

  const fetchNotificationCounts = async () => {
    try {
      // Unread messages count
      const { count: messagesCount } = await supabase
        .from('nana_chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_type', 'customer')
        .eq('is_read', false);

      // Pending orders count
      const { count: ordersCount } = await supabase
        .from('nana_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // New customers (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { count: customersCount } = await supabase
        .from('nana_customers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());

      setUnreadMessages(messagesCount || 0);
      setPendingOrders(ordersCount || 0);
      setNewCustomers(customersCount || 0);
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    }
  };

  const clearNotifications = (tabName: string) => {
    setActiveTab(tabName);
    
    // Clear relevant notifications when tab is opened
    if (tabName === 'chat') {
      setUnreadMessages(0);
    } else if (tabName === 'orders') {
      setPendingOrders(0);
    } else if (tabName === 'customers') {
      setNewCustomers(0);
    }
  };
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

  const handleSignOut = () => {
    signOut();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">BiteCraft Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage your food delivery business</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Theme Switcher */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light")}
                className="h-9 w-9"
              >
                {theme === "light" && <Sun className="h-4 w-4" />}
                {theme === "dark" && <Moon className="h-4 w-4" />}
                {theme === "system" && <Monitor className="h-4 w-4" />}
              </Button>
              
              <div className="text-right hidden sm:block">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-xs sm:text-sm font-medium">{admin?.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{admin?.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={clearNotifications} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-7 min-w-[600px]">
              <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Package className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Home</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Categories</span>
                <span className="sm:hidden">Cat</span>
              </TabsTrigger>
              <TabsTrigger value="foods" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Package className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Foods</span>
                <span className="sm:hidden">Food</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm relative">
                <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Orders</span>
                <span className="sm:hidden">Orders</span>
                <NotificationBadge count={pendingOrders} />
              </TabsTrigger>
              <TabsTrigger value="customers" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm relative">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Customers</span>
                <span className="sm:hidden">Users</span>
                {newCustomers > 0 && <NotificationBadge count={newCustomers} />}
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm relative">
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Chat</span>
                <span className="sm:hidden">Chat</span>
                {unreadMessages > 0 && <NotificationBadge count={unreadMessages} />}
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Settings</span>
                <span className="sm:hidden">Set</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-lg sm:text-xl font-semibold">Dashboard Overview</h2>
              <Button variant="outline" size="sm" onClick={fetchOverviewData}>
                Refresh Data
              </Button>
            </div>
            
            {/* Basic Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <Card>
                <CardHeader className="pb-2 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Orders</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="text-lg sm:text-2xl font-bold text-primary">{totalOrders}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalOrders === 0 ? "No orders yet" : "Orders received"}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Active Foods</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="text-lg sm:text-2xl font-bold text-primary">{activeFoods}</div>
                  <p className="text-xs text-muted-foreground">
                    {activeFoods === 0 ? "Add your first food item" : "Available food items"}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="text-lg sm:text-2xl font-bold text-primary">₵{totalRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalRevenue === 0 ? "Start taking orders" : "From paid orders"}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Customers</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="text-lg sm:text-2xl font-bold text-primary">{totalCustomers}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalCustomers === 0 ? "No customers yet" : "Registered customers"}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Growth Metrics */}
            <GrowthMetrics />
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
            <div className="space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold">Settings</h2>
              
              <SuperAdminSettings />
              
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

export default function AdminDashboard() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="admin-ui-theme">
      <AdminDashboardContent />
    </ThemeProvider>
  );
}