import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileText, Table } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";

interface DownloadActionsProps {
  type: "orders" | "customers";
  data?: any[];
}

export const DownloadActions = ({ type, data }: DownloadActionsProps) => {
  const { toast } = useToast();

  const downloadCSV = async () => {
    try {
      let csvData: any[] = [];
      let filename = "";
      let headers: string[] = [];

      if (type === "orders") {
        const { data: orders, error } = await supabase
          .from('nana_orders')
          .select(`
            id,
            total_amount,
            delivery_fee,
            order_type,
            status,
            payment_status,
            created_at,
            customer:nana_customers(name, phone, email),
            order_items:nana_order_items(
              quantity,
              unit_price,
              total_price,
              food:nana_foods(name)
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        headers = [
          "Order ID", "Customer Name", "Customer Phone", "Customer Email",
          "Order Type", "Status", "Payment Status", "Items", "Subtotal", 
          "Delivery Fee", "Total", "Date"
        ];

        csvData = orders?.map(order => [
          order.id.slice(0, 8),
          order.customer?.name || "N/A",
          order.customer?.phone || "N/A",
          order.customer?.email || "N/A",
          order.order_type,
          order.status,
          order.payment_status,
          order.order_items?.map(item => `${item.quantity}x ${item.food?.name}`).join("; ") || "N/A",
          `GH₵${order.total_amount.toFixed(2)}`,
          `GH₵${order.delivery_fee.toFixed(2)}`,
          `GH₵${(Number(order.total_amount) + Number(order.delivery_fee)).toFixed(2)}`,
          new Date(order.created_at).toLocaleDateString()
        ]) || [];

        filename = `orders_${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        const { data: customers, error } = await supabase
          .from('nana_customers')
          .select(`
            *,
            orders:nana_orders(total_amount, payment_status)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        headers = [
          "Customer ID", "Name", "Phone", "Email", "National ID", 
          "Address", "Total Orders", "Total Spent", "Registration Date"
        ];

        csvData = customers?.map(customer => {
          const paidOrders = customer.orders?.filter(o => o.payment_status === 'paid') || [];
          const totalSpent = paidOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
          
          return [
            customer.id.slice(0, 8),
            customer.name,
            customer.phone,
            customer.email || "N/A",
            customer.national_id || "N/A",
            customer.address || "N/A",
            customer.orders?.length || 0,
            `GH₵${totalSpent.toFixed(2)}`,
            new Date(customer.created_at).toLocaleDateString()
          ];
        }) || [];

        filename = `customers_${new Date().toISOString().split('T')[0]}.csv`;
      }

      // Create CSV content
      const csvContent = [
        headers.join(","),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: `${type} data downloaded as CSV`,
      });
    } catch (error) {
      console.error("Error downloading CSV:", error);
      toast({
        title: "Error",
        description: "Failed to download CSV",
        variant: "destructive",
      });
    }
  };

  const downloadPDF = async () => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = margin;

      // Title
      pdf.setFontSize(20);
      pdf.text(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, margin, yPosition);
      yPosition += 15;

      // Date
      pdf.setFontSize(12);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
      yPosition += 20;

      if (type === "orders") {
        const { data: orders, error } = await supabase
          .from('nana_orders')
          .select(`
            id,
            total_amount,
            delivery_fee,
            order_type,
            status,
            payment_status,
            created_at,
            customer:nana_customers(name, phone)
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        pdf.setFontSize(14);
        pdf.text("Recent Orders", margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        orders?.forEach((order, index) => {
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = margin;
          }

          const orderText = [
            `#${order.id.slice(0, 8)}`,
            `${order.customer?.name || 'N/A'}`,
            `${order.customer?.phone || 'N/A'}`,
            `${order.status}`,
            `GH₵${(Number(order.total_amount) + Number(order.delivery_fee)).toFixed(2)}`,
            `${new Date(order.created_at).toLocaleDateString()}`
          ].join(" | ");

          pdf.text(orderText, margin, yPosition);
          yPosition += 8;
        });
      } else {
        const { data: customers, error } = await supabase
          .from('nana_customers')
          .select(`
            *,
            orders:nana_orders(total_amount, payment_status)
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        pdf.setFontSize(14);
        pdf.text("Customer List", margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        customers?.forEach((customer, index) => {
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = margin;
          }

          const paidOrders = customer.orders?.filter(o => o.payment_status === 'paid') || [];
          const totalSpent = paidOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

          const customerText = [
            customer.name,
            customer.phone,
            customer.email || 'N/A',
            `${customer.orders?.length || 0} orders`,
            `GH₵${totalSpent.toFixed(2)}`,
            new Date(customer.created_at).toLocaleDateString()
          ].join(" | ");

          pdf.text(customerText, margin, yPosition);
          yPosition += 8;
        });
      }

      const filename = `${type}_report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      toast({
        title: "Success",
        description: `${type} report downloaded as PDF`,
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={downloadCSV}>
          <Table className="w-4 h-4 mr-2" />
          Download CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadPDF}>
          <FileText className="w-4 h-4 mr-2" />
          Download PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};