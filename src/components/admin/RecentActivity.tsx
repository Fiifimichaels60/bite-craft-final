import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  Activity, 
  ShoppingCart, 
  Users, 
  Package,
  Clock,
  TrendingUp
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'order' | 'customer' | 'food';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

const RecentActivity = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);
      const activities: ActivityItem[] = [];

      // Get recent orders
      const { data: recentOrders } = await supabase
        .from('nana_orders')
        .select(`
          id,
          status,
          payment_status,
          order_type,
          total_amount,
          created_at,
          customer:nana_customers(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      recentOrders?.forEach(order => {
        activities.push({
          id: order.id,
          type: 'order',
          title: `New ${order.order_type} order`,
          description: `${order.customer?.name} - ₵${order.total_amount}`,
          timestamp: order.created_at,
          status: order.status
        });
      });

      // Get recent customers
      const { data: recentCustomers } = await supabase
        .from('nana_customers')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      recentCustomers?.forEach(customer => {
        activities.push({
          id: customer.id,
          type: 'customer',
          title: 'New customer registered',
          description: customer.name,
          timestamp: customer.created_at
        });
      });

      // Get recently added foods
      const { data: recentFoods } = await supabase
        .from('nana_foods')
        .select('id, name, price, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      recentFoods?.forEach(food => {
        activities.push({
          id: food.id,
          type: 'food',
          title: 'New food item added',
          description: `${food.name} - ₵${food.price}`,
          timestamp: food.created_at
        });
      });

      // Sort all activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setActivities(activities.slice(0, 10));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-4 w-4 text-blue-500" />;
      case 'customer':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'food':
        return <Package className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      preparing: "bg-orange-100 text-orange-800",
      ready: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 border rounded">
                <div className="w-8 h-8 bg-muted rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div key={`${activity.type}-${activity.id}`} className="flex items-center gap-3 p-3 border rounded hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">{activity.title}</p>
                    {activity.status && getStatusBadge(activity.status)}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;