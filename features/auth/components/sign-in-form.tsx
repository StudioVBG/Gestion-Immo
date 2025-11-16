"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { authService } from "../services/auth.service";
import type { SignInData } from "../services/auth.service";

export function SignInForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SignInData>({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await authService.signIn(formData);
      
      // Vérifier si l'email est confirmé
      if (result.user && !result.user.email_confirmed_at) {
        toast({
          title: "Email non confirmé",
          description: "Veuillez confirmer votre email avant de vous connecter.",
        });
        router.push("/auth/verify-email");
        return;
      }

      // Récupérer le profil pour rediriger selon le rôle
      const profile = await authService.getProfile();
      const profileData = profile as any;
      
      // Pour les admins, rediriger directement vers le dashboard admin
      if (profileData?.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
      
      router.refresh();
    } catch (error: any) {
      // Vérifier si l'erreur est liée à l'email non confirmé
      const errorMessage = error.message?.toLowerCase() || "";
      if (
        errorMessage.includes("email not confirmed") ||
        errorMessage.includes("email_not_confirmed") ||
        (error.status === 400 && errorMessage.includes("email"))
      ) {
        toast({
          title: "Email non confirmé",
          description: "Veuillez confirmer votre email avant de vous connecter. Vous allez être redirigé.",
        });
        // Stocker l'email pour la page de vérification (via sessionStorage)
        if (typeof window !== "undefined") {
          sessionStorage.setItem("pendingEmailVerification", formData.email);
        }
        router.push("/auth/verify-email");
      } else {
        toast({
          title: "Erreur de connexion",
          description: error.message || "Une erreur est survenue lors de la connexion.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>Connectez-vous à votre compte</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <PasswordInput
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 text-sm text-muted-foreground">
        <p>
          Mot de passe oublié ?{" "}
          <Link href="/auth/forgot-password" className="text-primary underline-offset-2 hover:underline">
            Réinitialiser
          </Link>
        </p>
        <p>
          Besoin d’aide ?{" "}
          <a
            href="mailto:support@gestion-locative.app"
            className="text-primary underline-offset-2 hover:underline"
          >
            Contacter l’équipe
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}

