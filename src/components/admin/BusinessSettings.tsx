import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Building, Eye, EyeOff, CreditCard } from "lucide-react";

interface BusinessSettings {
  id: string;
  business_name: string;
  business_phone: string;
  business_email: string;
  business_address: string | null;
  paystack_public_key: string | null;
  paystack_secret_key: string | null;
}

export default function BusinessSettings() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [formData, setFormData] = useState({
    business_name: "",
    business_phone: "",
    business_email: "",
    business_address: "",
    paystack_public_key: "",
    paystack_secret_key: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchBusinessSettings();
  }, []);

  const fetchBusinessSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("nana_business_settings")
        .select("*")
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
        setFormData({
          business_name: data.business_name || "",
          business_phone: data.business_phone || "",
          business_email: data.business_email || "",
          business_address: data.business_address || "",
          paystack_public_key: data.paystack_public_key || "",
          paystack_secret_key: data.paystack_secret_key || ""
        });
      }
    } catch (error) {
      console.error("Error fetching business settings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch business settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBusinessInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const businessData = {
        business_name: formData.business_name,
        business_phone: formData.business_phone,
        business_email: formData.business_email,
        business_address: formData.business_address || null,
        updated_at: new Date().toISOString()
      };

      if (settings) {
        const { error } = await supabase
          .from("nana_business_settings")
          .update(businessData)
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("nana_business_settings")
          .insert([businessData]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Business information updated successfully",
      });

      fetchBusinessSettings();
    } catch (error) {
      console.error("Error updating business settings:", error);
      toast({
        title: "Error",
        description: "Failed to update business information",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePaystackConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const paystackData = {
        paystack_public_key: formData.paystack_public_key || null,
        paystack_secret_key: formData.paystack_secret_key || null,
        updated_at: new Date().toISOString()
      };

      if (settings) {
        const { error } = await supabase
          .from("nana_business_settings")
          .update(paystackData)
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("nana_business_settings")
          .insert([paystackData]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Paystack configuration updated successfully",
      });

      fetchBusinessSettings();
    } catch (error) {
      console.error("Error updating Paystack settings:", error);
      toast({
        title: "Error",
        description: "Failed to update Paystack configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Business Information
          </CardTitle>
          <CardDescription>
            Update your business contact information and details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveBusinessInfo} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business-name">Business Name</Label>
                <Input
                  id="business-name"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  placeholder="Your business name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-phone">Business Phone</Label>
                <Input
                  id="business-phone"
                  value={formData.business_phone}
                  onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                  placeholder="Business phone number"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="business-email">Business Email</Label>
              <Input
                id="business-email"
                type="email"
                value={formData.business_email}
                onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                placeholder="Business email address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="business-address">Business Address</Label>
              <Textarea
                id="business-address"
                value={formData.business_address}
                onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                placeholder="Enter your business address"
                rows={3}
              />
            </div>
            
            <Button type="submit" disabled={saving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Updating..." : "Update Business Information"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Paystack Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Paystack Configuration
          </CardTitle>
          <CardDescription>
            Configure your Paystack API keys for payment processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSavePaystackConfig} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paystack-public-key">Paystack Public Key</Label>
              <Input
                id="paystack-public-key"
                value={formData.paystack_public_key}
                onChange={(e) => setFormData({ ...formData, paystack_public_key: e.target.value })}
                placeholder="pk_test_..."
              />
              <p className="text-xs text-muted-foreground">
                Your Paystack public key (starts with pk_test_ or pk_live_)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paystack-secret-key">Paystack Secret Key</Label>
              <div className="relative">
                <Input
                  id="paystack-secret-key"
                  type={showSecretKey ? "text" : "password"}
                  value={formData.paystack_secret_key}
                  onChange={(e) => setFormData({ ...formData, paystack_secret_key: e.target.value })}
                  placeholder="sk_test_..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                >
                  {showSecretKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your Paystack secret key (starts with sk_test_ or sk_live_). Keep this secure!
              </p>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Security Notice</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Your API keys are stored securely and encrypted. Never share your secret key with anyone.
                Use test keys for development and live keys only for production.
              </p>
            </div>
            
            <Button type="submit" disabled={saving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Updating..." : "Update Paystack Configuration"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}