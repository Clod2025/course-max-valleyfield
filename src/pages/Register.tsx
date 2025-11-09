import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/header";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";

const DAYS_OF_WEEK = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
] as const;

type DayName = typeof DAYS_OF_WEEK[number];

interface DaySchedule {
  day: DayName;
  open: string;
  close: string;
  closed: boolean;
}

const DEFAULT_DAY_CONFIG: Record<DayName, { open: string; close: string; closed: boolean }> = {
  Lundi: { open: "09:00", close: "18:00", closed: false },
  Mardi: { open: "09:00", close: "18:00", closed: false },
  Mercredi: { open: "09:00", close: "18:00", closed: false },
  Jeudi: { open: "09:00", close: "20:00", closed: false },
  Vendredi: { open: "09:00", close: "20:00", closed: false },
  Samedi: { open: "10:00", close: "17:00", closed: false },
  Dimanche: { open: "10:00", close: "16:00", closed: true },
};

const TIME_OPTIONS = (() => {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (const minute of [0, 30]) {
      const formattedHour = String(hour).padStart(2, "0");
      const formattedMinute = String(minute).padStart(2, "0");
      options.push(`${formattedHour}:${formattedMinute}`);
    }
  }
  return options;
})();

const OPEN_TIME_OPTIONS = TIME_OPTIONS.slice(0, -1);

const formatTimeLabel = (time: string) => {
  const [hours, minutes] = time.split(":");
  return `${hours}h${minutes}`;
};

const getDefaultSchedule = (): DaySchedule[] =>
  DAYS_OF_WEEK.map((day) => ({
    day,
    ...DEFAULT_DAY_CONFIG[day],
  }));

