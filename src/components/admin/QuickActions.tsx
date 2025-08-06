import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Zap, 
  Package, 
  Users, 
  ShoppingCart,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

interface QuickStats {
  pendingOrders: number;
  lowStockItems: number;
  newCustomers: number;
  unpaidOrders: number;
}

const QuickActions = () => {
  const [stats, setStats] = useState<QuickStats>({
    pendingOrders: 0,
    lowStockItems: 0,
    newCustomers: 0,
    unpaidOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchQuickStats = async () => {
    try {
      setLoading(true);

      // Get pending orders
      const { count: pendingCount } = await supabase
        .from('nana_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get unpaid orders
      const { count: unpaidCount } = await supabase
        .from('nana_orders')
        .select('*', { count: 'exact', head: true })
        .eq('payment_status', 'pending');

      // Get new customers (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: newCustomersCount } = await supabase
        .from('nana_customers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      // Get unavailable foods (simulating low stock)
      const { count: unavailableCount } = await supabase
        .from('nana_foods')
        .select('*', { count: 'exact', head: true })
        .eq('is_available', false);

      setStats({
        pendingOrders: pendingCount || 0,
        lowStockItems: unavailableCount || 0,
        newCustomers: newCustomersCount || 0,
        unpaidOrders: unpaidCount || 0
      });
    } catch (error) {
      console.error('Error fetching quick stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllPendingAsPaid = async () => {
    try {
      const { error } = await supabase
        .from('nana_orders')
        .update({ 
          payment_status: 'paid',
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('payment_status', 'pending');

      if (error) throw error;

      toast({
        title: "Success",
        description: "All pending orders marked as paid",
      });

      fetchQuickStats();
    } catch (error) {
      console.error('Error updating orders:', error);
      toast({
        title: "Error",
        description: "Failed to update orders",
        variant: "destructive",
      });
    }
  };

  const enableAllFoods = async () => {
    try {
      const { error } = await supabase
        .from('nana_foods')
        .update({ 
          is_available: true,
          updated_at: new Date().toISOString()
        })
        .eq('is_available', false);

      if (error) throw error;

      toast({
        title: "Success",
        description: "All foods enabled and available",
      });

      fetchQuickStats();
    } catch (error) {
      console.error('Error enabling foods:', error);
      toast({
        title: "Error",
        description: "Failed to enable foods",
        variant: "destructive",
      });
    }
  };

  useState(() => {
    fetchQuickStats();
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pending Orders */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">Pending Orders</span>
                </div>
                <Badge variant={stats.pendingOrders > 0 ? "destructive" : "secondary"}>
                  {stats.pendingOrders}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Orders waiting for confirmation
              </p>
              {stats.pendingOrders > 0 && (
                <Button size="sm" className="w-full" onClick={markAllPendingAsPaid}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark All as Paid
                </Button>
              )}
            </div>

            {/* Unpaid Orders */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="font-medium">Unpaid Orders</span>
                </div>
                <Badge variant={stats.unpaidOrders > 0 ? "destructive" : "secondary"}>
                  {stats.unpaidOrders}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Orders with pending payment
              </p>
              {stats.unpaidOrders > 0 && (
                <Button size="sm" variant="outline" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  View Unpaid Orders
                </Button>
              )}
            </div>

            {/* Unavailable Foods */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Unavailable Foods</span>
                </div>
                <Badge variant={stats.lowStockItems > 0 ? "destructive" : "secondary"}>
                  {stats.lowStockItems}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Food items marked as unavailable
              </p>
              {stats.lowStockItems > 0 && (
                <Button size="sm" variant="outline" className="w-full" onClick={enableAllFoods}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Enable All Foods
                </Button>
              )}
            </div>

            {/* New Customers */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <span className="font-medium">New Customers</span>
                </div>
                <Badge variant="secondary">
                  {stats.newCustomers}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Customers joined in last 7 days
              </p>
              <Button size="sm" variant="outline" className="w-full" onClick={fetchQuickStats}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Stats
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemPerformance;