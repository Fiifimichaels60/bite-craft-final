import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, ArrowLeft, Calendar, CreditCard, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface OrderDetails {
  id: string;
  customer_id: string;
  total_amount: number;
  delivery_fee: number;
  order_type: string;
  status: string;
  payment_status: string;
  payment_reference: string | null;
  created_at: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  order_items: Array<{
    quantity: number;
    unit_price: number;
    total_price: number;
    food: {
      name: string;
    };
  }>;
}

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get('reference') || searchParams.get('order_id');

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      setLoading(false);
      toast({
        title: "Error",
        description: "No order reference found",
        variant: "destructive",
      });
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('nana_orders')
        .select(`
          *,
          customer:nana_customers(*),
          order_items:nana_order_items(
            quantity,
            unit_price,
            total_price,
            food:nana_foods(name)
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrderDetails(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch order details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async () => {
    if (!orderDetails) return;

    try {
      const receiptElement = document.getElementById('receipt-content');
      if (!receiptElement) return;

      const canvas = await html2canvas(receiptElement, {
        backgroundColor: '#ffffffff',
        scale: 2,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`receipt-${orderDetails.id}.pdf`);

      toast({
        title: "Success",
        description: "Receipt downloaded successfully",
      });
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast({
        title: "Error",
        description: "Failed to download receipt",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <h2 className="text-xl font-semibold text-red-600 mb-4">Order Not Found</h2>
            <Button onClick={() => navigate('/')} className="bg-emerald-600 hover:bg-emerald-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <Card className="mb-6 border-emerald-200 shadow-lg">
          <CardContent className="text-center p-8">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-emerald-800 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-4">
              Your order has been placed successfully and payment has been confirmed.
            </p>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-sm px-3 py-1">
              Order #{orderDetails.id.slice(0, 8)}
            </Badge>
          </CardContent>
        </Card>

        {/* Receipt */}
        <Card className="mb-6 shadow-lg" id="receipt-content">
          <CardHeader className="bg-emerald-600 text-white">
            <CardTitle className="text-center text-xl">Order Receipt</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Order Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="font-medium">
                    {new Date(orderDetails.created_at).toLocaleDateString()} at{' '}
                    {new Date(orderDetails.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Payment Reference</p>
                  <p className="font-medium font-mono text-sm">
                    {orderDetails.payment_reference || orderDetails.id}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-6 p-4 bg-gray-100 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
                <Package className="w-4 h-4" />
                Customer Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600"><span className="font-medium">Name:</span> {orderDetails.customer.name}</p>
                  <p className="text-gray-600"><span className="font-medium">Phone:</span> {orderDetails.customer.phone}</p>
                </div>
                <div>
                  <p className="text-gray-600"><span className="font-medium">Email:</span> {orderDetails.customer.email}</p>
                  <p className="text-gray-600"><span className="font-medium">Order Type:</span> {orderDetails.order_type}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Order Items</h3>
              <div className="space-y-2">
                {orderDetails.order_items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-gray-600">{item.food.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} × GH₵{item.unit_price.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-medium text-gray-600">GH₵{item.total_price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-gray-600">Subtotal</p>
                <p>GH₵{orderDetails.total_amount.toFixed(2)}</p>
              </div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-gray-600">Delivery Fee</p>
                <p>GH₵{orderDetails.delivery_fee.toFixed(2)}</p>
              </div>
              <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                <p>Total Paid</p>
                <p>GH₵{(orderDetails.total_amount + orderDetails.delivery_fee).toFixed(2)}</p>
              </div>
            </div>

            {/* Status */}
            <div className="mt-6 p-4 bg-emerald-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-emerald-800 font-medium">Payment Status:</span>
                <Badge className="bg-emerald-500 hover:bg-emerald-600">
                  {orderDetails.payment_status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={downloadReceipt}
            className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Receipt
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;