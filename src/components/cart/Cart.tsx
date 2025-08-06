import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Minus, Truck, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CartItem {
  id: string;
  name: string;
  price: number;
  delivery_price: number;
  quantity: number;
  orderType: 'delivery' | 'pickup';
  total: number;
  image_url?: string;
}

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (foodId: string, orderType: string, quantity: number) => void;
  onRemoveItem: (foodId: string, orderType: string) => void;
}

export const Cart = ({ isOpen, onClose, items, onUpdateQuantity, onRemoveItem }: CartProps) => {
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    nationalId: "",
    email: "",
    address: "",
    notes: ""
  });
  const [showCheckout, setShowCheckout] = useState(false);
  const { toast } = useToast();

  const subtotal = items.reduce((sum, item) => sum + (item.total * item.quantity), 0);
  const hasDelivery = items.some(item => item.orderType === 'delivery');
  const deliveryFee = hasDelivery ? Math.max(...items.filter(item => item.orderType === 'delivery').map(item => item.delivery_price)) : 0;
  const total = subtotal;

  const handleCheckout = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name and phone number.",
        variant: "destructive"
      });
      return;
    }

    if (hasDelivery && !customerInfo.address) {
      toast({
        title: "Missing Address",
        description: "Please provide your delivery address.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if customer already exists by phone or email
      let customerData;
      
      const { data: existingCustomers, error: searchError } = await supabase
        .from('nana_customers')
        .select('id, name, phone, email, national_id, address, created_at, updated_at')
        .or(`phone.eq.${customerInfo.phone}${customerInfo.email ? `,email.eq.${customerInfo.email}` : ''}`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (searchError) {
        console.error('Error searching for existing customer:', searchError);
        throw searchError;
      }

      if (existingCustomers && existingCustomers.length > 0) {
        const existingCustomer = existingCustomers[0];
        console.log('Found existing customer:', existingCustomer);
        
        // Update existing customer with any new information (only if different)
        const needsUpdate = 
          existingCustomer.name !== customerInfo.name ||
          (customerInfo.nationalId && existingCustomer.national_id !== customerInfo.nationalId) ||
          (customerInfo.email && existingCustomer.email !== customerInfo.email) ||
          (customerInfo.address && existingCustomer.address !== customerInfo.address);

        if (needsUpdate) {
        const { data: updatedCustomer, error: updateError } = await supabase
          .from('nana_customers')
          .update({
            name: customerInfo.name,
            national_id: customerInfo.nationalId || existingCustomer.national_id,
            email: customerInfo.email || existingCustomer.email,
            address: customerInfo.address || existingCustomer.address,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCustomer.id)
          .select()
          .single();

          if (updateError) {
            console.error('Error updating existing customer:', updateError);
            throw updateError;
          }
          customerData = updatedCustomer;
          console.log('Updated existing customer:', customerData);
        } else {
          customerData = existingCustomer;
          console.log('Using existing customer without updates:', customerData);
        }
      } else {
        console.log('No existing customer found, creating new one');
        // Create new customer record
        const { data: newCustomer, error: customerError } = await supabase
          .from('nana_customers')
          .insert({
            name: customerInfo.name,
            phone: customerInfo.phone,
            national_id: customerInfo.nationalId || null,
            email: customerInfo.email || null,
            address: customerInfo.address || null
          })
          .select()
          .single();

        if (customerError) {
          console.error('Error creating new customer:', customerError);
          throw customerError;
        }
        customerData = newCustomer;
        console.log('Created new customer:', customerData);
      }

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('nana_orders')
        .insert({
          customer_id: customerData.id,
          total_amount: total,
          delivery_fee: deliveryFee,
          order_type: hasDelivery ? 'delivery' : 'pickup',
          status: 'pending',
          payment_status: 'pending',
          notes: customerInfo.notes || null,
          delivery_address: customerInfo.address || null
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      // Create order items
      const orderItems = items.map(item => ({
        order_id: orderData.id,
        food_id: item.id,
        quantity: item.quantity,
        unit_price: item.orderType === 'delivery' ? item.price + item.delivery_price : item.price,
        total_price: item.total * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('nana_order_items')
        .insert(orderItems);

      if (itemsError) {
        throw itemsError;
      }

      // Process payment with Paystack via Edge Function
      try {
        // Get Paystack configuration from business settings
        const { data: businessSettings } = await supabase
          .from('nana_business_settings')
          .select('paystack_public_key, paystack_secret_key')
          .single();

        const paymentData = {
          email: customerInfo.email || `${customerInfo.phone}@bitecraft.com`,
          amount: Math.round(total * 100), // Convert to pesewas
          currency: 'GHS',
          reference: orderData.id,
          callback_url: `${window.location.origin}/payment-success?order_id=${orderData.id}`,
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          order_id: orderData.id,
          paystack_secret_key: businessSettings?.paystack_secret_key,
          metadata: {
            customer_name: customerInfo.name,
            customer_phone: customerInfo.phone,
            order_id: orderData.id,
            custom_fields: [
              {
                display_name: "Customer Name",
                variable_name: "customer_name",
                value: customerInfo.name
              },
              {
                display_name: "Phone Number", 
                variable_name: "customer_phone",
                value: customerInfo.phone
              }
            ]
          }
        };

        console.log('Initializing Paystack payment with data:', paymentData);
        
        // Call Supabase Edge Function instead of direct Paystack API
        const { data: paystackResult, error: functionError } = await supabase.functions.invoke('process-paystack-payment', {
          body: paymentData
        });

        if (functionError) {
          console.error('Edge Function error:', functionError);
          throw new Error(`Edge Function error: ${functionError.message}`);
        }

        console.log('Edge Function result:', paystackResult);
        
        if (paystackResult?.status && paystackResult?.data?.authorization_url) {
          // Update order with payment reference
          await supabase
            .from('nana_orders')
            .update({ 
              payment_reference: paystackResult.data.reference,
              payment_status: 'pending'
            })
            .eq('id', orderData.id);

          // Clear cart and close
          setCustomerInfo({
            name: "",
            phone: "",
            nationalId: "",
            email: "",
            address: "",
            notes: ""
          });
          setShowCheckout(false);
          onClose();
          
          toast({
            title: "Order Created!",
            description: "Redirecting to payment...",
          });
          
          // Redirect to Paystack payment page
          window.location.href = paystackResult.data.authorization_url;
        } else {
          throw new Error(paystackResult?.message || 'Payment initialization failed');
        }
      } catch (paymentError: any) {
        console.error('Payment error:', paymentError);
        toast({
          title: "Payment Error",
          description: paymentError.message || 'Failed to initialize payment',
          variant: "destructive"
        });
        return;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Error",
        description: error instanceof Error ? error.message : "Failed to process order. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>Your Cart</SheetTitle>
          <SheetDescription>
            Review your order and proceed to checkout
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="mt-6 space-y-6 pb-6">
            {items.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Your cart is empty</p>
            ) : (
              <>
                {/* Cart Items */}
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={`${item.id}-${item.orderType}`} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <img
                        src={item.image_url || "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=60&h=60&fit=crop"}
                        alt={item.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.name}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant={item.orderType === 'delivery' ? 'default' : 'secondary'}>
                            {item.orderType === 'delivery' ? (
                              <><Truck className="h-3 w-3 mr-1" />Delivery</>
                            ) : (
                              <><Package className="h-3 w-3 mr-1" />Pickup</>
                            )}
                          </Badge>
                          <span className="text-sm text-muted-foreground">₵{item.total}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUpdateQuantity(item.id, item.orderType, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUpdateQuantity(item.id, item.orderType, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRemoveItem(item.id, item.orderType)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="border-t pt-4 space-y-2">
                   <div className="flex justify-between">
                     <span>Subtotal:</span>
                     <span>₵{subtotal.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between font-bold text-lg">
                     <span>Total:</span>
                     <span>₵{total.toFixed(2)}</span>
                   </div>
                </div>

                {!showCheckout ? (
                  <Button className="w-full" onClick={() => setShowCheckout(true)}>
                    Proceed to Checkout
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Customer Information</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone *</Label>
                        <Input
                          id="phone"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                          placeholder="Your phone number"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nationalId">National ID</Label>
                        <Input
                          id="nationalId"
                          value={customerInfo.nationalId}
                          onChange={(e) => setCustomerInfo({...customerInfo, nationalId: e.target.value})}
                          placeholder="National ID (optional)"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    {hasDelivery && (
                      <div>
                        <Label htmlFor="address">Delivery Address *</Label>
                        <Textarea
                          id="address"
                          value={customerInfo.address}
                          onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                          placeholder="Your delivery address"
                          rows={3}
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="notes">Special Notes</Label>
                      <Textarea
                        id="notes"
                        value={customerInfo.notes}
                        onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
                        placeholder="Any special instructions..."
                        rows={2}
                      />
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={() => setShowCheckout(false)} className="flex-1">
                        Back to Cart
                      </Button>
                       <Button onClick={handleCheckout} className="flex-1">
                         Pay ₵{total.toFixed(2)}
                       </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};