import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import resolveLogoPath from "@assets/Resolve_Construction_Ltd._Logo_1772117575893.jpg";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const { lang, setLang, t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      toast({
        title: lang === "en" ? "Login Failed" : "Error al iniciar sesión",
        description: err.message || (lang === "en" ? "Invalid username or password" : "Usuario o contraseña incorrectos"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 45%, #fed7aa 100%)"}}>
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-1 bg-white/70 backdrop-blur rounded-full px-2 py-1 border shadow-sm">
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${lang === "en" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
              data-testid="button-lang-en"
            >
              EN
            </button>
            <button
              onClick={() => setLang("es")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${lang === "es" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
              data-testid="button-lang-es"
            >
              ES
            </button>
          </div>
        </div>

        <div className="text-center mb-8">
          <img
            src={resolveLogoPath}
            alt="Resolve Construction Ltd"
            className="h-28 mx-auto mb-4 object-contain"
            data-testid="img-logo"
          />
          <h1 className="text-xl font-bold tracking-tight" data-testid="text-app-title">
            {t.workerPortal}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t.loginSubtitle}
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <h2 className="text-lg font-semibold text-center">{t.loginTitle}</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">{t.username}</Label>
                <Input
                  id="username"
                  data-testid="input-username"
                  placeholder={t.enterUsername}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t.password}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    data-testid="input-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t.enterPassword}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !username || !password}
                data-testid="button-login"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {t.signingIn}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    {t.login}
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {t.contactManager}
        </p>
      </div>
    </div>
  );
}
