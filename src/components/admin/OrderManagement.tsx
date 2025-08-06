import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  ShoppingCart, 
  Search, 
  Filter,
  Eye,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
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

interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  delivery_fee: number;
  order_type: string;
  status: string;
  payment_status: string;
  payment_reference: string | null;
  notes: string | null;
  delivery_address: string | null;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
  rejected_at: string | null;
  customer: {
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
  };
  order_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    food: {
      name: string;
      description: string | null;
    };
  }>;
}

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    
    // Set up real-time subscription for orders
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nana_orders'
        },
        () => {
          fetchOrders(); // Refresh orders when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('nana_orders')
        .select(`
          *,
          customer:nana_customers(
            name,
            phone,
            email,
            address
          ),
          order_items:nana_order_items(
            id,
            quantity,
            unit_price,
            total_price,
            food:nana_foods(
              name,
              description
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus, updated_at: new Date().toISOString() };
      
      if (newStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      } else if (newStatus === 'rejected') {
        updateData.rejected_at = new Date().toISOString();
      }

      const { data: updatedOrder, error } = await supabase
        .from('nana_orders')
        .update(updateData)
        .eq('id', orderId)
        .select(`
          *,
          customer:nana_customers(name, email)
        `)
        .single();

      if (error) throw error;

      // Send email notification to customer
      if (updatedOrder && updatedOrder.customer?.email && newStatus === 'ready') {
        try {
          await supabase.functions.invoke('send-order-notification', {
            body: {
              to: updatedOrder.customer.email,
              customerName: updatedOrder.customer.name,
              orderId: orderId.slice(0, 8),
              status: newStatus,
              orderType: updatedOrder.order_type
            }
          });
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
          // Don't fail the status update if email fails
        }
      }

      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      });

      fetchOrders(); // Refresh the orders list
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const markAsPaid = async (orderId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manual-payment-update', {
        body: {
          order_id: orderId,
          payment_status: 'paid',
          order_status: 'confirmed'
        }
      });

      if (error) throw error;

      toast({
        title: "Payment Updated",
        description: "Order marked as paid and confirmed",
      });

      fetchOrders();
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast({
        title: "Error",
        description: "Failed to mark order as paid",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'preparing':
        return <Package className="w-4 h-4" />;
      case 'ready':
        return <AlertCircle className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { class: "bg-yellow-100 text-yellow-800", label: "Pending" },
      confirmed: { class: "bg-blue-100 text-blue-800", label: "Confirmed" },
      preparing: { class: "bg-orange-100 text-orange-800", label: "Preparing" },
      ready: { class: "bg-purple-100 text-purple-800", label: "Ready" },
      delivered: { class: "bg-green-100 text-green-800", label: "Delivered" },
      rejected: { class: "bg-red-100 text-red-800", label: "Rejected" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge className={config.class}>
        {getStatusIcon(status)}
        <span className="ml-1">{config.label}</span>
      </Badge>
    );
  };

  const getPaymentBadge = (paymentStatus: string) => {
    const config = {
      pending: { class: "bg-yellow-100 text-yellow-800", label: "Pending" },
      paid: { class: "bg-green-100 text-green-800", label: "Paid" },
      failed: { class: "bg-red-100 text-red-800", label: "Failed" },
    };

    const paymentConfig = config[paymentStatus as keyof typeof config] || config.pending;
    
    return (
      <Badge className={paymentConfig.class}>
        <CreditCard className="w-3 h-3 mr-1" />
        {paymentConfig.label}
      </Badge>
    );
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.phone.includes(searchTerm) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || order.payment_status === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Order Management</h2>
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
          <h2 className="text-xl font-semibold">Order Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage incoming orders and track their status ({orders.length} total)
          </p>
        </div>
        <Badge variant="outline" className="text-primary">
          <ShoppingCart className="w-4 h-4 mr-1" />
          {orders.length} Orders
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <DownloadActions type="orders" />
            </div>
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer name, phone, or order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-40">
                  <CreditCard className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>
                {searchTerm || statusFilter !== "all" || paymentFilter !== "all"
                  ? "No orders found matching your filters."
                  : "No orders yet. Once customers start ordering, they'll appear here."
                }
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden sm:table-cell">Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Payment</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">#{order.id.slice(0, 8)}</div>
                          <div className="text-xs text-muted-foreground">
                            {order.order_type === 'delivery' ? 'Delivery' : 'Pickup'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-1 text-sm">
                            <User className="w-3 h-3" />
                            {order.customer.name}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {order.customer.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="text-sm">
                          {order.order_items.length} item(s)
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">
                            GH₵{(Number(order.total_amount) + Number(order.delivery_fee)).toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            +₵{order.delivery_fee.toFixed(2)} delivery
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          {getPaymentBadge(order.payment_status)}
                          {order.payment_status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAsPaid(order.id)}
                              className="text-xs"
                            >
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="w-4 h-4 sm:mr-2" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Order Details</DialogTitle>
                              <DialogDescription>
                                Complete information for order #{selectedOrder?.id.slice(0, 8)}
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedOrder && (
                              <div className="space-y-6">
                                {/* Order Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                                  <div>
                                    <h4 className="font-semibold mb-2">Order Information</h4>
                                    <div className="space-y-2 text-sm">
                                      <p><span className="font-medium">Order ID:</span> {selectedOrder.id}</p>
                                      <p><span className="font-medium">Type:</span> {selectedOrder.order_type}</p>
                                      <p><span className="font-medium">Status:</span> {getStatusBadge(selectedOrder.status)}</p>
                                      <p><span className="font-medium">Payment:</span> {getPaymentBadge(selectedOrder.payment_status)}</p>
                                      <p><span className="font-medium">Reference:</span> {selectedOrder.payment_reference || 'N/A'}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold mb-2">Customer Information</h4>
                                    <div className="space-y-2 text-sm">
                                      <p><span className="font-medium">Name:</span> {selectedOrder.customer.name}</p>
                                      <p><span className="font-medium">Phone:</span> {selectedOrder.customer.phone}</p>
                                      {selectedOrder.customer.email && (
                                        <p><span className="font-medium">Email:</span> {selectedOrder.customer.email}</p>
                                      )}
                                      {selectedOrder.delivery_address && (
                                        <p><span className="font-medium">Delivery Address:</span> {selectedOrder.delivery_address}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Order Items */}
                                <div>
                                  <h4 className="font-semibold mb-4">Order Items</h4>
                                  <div className="space-y-3">
                                    {selectedOrder.order_items.map((item) => (
                                      <div key={item.id} className="flex justify-between items-center p-3 border rounded">
                                        <div>
                                          <h5 className="font-medium">{item.food.name}</h5>
                                          {item.food.description && (
                                            <p className="text-sm text-muted-foreground">{item.food.description}</p>
                                          )}
                                          <p className="text-sm">
                                            {item.quantity} × GH₵{item.unit_price.toFixed(2)}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-medium">GH₵{item.total_price.toFixed(2)}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Order Total */}
                                <div className="border-t pt-4">
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span>Subtotal:</span>
                                      <span>GH₵{selectedOrder.total_amount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Delivery Fee:</span>
                                      <span>GH₵{selectedOrder.delivery_fee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                                      <span>Total:</span>
                                      <span>GH₵{(Number(selectedOrder.total_amount) + Number(selectedOrder.delivery_fee)).toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Status Update */}
                                <div className="space-y-4">
                                  <h4 className="font-semibold">Update Order Status</h4>
                                  <div className="flex gap-2 flex-wrap">
                                    {['confirmed', 'preparing', 'ready', 'delivered', 'rejected'].map((status) => (
                                      <Button
                                        key={status}
                                        variant={selectedOrder.status === status ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => updateOrderStatus(selectedOrder.id, status)}
                                        disabled={selectedOrder.status === status}
                                      >
                                        {getStatusIcon(status)}
                                        <span className="ml-1 capitalize">{status}</span>
                                      </Button>
                                    ))}
                                  </div>
                                 </div>

                                 {/* Payment Status Update */}
                                 {selectedOrder.payment_status === 'pending' && (
                                   <div className="space-y-4">
                                     <h4 className="font-semibold">Payment Actions</h4>
                                     <Button
                                       onClick={() => markAsPaid(selectedOrder.id)}
                                       className="bg-green-600 hover:bg-green-700"
                                     >
                                       <CreditCard className="w-4 h-4 mr-2" />
                                       Mark as Paid & Confirm Order
                                     </Button>
                                   </div>
                                 )}

                                 {/* Notes */}
                                {selectedOrder.notes && (
                                  <div>
                                    <h4 className="font-semibold mb-2">Order Notes</h4>
                                    <p className="text-sm p-3 bg-muted rounded">{selectedOrder.notes}</p>
                                  </div>
                                )}

                                {/* Timestamps */}
                                <div className="text-xs text-muted-foreground space-y-1">
                                  <p>Created: {new Date(selectedOrder.created_at).toLocaleString()}</p>
                                  <p>Updated: {new Date(selectedOrder.updated_at).toLocaleString()}</p>
                                  {selectedOrder.delivered_at && (
                                    <p>Delivered: {new Date(selectedOrder.delivered_at).toLocaleString()}</p>
                                  )}
                                  {selectedOrder.rejected_at && (
                                    <p>Rejected: {new Date(selectedOrder.rejected_at).toLocaleString()}</p>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderManagement;