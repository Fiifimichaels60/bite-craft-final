import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Database, 
  Trash2, 
  RefreshCw, 
  Activity,
  HardDrive,
  Clock,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface SystemStats {
  totalOrders: number;
  oldOrders: number;
  totalCustomers: number;
  totalFoods: number;
  totalCategories: number;
  databaseSize: string;
  lastCleanup: string | null;
}

const SystemPerformance = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      setLoading(true);

      // Get counts from all tables
      const [ordersCount, customersCount, foodsCount, categoriesCount] = await Promise.all([
        supabase.from('nana_orders').select('*', { count: 'exact', head: true }),
        supabase.from('nana_customers').select('*', { count: 'exact', head: true }),
        supabase.from('nana_foods').select('*', { count: 'exact', head: true }),
        supabase.from('nana_categories').select('*', { count: 'exact', head: true })
      ]);

      // Get old orders (delivered/rejected > 7 days ago)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: oldOrdersCount } = await supabase
        .from('nana_orders')
        .select('*', { count: 'exact', head: true })
        .or(`and(status.eq.delivered,delivered_at.lt.${sevenDaysAgo.toISOString()}),and(status.eq.rejected,rejected_at.lt.${sevenDaysAgo.toISOString()})`);

      setStats({
        totalOrders: ordersCount.count || 0,
        oldOrders: oldOrdersCount || 0,
        totalCustomers: customersCount.count || 0,
        totalFoods: foodsCount.count || 0,
        totalCategories: categoriesCount.count || 0,
        databaseSize: "~2.5MB", // Estimated
        lastCleanup: localStorage.getItem('last_cleanup') || null
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch system statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runCleanup = async () => {
    setCleaning(true);
    try {
      // Call the cleanup function
      const { error } = await supabase.rpc('cleanup_old_orders');
      
      if (error) throw error;

      // Store cleanup timestamp
      localStorage.setItem('last_cleanup', new Date().toISOString());

      toast({
        title: "Cleanup Complete",
        description: "Old orders have been cleaned up successfully",
      });

      fetchSystemStats();
    } catch (error) {
      console.error('Error running cleanup:', error);
      toast({
        title: "Error",
        description: "Failed to run cleanup",
        variant: "destructive",
      });
    } finally {
      setCleaning(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
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
            <Activity className="h-5 w-5" />
            System Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Database Records</span>
              </div>
              <div className="space-y-1 text-sm">
                <p>Orders: {stats?.totalOrders}</p>
                <p>Customers: {stats?.totalCustomers}</p>
                <p>Foods: {stats?.totalFoods}</p>
                <p>Categories: {stats?.totalCategories}</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="h-4 w-4 text-green-500" />
                <span className="font-medium">Storage</span>
              </div>
              <div className="space-y-1 text-sm">
                <p>Database Size: {stats?.databaseSize}</p>
                <p>Old Orders: {stats?.oldOrders}</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="font-medium">Maintenance</span>
              </div>
              <div className="space-y-1 text-sm">
                <p>Last Cleanup: {stats?.lastCleanup ? new Date(stats.lastCleanup).toLocaleDateString() : 'Never'}</p>
                <p>Status: {stats?.oldOrders && stats.oldOrders > 50 ? 'Needs Cleanup' : 'Good'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Database Cleanup</h4>
                <p className="text-sm text-muted-foreground">
                  Remove old delivered/rejected orders to improve performance
                </p>
                {stats?.oldOrders && stats.oldOrders > 0 && (
                  <Badge variant="outline" className="mt-2">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {stats.oldOrders} old orders found
                  </Badge>
                )}
              </div>
              <Button 
                onClick={runCleanup} 
                disabled={cleaning}
                variant={stats?.oldOrders && stats.oldOrders > 50 ? "default" : "outline"}
              >
                {cleaning ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {cleaning ? "Cleaning..." : "Run Cleanup"}
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Refresh System Data</h4>
                <p className="text-sm text-muted-foreground">
                  Update all statistics and refresh cached data
                </p>
              </div>
              <Button onClick={fetchSystemStats} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Stats
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}