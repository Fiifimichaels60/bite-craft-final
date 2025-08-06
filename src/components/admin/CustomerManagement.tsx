import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  MessageCircle,
  Eye,
  Filter
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  national_id: string | null;
  created_at: string;
  updated_at: string;
  total_orders?: number;
  total_spent?: number;
}

interface CustomerOrder {
  id: string;
  total_amount: number;
  delivery_fee: number;
  order_type: string;
  status: string;
  payment_status: string;
  created_at: string;
  order_items: Array<{
    quantity: number;
    unit_price: number;
    total_price: number;
    food: {
      name: string;
    };
  }>;
}

const CustomerManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      // Fetch customers with order stats
      const { data: customersData, error: customersError } = await supabase
        .from('nana_customers')
        .select(`
          *,
          orders:nana_orders(count)
        `)
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      // Calculate total spent for each customer
      const customersWithStats = await Promise.all(
        customersData.map(async (customer) => {
          const { data: orderStats } = await supabase
            .from('nana_orders')
            .select('total_amount, delivery_fee')
            .eq('customer_id', customer.id)
            .eq('payment_status', 'paid');

          const totalSpent = orderStats?.reduce(
            (sum, order) => sum + Number(order.total_amount) + Number(order.delivery_fee),
            0
          ) || 0;

          return {
            ...customer,
            total_orders: customer.orders?.length || 0,
            total_spent: totalSpent,
          };
        })
      );

      setCustomers(customersWithStats);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerOrders = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('nana_orders')
        .select(`
          *,
          order_items:nana_order_items(
            quantity,
            unit_price,
            total_price,
            food:nana_foods(name)
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomerOrders(data || []);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customer orders",
        variant: "destructive",
      });
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    fetchCustomerOrders(customer.id);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    (customer.email ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'total_orders':
        return (b.total_orders || 0) - (a.total_orders || 0);
      case 'total_spent':
        return (b.total_spent || 0) - (a.total_spent || 0);
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const getStatusBadge = (status: string) => {
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Customer Management</h2>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Customer Management</h2>
          <p className="text-sm text-muted-foreground">
            View and manage your customers ({customers.length} total)
          </p>
        </div>
        <Badge variant="outline" className="text-primary">
          <Users className="w-4 h-4 mr-1" />
          {customers.length} Customers
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <DownloadActions type="customers" />
            </div>
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32 sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Latest Registered</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="total_orders">Most Orders</SelectItem>
                  <SelectItem value="total_spent">Highest Spent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>
                {searchTerm 
                  ? "No customers found matching your search." 
                  : "No customers yet. They'll appear here after placing orders."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="hidden sm:table-cell">Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead className="hidden lg:table-cell">Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          {customer.national_id && (
                            <div className="text-sm text-muted-foreground">
                              ID: {customer.national_id}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3" />
                            {customer.phone}
                          </div>
                          {customer.email && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              {customer.email}
                            </div>
                          )}
                          {customer.address && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground hidden md:flex">
                              <MapPin className="w-3 h-3" />
                              {customer.address}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary">
                          {customer.total_orders} orders
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">
                          GH₵{customer.total_spent?.toFixed(2) || '0.00'}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(customer.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCustomer(customer)}
                            >
                              <Eye className="w-4 h-4 sm:mr-2" />
                              <span className="hidden sm:inline">View Details</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Customer Details</DialogTitle>
                              <DialogDescription>
                                Complete information and order history for {selectedCustomer?.name}
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedCustomer && (
                              <div className="space-y-6">
                                {/* Customer Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                                  <div>
                                    <h4 className="font-semibold mb-2">Personal Information</h4>
                                    <div className="space-y-2 text-sm">
                                      <p><span className="font-medium">Name:</span> {selectedCustomer.name}</p>
                                      <p><span className="font-medium">Phone:</span> {selectedCustomer.phone}</p>
                                      {selectedCustomer.email && (
                                        <p><span className="font-medium">Email:</span> {selectedCustomer.email}</p>
                                      )}
                                      {selectedCustomer.national_id && (
                                        <p><span className="font-medium">National ID:</span> {selectedCustomer.national_id}</p>
                                      )}
                                      {selectedCustomer.address && (
                                        <p><span className="font-medium">Address:</span> {selectedCustomer.address}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold mb-2">Statistics</h4>
                                    <div className="space-y-2 text-sm">
                                      <p><span className="font-medium">Total Orders:</span> {selectedCustomer.total_orders}</p>
                                      <p><span className="font-medium">Total Spent:</span> GH₵{selectedCustomer.total_spent?.toFixed(2)}</p>
                                      <p><span className="font-medium">Member Since:</span> {new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
                                      <p><span className="font-medium">Last Updated:</span> {new Date(selectedCustomer.updated_at).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Order History */}
                                <div>
                                  <h4 className="font-semibold mb-4">Order History</h4>
                                  {customerOrders.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">No orders found</p>
                                  ) : (
                                    <div className="space-y-4">
                                      {customerOrders.map((order) => (
                                        <div key={order.id} className="border rounded-lg p-4">
                                          <div className="flex justify-between items-start mb-3">
                                            <div>
                                              <h5 className="font-medium">Order #{order.id.slice(0, 8)}</h5>
                                              <p className="text-sm text-muted-foreground">
                                                {new Date(order.created_at).toLocaleString()}
                                              </p>
                                            </div>
                                            <div className="text-right">
                                              {getStatusBadge(order.status)}
                                              <p className="text-sm font-medium mt-1">
                                                GH₵{(Number(order.total_amount) + Number(order.delivery_fee)).toFixed(2)}
                                              </p>
                                            </div>
                                          </div>
                                          
                                          <div className="space-y-2">
                                            {order.order_items.map((item, index) => (
                                              <div key={index} className="flex justify-between text-sm">
                                                <span>{item.quantity}× {item.food.name}</span>
                                                <span>GH₵{item.total_price.toFixed(2)}</span>
                                              </div>
                                            ))}
                                            <div className="border-t pt-2 text-sm">
                                              <div className="flex justify-between">
                                                <span>Subtotal:</span>
                                                <span>GH₵{order.total_amount.toFixed(2)}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span>Delivery:</span>
                                                <span>GH₵{order.delivery_fee.toFixed(2)}</span>
                                              </div>
                                              <div className="flex justify-between font-medium">
                                                <span>Total:</span>
                                                <span>GH₵{(Number(order.total_amount) + Number(order.delivery_fee)).toFixed(2)}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
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
};

export default CustomerManagement;