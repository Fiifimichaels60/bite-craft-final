import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Package,
  Calendar,
  Target
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

interface GrowthData {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  totalCustomers: number;
  customersGrowth: number;
  averageOrderValue: number;
  aovGrowth: number;
  topProducts: Array<{
    name: string;
    orders: number;
    revenue: number;
  }>;
  customerSegments: Array<{
    segment: string;
    count: number;
    percentage: number;
  }>;
  acquisitionChannels: Array<{
    channel: string;
    customers: number;
    percentage: number;
  }>;
  revenueChart: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

const GrowthMetrics = () => {
  const [data, setData] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");

  useEffect(() => {
    fetchGrowthData();
  }, [timeRange]);

  const fetchGrowthData = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const previousStartDate = new Date(startDate.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      // Fetch current period data
      const { data: currentOrders } = await supabase
        .from('nana_orders')
        .select(`
          total_amount,
          delivery_fee,
          created_at,
          customer_id,
          order_items:nana_order_items(
            quantity,
            total_price,
            food:nana_foods(name)
          )
        `)
        .gte('created_at', startDate.toISOString())
        .eq('payment_status', 'paid');

      // Fetch previous period data for comparison
      const { data: previousOrders } = await supabase
        .from('nana_orders')
        .select('total_amount, delivery_fee, customer_id')
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString())
        .eq('payment_status', 'paid');

      // Fetch all customers for segmentation
      const { data: allCustomers } = await supabase
        .from('nana_customers')
        .select(`
          id,
          created_at,
          orders:nana_orders(total_amount, payment_status)
        `);

      // Calculate metrics
      const currentRevenue = currentOrders?.reduce((sum, order) => 
        sum + Number(order.total_amount) + Number(order.delivery_fee), 0) || 0;
      
      const previousRevenue = previousOrders?.reduce((sum, order) => 
        sum + Number(order.total_amount) + Number(order.delivery_fee), 0) || 0;

      const revenueGrowth = previousRevenue > 0 
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;

      const currentOrdersCount = currentOrders?.length || 0;
      const previousOrdersCount = previousOrders?.length || 0;
      const ordersGrowth = previousOrdersCount > 0 
        ? ((currentOrdersCount - previousOrdersCount) / previousOrdersCount) * 100 
        : 0;

      const currentCustomers = new Set(currentOrders?.map(o => o.customer_id)).size;
      const previousCustomers = new Set(previousOrders?.map(o => o.customer_id)).size;
      const customersGrowth = previousCustomers > 0 
        ? ((currentCustomers - previousCustomers) / previousCustomers) * 100 
        : 0;

      const averageOrderValue = currentOrdersCount > 0 ? currentRevenue / currentOrdersCount : 0;
      const previousAOV = previousOrdersCount > 0 ? previousRevenue / previousOrdersCount : 0;
      const aovGrowth = previousAOV > 0 ? ((averageOrderValue - previousAOV) / previousAOV) * 100 : 0;

      // Top products
      const productSales = new Map();
      currentOrders?.forEach(order => {
        order.order_items?.forEach(item => {
          const name = item.food?.name || 'Unknown';
          if (!productSales.has(name)) {
            productSales.set(name, { orders: 0, revenue: 0 });
          }
          const current = productSales.get(name);
          current.orders += item.quantity;
          current.revenue += Number(item.total_price);
        });
      });

      const topProducts = Array.from(productSales.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Customer segmentation
      const customerSegments = [
        { segment: "New Customers", count: 0, percentage: 0 },
        { segment: "Regular Customers", count: 0, percentage: 0 },
        { segment: "VIP Customers", count: 0, percentage: 0 },
      ];

      allCustomers?.forEach(customer => {
        const paidOrders = customer.orders?.filter(o => o.payment_status === 'paid') || [];
        const totalSpent = paidOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
        
        if (paidOrders.length === 0) {
          customerSegments[0].count++;
        } else if (totalSpent < 100) {
          customerSegments[1].count++;
        } else {
          customerSegments[2].count++;
        }
      });

      const totalCustomersCount = allCustomers?.length || 1;
      customerSegments.forEach(segment => {
        segment.percentage = (segment.count / totalCustomersCount) * 100;
      });

      // Mock acquisition channels (in real app, track referral sources)
      const acquisitionChannels = [
        { channel: "Direct", customers: Math.floor(totalCustomersCount * 0.4), percentage: 40 },
        { channel: "Social Media", customers: Math.floor(totalCustomersCount * 0.3), percentage: 30 },
        { channel: "Word of Mouth", customers: Math.floor(totalCustomersCount * 0.2), percentage: 20 },
        { channel: "Other", customers: Math.floor(totalCustomersCount * 0.1), percentage: 10 },
      ];

      // Revenue chart data (last 7 days)
      const revenueChart = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayOrders = currentOrders?.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate.toDateString() === date.toDateString();
        }) || [];
        
        const dayRevenue = dayOrders.reduce((sum, order) => 
          sum + Number(order.total_amount) + Number(order.delivery_fee), 0);
        
        revenueChart.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: dayRevenue,
          orders: dayOrders.length
        });
      }

      setData({
        totalRevenue: currentRevenue,
        revenueGrowth,
        totalOrders: currentOrdersCount,
        ordersGrowth,
        totalCustomers: currentCustomers,
        customersGrowth,
        averageOrderValue,
        aovGrowth,
        topProducts,
        customerSegments,
        acquisitionChannels,
        revenueChart
      });
    } catch (error) {
      console.error('Error fetching growth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span className="text-xs">{Math.abs(growth).toFixed(1)}%</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex gap-2 mb-4">
        {["7d", "30d", "90d"].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              timeRange === range 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵{data.totalRevenue.toFixed(2)}</div>
            {formatGrowth(data.revenueGrowth)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalOrders}</div>
            {formatGrowth(data.ordersGrowth)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Active Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCustomers}</div>
            {formatGrowth(data.customersGrowth)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              Avg Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵{data.averageOrderValue.toFixed(2)}</div>
            {formatGrowth(data.aovGrowth)}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[200px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.revenueChart}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="var(--color-revenue)" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.orders} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">GH₵{product.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Segments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.customerSegments.map((segment, index) => (
                <div key={segment.segment} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{segment.segment}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{segment.count}</p>
                    <p className="text-xs text-muted-foreground">{segment.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Acquisition Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acquisition Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.acquisitionChannels.map((channel, index) => (
                <div key={channel.channel} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{channel.channel}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{channel.customers}</p>
                    <p className="text-xs text-muted-foreground">{channel.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GrowthMetrics;