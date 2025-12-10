// src/pages/Auth.tsx

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // <--- Import useLocation
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Mail, ArrowLeft, KeyRound, User, Lock } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation(); // <--- Hook para ler o estado da rota
  const [isLoading, setIsLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  
  const [isResetting, setIsResetting] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // Função inteligente de redirecionamento
  const handleRedirect = () => {
    // Verifica se existe uma página de origem salva no estado (ex: /table/123)
    // Se existir, devolve o utilizador para lá. Se não, vai para a home.
    // O .pathname é importante porque o objeto 'from' pode ser complexo
    const destination = location.state?.from?.pathname || location.state?.from || "/";
    navigate(destination, { replace: true });
  };

  useEffect(() => {
    // Verifica sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleRedirect();
      }
    });

    // Escuta mudanças de auth (login bem sucedido)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        handleRedirect();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location]); // Adicionado location às dependências

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email ou senha incorretos");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Acesso concedido.");
        // O useEffect tratará do redirecionamento
      }
    } catch (error: any) {
      toast.error("Erro de conexão.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username) {
      toast.error("Por favor, escolha um nome de usuário.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Verifique seu email para confirmar!");
      }
    } catch (error: any) {
      toast.error("Ocorreu um erro ao tentar cadastrar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Por favor, digite seu e-mail.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + "/reset-password",
      });

      if (error) throw error;

      toast.success("Email de recuperação enviado.");
      setIsResetting(false); 
      setResetEmail(""); 
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar e-mail.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black"
    >
      {/* Background Image com Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-60 animate-in fade-in duration-1000"
        style={{
            backgroundImage: 'url("/tenebre-bg.png")', 
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-0" />

      <Card className="w-full max-w-md z-10 bg-black/80 border-border/20 shadow-2xl backdrop-blur-md animate-in zoom-in-95 duration-500">
        
        {isResetting ? (
          <>
            <CardHeader className="space-y-1">
              <Button 
                variant="ghost" 
                className="w-fit p-0 h-auto mb-2 text-muted-foreground hover:text-primary"
                onClick={() => setIsResetting(false)}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
              <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                <KeyRound className="w-6 h-6" /> Recuperar Acesso
              </CardTitle>
              <CardDescription>
                Digite o e-mail para redefinir sua senha.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="email@exemplo.com"
                      className="pl-10 bg-background/50 border-white/10"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button className="w-full font-bold" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Link"
                  )}
                </Button>
              </form>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="space-y-2 text-center">
              <div className="w-32 h-32 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                 <img src="/tenebre-logo.png" alt="Logo" className="w-20 h-20 object-contain drop-shadow-xl" />
              </div>
              <div>
                  <CardTitle className="text-3xl font-black tracking-tight text-foreground">
                    Tenebre VTT
                  </CardTitle>
                  <CardDescription className="text-base tracking-wide font-light text-muted-foreground/80">
                    Onde as sombras ganham vida.
                  </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/20">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="register">Cadastrar</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10 bg-background/50 border-white/10 focus:border-primary/50"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Senha</Label>
                        <button
                          type="button"
                          onClick={() => setIsResetting(true)}
                          className="text-xs text-primary/80 hover:text-primary hover:underline font-medium"
                        >
                          Esqueceu?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          className="pl-10 pr-10 bg-background/50 border-white/10 focus:border-primary/50"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button className="w-full font-bold shadow-lg shadow-primary/10" type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Entrando...
                        </>
                      ) : (
                        "Entrar"
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Nome de Usuário</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="username"
                          type="text"
                          placeholder="NomeHeroico"
                          className="pl-10 bg-background/50 border-white/10"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10 bg-background/50 border-white/10"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          className="pl-10 pr-10 bg-background/50 border-white/10"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmar Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          className="pl-10 pr-10 bg-background/50 border-white/10"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-foreground"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <Button className="w-full font-bold" type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        "Criar Conta"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </>
        )}
        
        <CardFooter className="flex justify-center border-t border-white/5 pt-4">
          <p className="text-xs text-muted-foreground font-mono">
            v1.0.0
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;