import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

export const AuthErrorDebugger = () => {
  const { user, session, profile, loading } = useAuth();
  const [errorLog, setErrorLog] = useState<string[]>([]);

  useEffect(() => {
    // Development-only debug tool - prevent cross-instance conflicts
    if (process.env.NODE_ENV !== 'development') return;
    
    // Prevent double-installation using global flag
    if ((window as any).__authErrorDebuggerInstalled) return;
    (window as any).__authErrorDebuggerInstalled = true;

    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      if (errorMessage.includes('React error #321') || errorMessage.includes('Minified React error')) {
        setErrorLog(prev => [...prev, `${new Date().toISOString()}: ${errorMessage}`]);
      }
      originalConsoleError(...args);
    };

    return () => {
      // Always restore original console.error on unmount
      console.error = originalConsoleError;
      (window as any).__authErrorDebuggerInstalled = false;
    };
  }, []);

  const clearLog = () => setErrorLog([]);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Debugger d'erreur React #321
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Badge variant={user ? "default" : "secondary"}>
              User: {user ? '✅' : '❌'}
            </Badge>
          </div>
          <div>
            <Badge variant={session ? "default" : "secondary"}>
              Session: {session ? '✅' : '❌'}
            </Badge>
          </div>
          <div>
            <Badge variant={profile ? "default" : "secondary"}>
              Profile: {profile ? '✅' : '❌'}
            </Badge>
          </div>
          <div>
            <Badge variant={loading ? "destructive" : "default"}>
              Loading: {loading ? '⏳' : '✅'}
            </Badge>
          </div>
        </div>

        {errorLog.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Erreurs capturées:</h3>
              <Button size="sm" variant="outline" onClick={clearLog}>
                Effacer
              </Button>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {errorLog.map((error, index) => (
                <div key={index} className="text-xs bg-red-50 p-2 rounded border">
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p><strong>État actuel:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>User ID: {user?.id || 'Non connecté'}</li>
            <li>Email: {user?.email || 'Non disponible'}</li>
            <li>Rôle: {profile?.role || 'Non défini'}</li>
            <li>Session active: {session ? 'Oui' : 'Non'}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
