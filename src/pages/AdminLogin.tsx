import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Shield } from "lucide-react";

export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, admin } = useAdminAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already logged in as admin
  useEffect(() => {
    if (admin) {
      navigate("/admin");
    }
  }, [admin, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome!",
        description: "You have been successfully logged in to the admin dashboard.",
      });
      navigate("/admin");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-food-primary mr-2" />
            <h1 className="text-3xl font-bold text-food-primary">Admin Portal</h1>
          </div>
          <p className="text-muted-foreground">Sign in to access the admin dashboard</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Administrator Login</CardTitle>
            <CardDescription>Enter your admin credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@bitecraft.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In to Dashboard
              </Button>
            </form>
            <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
              <p><strong>Demo credentials:</strong></p>
              <p>Email: admin@bitecraft.com</p>
              <p>Password: admin123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}