const Register = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState(searchParams.get('role') || 'client');
  const [merchantType, setMerchantType] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeStreet, setStoreStreet] = useState('');
  const [storeCity, setStoreCity] = useState('');
  const [storeRegion, setStoreRegion] = useState('');
  const [storePostalCode, setStorePostalCode] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [openingSchedule, setOpeningSchedule] = useState<DaySchedule[]>(() => getDefaultSchedule());
  const [loading, setLoading] = useState(false);
  
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const openingHours = useMemo(
    () =>
      openingSchedule
        .map((day) =>
          day.closed
            ? `${day.day}: Fermé`
            : `${day.day}: ${formatTimeLabel(day.open)} - ${formatTimeLabel(day.close)}`
        )
        .join("\n"),
    [openingSchedule]
  );

  const handleToggleClosed = (index: number, closed: boolean) => {
    setOpeningSchedule((prev) => {
      const next = [...prev];
      const current = next[index];
      if (!current) return prev;

      if (closed) {
        next[index] = { ...current, closed: true };
      } else {
        const defaults = DEFAULT_DAY_CONFIG[current.day];
        next[index] = {
          ...current,
          closed: false,
          open: current.open || defaults.open,
          close: current.close || defaults.close,
        };
      }

      return next;
    });
  };

  const handleOpenTimeChange = (index: number, value: string) => {
    setOpeningSchedule((prev) => {
      const next = [...prev];
      const current = next[index];
      if (!current) return prev;

      const allowedCloseTimes = TIME_OPTIONS.filter((time) => time > value);
      const nextClose = allowedCloseTimes.includes(current.close)
        ? current.close
        : allowedCloseTimes[0] ?? current.close;

      next[index] = {
        ...current,
        open: value,
        close: nextClose,
        closed: false,
      };

      return next;
    });
  };

  const handleCloseTimeChange = (index: number, value: string) => {
    setOpeningSchedule((prev) => {
      const next = [...prev];
      const current = next[index];
      if (!current) return prev;

      next[index] = {
        ...current,
        close: value,
        closed: false,
      };

      return next;
    });
  };

  // ✅ MÊME LOGIQUE que Login.tsx
  useEffect(() => {
    // ✅ MÊME LOGIQUE que Login.tsx
    if (user && profile) {
      const dashboardMap: Record<string, string> = {
        'client': '/dashboard/client',
        'store_manager': '/dashboard/marchand', 
        'livreur': '/dashboard/livreur',
        'admin': '/dashboard/admin'
      };
      
      const targetDashboard = dashboardMap[profile.role];
      if (targetDashboard) {
        navigate(targetDashboard, { replace: true });
      }
    }
  }, [user, profile, navigate]);

  const resetMerchantFields = () => {
    setMerchantType('');
    setStoreName('');
    setStoreStreet('');
    setStoreCity('');
    setStoreRegion('');
    setStorePostalCode('');
    setStorePhone('');
    setOpeningSchedule(getDefaultSchedule());
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();
      const normalizedEmail = email.trim().toLowerCase();

      // Validation pour les marchands
      if (role === 'merchant' && !merchantType) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner un type de marchand",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (role === 'merchant') {
        const requiredMerchantFields = [
          { label: "nom du magasin", value: storeName },
          { label: "adresse du magasin", value: storeStreet },
          { label: "ville du magasin", value: storeCity },
          { label: "région du magasin", value: storeRegion },
          { label: "code postal du magasin", value: storePostalCode },
          { label: "téléphone du magasin", value: storePhone },
          { label: "horaires d'ouverture", value: openingHours },
        ];

        const missingField = requiredMerchantFields.find(field => !field.value.trim());

        if (missingField) {
          toast({
            title: "Informations manquantes",
            description: `Veuillez renseigner ${missingField.label}`,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      // ✅ CORRECTION: Mapper le rôle correctement pour les métadonnées
      // Le rôle peut être 'merchant' dans l'UI mais doit être 'store_manager' ou 'merchant' selon l'enum
      let metaRole = role;
      if (role === 'merchant') {
        // Essayer 'store_manager' d'abord, sinon 'merchant'
        metaRole = 'store_manager';
      } else if (role === 'driver') {
        // Essayer 'livreur' d'abord, sinon 'driver'
        metaRole = 'livreur';
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            first_name: trimmedFirstName,
            last_name: trimmedLastName,
            role: metaRole, // ✅ Utiliser le rôle mappé
            type_compte: role === 'merchant' ? 'Marchand' : role === 'driver' ? 'Livreur' : 'Client',
            type_marchand: role === 'merchant' ? merchantType : null
          }
        }
      });

      if (error) {
        console.error('❌ Signup error:', error);
        throw error;
      }

      // ✅ CORRECTION: Attendre que le profil soit créé par le trigger
      if (data.user) {
        console.log('✅ User created:', data.user.id);
        
        // Attendre un peu pour que le trigger crée le profil
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Vérifier que le profil existe maintenant
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .maybeSingle();
        
        if (!profileData || profileError) {
          console.warn('⚠️ Profile not created by trigger, creating manually...', profileError);
          
          // ✅ FALLBACK: Créer le profil manuellement si le trigger n'a pas fonctionné
          // Essayer avec 'store_manager' d'abord
          let fallbackRole = metaRole;
          let insertError = null;
          
          const baseProfile = {
            user_id: data.user.id,
            email: normalizedEmail,
            first_name: trimmedFirstName,
            last_name: trimmedLastName,
            role: fallbackRole,
            type_compte: role === 'merchant' ? 'Marchand' : role === 'driver' ? 'Livreur' : 'Client',
            type_marchand: role === 'merchant' ? merchantType : null,
          };

          if (role === 'merchant') {
            Object.assign(baseProfile, {
              address: storeStreet.trim(),
              city: storeCity.trim(),
              postal_code: storePostalCode.trim(),
              phone: storePhone.trim(),
              region: storeRegion.trim(),
              full_name: `${trimmedFirstName} ${trimmedLastName}`.trim(),
            });
          }

          const { error: insertError1 } = await supabase
            .from('profiles')
            .insert(baseProfile);
          
          if (insertError1) {
            // Si ça échoue, essayer avec 'merchant' ou 'driver'
            if (fallbackRole === 'store_manager') {
              fallbackRole = 'merchant';
            } else if (fallbackRole === 'livreur') {
              fallbackRole = 'driver';
            }
            
            const { error: insertError2 } = await supabase
              .from('profiles')
              .insert({
                ...baseProfile,
                role: fallbackRole
              });
            
            if (insertError2) {
              // En dernier recours, utiliser 'client'
              const { error: insertError3 } = await supabase
                .from('profiles')
                .insert({
                  ...baseProfile,
                  role: 'client'
                });
              
              if (insertError3) {
                console.error('❌ Error creating profile manually:', insertError3);
                insertError = insertError3;
              }
            }
          }
          
          if (insertError) {
            toast({
              title: "Avertissement",
              description: "Votre compte a été créé mais le profil n'a pas pu être configuré. Veuillez contacter le support.",
              variant: "destructive",
            });
          }
        } else {
          console.log('✅ Profile created successfully:', profileData);
        }
      }

      // Stocker l'email pour la page de confirmation
      localStorage.setItem('signup_email', normalizedEmail);

      if (role === 'merchant' && data.user) {
        const merchantProfileUpdate: Record<string, any> = {
          first_name: trimmedFirstName,
          last_name: trimmedLastName,
          role: 'store_manager',
          type_compte: 'Marchand',
          type_marchand: merchantType,
          address: storeStreet.trim(),
          city: storeCity.trim(),
          postal_code: storePostalCode.trim(),
          phone: storePhone.trim(),
          region: storeRegion.trim(),
          full_name: `${trimmedFirstName} ${trimmedLastName}`.trim(),
        };

        const { error: updateProfileError } = await supabase
          .from('profiles')
          .update(merchantProfileUpdate)
          .eq('user_id', data.user.id);

        if (updateProfileError) {
          console.error('❌ Error updating merchant profile:', updateProfileError);
        }

        try {
          const { data: existingStore, error: storeLookupError } = await supabase
            .from('stores')
            .select('id')
            .eq('manager_id', data.user.id)
            .maybeSingle();

          if (storeLookupError) {
            console.error('❌ Error checking existing store:', storeLookupError);
          }

          let storeId = existingStore?.id ?? null;

          if (!existingStore) {
            const openingHoursLines = openingHours
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean);

            const storeInsertPayload: Record<string, any> = {
              name: storeName.trim(),
              address: storeStreet.trim(),
              city: storeCity.trim(),
              postal_code: storePostalCode.trim(),
              phone: storePhone.trim(),
              email: normalizedEmail,
              manager_id: data.user.id,
              is_active: true,
              store_type: merchantType,
              operating_hours: openingHoursLines.length ? openingHoursLines : null,
            };

            if (storeRegion.trim()) {
              storeInsertPayload.description = `Région : ${storeRegion.trim()}`;
            }

            const { data: createdStore, error: storeInsertError } = await supabase
              .from('stores')
              .insert(storeInsertPayload)
              .select('id')
              .single();

            if (storeInsertError) {
              console.error('❌ Error creating store record:', storeInsertError);
            } else {
              storeId = createdStore?.id ?? null;
            }
          }

          if (storeId) {
            const { data: latestProfile, error: latestProfileError } = await supabase
              .from('profiles')
              .select('store_id')
              .eq('user_id', data.user.id)
              .maybeSingle();

            if (latestProfileError) {
              console.error('❌ Error fetching latest profile before attaching store:', latestProfileError);
            }

            if (!latestProfile?.store_id) {
              const { error: attachStoreError } = await supabase
                .from('profiles')
                .update({ store_id: storeId })
                .eq('user_id', data.user.id);

              if (attachStoreError) {
                console.error('❌ Error attaching store to profile:', attachStoreError);
              }
            }
          }
        } catch (storeError) {
          console.error('❌ Store initialization error:', storeError);
        }
      }

      toast({
        title: "Inscription réussie",
        description: "Votre compte a été créé avec succès. Vous allez être redirigé vers la connexion.",
      });

      // ✅ Rediriger vers la page de connexion après inscription
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Une erreur est survenue lors de l'inscription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto py-12 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-gradient">
              Créer un compte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Type de compte</Label>
                <Select value={role} onValueChange={(value) => {
                  setRole(value);
                  if (value !== 'merchant') {
                    resetMerchantFields();
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisissez votre rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">🛒 Client</SelectItem>
                    <SelectItem value="merchant">🏪 Marchand</SelectItem>
                    <SelectItem value="driver">🚗 Livreur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === 'merchant' && (
                <div className="space-y-2 animate-fadeIn">
                  <Label htmlFor="merchantType">Type de marchand</Label>
                  <Select value={merchantType} onValueChange={setMerchantType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisissez votre type de commerce" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Supermarché">🏪 Supermarché</SelectItem>
                      <SelectItem value="Pharmacie">💊 Pharmacie</SelectItem>
                      <SelectItem value="Restaurant">🍽️ Restaurant</SelectItem>
                      <SelectItem value="Épicerie">🛒 Épicerie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {role === 'merchant' && (
                <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="storeName">Nom du magasin</Label>
                      <Input
                        id="storeName"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="Ex: Marché Valleyfield"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="storeStreet">Adresse - Rue et numéro civique</Label>
                      <Input
                        id="storeStreet"
                        value={storeStreet}
                        onChange={(e) => setStoreStreet(e.target.value)}
                        placeholder="123 Rue Principale"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="storeCity">Ville</Label>
                      <Input
                        id="storeCity"
                        value={storeCity}
                        onChange={(e) => setStoreCity(e.target.value)}
                        placeholder="Salaberry-de-Valleyfield"
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="storeRegion">Région</Label>
                      <Input
                        id="storeRegion"
                        value={storeRegion}
                        onChange={(e) => setStoreRegion(e.target.value)}
                        placeholder="Montérégie"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="storePostalCode">Code postal</Label>
                      <Input
                        id="storePostalCode"
                        value={storePostalCode}
                        onChange={(e) => setStorePostalCode(e.target.value)}
                        placeholder="J6T 1A1"
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="storePhone">Téléphone du magasin</Label>
                      <Input
                        id="storePhone"
                        value={storePhone}
                        onChange={(e) => setStorePhone(e.target.value)}
                        placeholder="(450) 123-4567"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Horaires d'ouverture</Label>
                    <div className="space-y-4">
                      {openingSchedule.map((daySchedule, index) => {
                        const closeOptions = TIME_OPTIONS.filter((time) => time > daySchedule.open);

                        return (
                          <div key={daySchedule.day} className="rounded-lg border bg-background p-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <span className="font-medium">{daySchedule.day}</span>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Fermé</span>
                                <Switch
                                  checked={daySchedule.closed}
                                  onCheckedChange={(checked) => handleToggleClosed(index, checked)}
                                  aria-label={`Basculer l'état d'ouverture pour ${daySchedule.day}`}
                                  disabled={loading}
                                />
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div className="space-y-1.5">
                                <Label className="text-xs uppercase text-muted-foreground" htmlFor={`open-${daySchedule.day}`}>
                                  Ouverture
                                </Label>
                                <Select
                                  value={daySchedule.open}
                                  onValueChange={(value) => handleOpenTimeChange(index, value)}
                                  disabled={daySchedule.closed || loading}
                                >
                                  <SelectTrigger id={`open-${daySchedule.day}`}>
                                    <SelectValue placeholder="Sélectionner" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {OPEN_TIME_OPTIONS.map((time) => (
                                      <SelectItem key={time} value={time}>
                                        {formatTimeLabel(time)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs uppercase text-muted-foreground" htmlFor={`close-${daySchedule.day}`}>
                                  Fermeture
                                </Label>
                                <Select
                                  value={daySchedule.close}
                                  onValueChange={(value) => handleCloseTimeChange(index, value)}
                                  disabled={daySchedule.closed || loading}
                                >
                                  <SelectTrigger id={`close-${daySchedule.day}`}>
                                    <SelectValue placeholder="Sélectionner" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {closeOptions.map((time) => (
                                      <SelectItem key={time} value={time}>
                                        {formatTimeLabel(time)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            {!daySchedule.closed && closeOptions.length === 0 && (
                              <p className="mt-2 text-xs text-destructive">
                                Aucune plage de fermeture disponible après l'heure d'ouverture sélectionnée.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ajustez chaque jour ou marquez comme fermé. Les horaires seront enregistrés automatiquement.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jean"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Dupont"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
              
              <Button type="submit" className="w-full gradient-primary text-white" disabled={loading}>
                {loading ? "Inscription..." : "S'inscrire"}
              </Button>
            </form>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Déjà un compte?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Se connecter
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Register;
