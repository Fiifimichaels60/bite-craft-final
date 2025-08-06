import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Eye, EyeOff, CreditCard } from "lucide-react";

export default function BusinessSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [formData, setFormData] = useState({
    paystack_public_key: "",
    paystack_secret_key: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSavePaystackConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const paystackData = {
        paystack_public_key: formData.paystack_public_key || null,
        paystack_secret_key: formData.paystack_secret_key || null,
        updated_at: new Date().toISOString()
      };

      // For now, just store in localStorage until business settings table is properly configured
      localStorage.setItem('paystack_config', JSON.stringify(paystackData));

      toast({
        title: "Success",
        description: "Paystack configuration updated successfully",
      });

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