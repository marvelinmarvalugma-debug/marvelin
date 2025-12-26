import React, { useState, useEffect } from 'react';
import { useSession } from '../components/SessionContextProvider';
import { supabase } from '../integrations/supabase/client';
import { Input } from '../components/ui/input'; // Assuming shadcn/ui Input
import { Button } from '../components/ui/button'; // Assuming shadcn/ui Button
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'; // Assuming shadcn/ui Card
import { Label } from '../components/ui/label'; // Assuming shadcn/ui Label
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog'; // Assuming shadcn/ui Dialog
import toast from 'react-hot-toast'; // Assuming react-hot-toast for notifications

interface UserApiKey {
  id: string;
  key_name: string;
  created_at: string;
  expires_at: string | null;
  last_chars?: string; // To display last few characters for identification
}

const ApiKeyManagement: React.FC = () => {
  const { session, loading } = useSession();
  const [apiKeys, setApiKeys] = useState<UserApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);

  const fetchApiKeys = async () => {
    if (!session?.user?.id) return;

    const { data, error } = await supabase
      .from('user_api_keys')
      .select('id, key_name, created_at, expires_at');

    if (error) {
      console.error('Error fetching API keys:', error);
      toast.error('Error al cargar las claves API.');
    } else {
      setApiKeys(data || []);
    }
  };

  useEffect(() => {
    if (!loading && session) {
      fetchApiKeys();
    }
  }, [session, loading]);

  const handleGenerateApiKey = async () => {
    if (!session?.access_token || !newKeyName) {
      toast.error('Por favor, ingrese un nombre para la clave.');
      return;
    }

    setIsGenerating(true);
    setGeneratedApiKey(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-api-key', {
        body: { keyName: newKeyName },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (error) {
        console.error('Error invoking generate-api-key function:', error);
        toast.error(`Error al generar la clave API: ${error.message}`);
      } else if (data && data.apiKey) {
        setGeneratedApiKey(data.apiKey);
        setShowNewKeyDialog(true);
        setNewKeyName('');
        fetchApiKeys(); // Refresh the list of keys
        toast.success('Clave API generada con éxito!');
      } else {
        toast.error('Respuesta inesperada al generar la clave API.');
      }
    } catch (error: any) {
      console.error('Network or unexpected error:', error);
      toast.error(`Error de red o inesperado: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('¿Está seguro de que desea revocar esta clave API? Esta acción es irreversible.')) {
      return;
    }

    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('id', keyId);

    if (error) {
      console.error('Error deleting API key:', error);
      toast.error('Error al revocar la clave API.');
    } else {
      toast.success('Clave API revocada con éxito.');
      fetchApiKeys(); // Refresh the list
    }
  };

  if (loading) {
    return <div className="text-center py-10">Cargando claves API...</div>;
  }

  if (!session) {
    return <div className="text-center py-10 text-red-500">Debe iniciar sesión para gestionar las claves API.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <h2 className="text-3xl font-bold text-slate-800 mb-6">Gestión de Claves de Acceso (API Keys)</h2>
      <p className="text-slate-600">
        Aquí puede generar y gestionar claves de acceso personalizadas para integrar VulcanHR con otras herramientas o scripts.
        Mantenga sus claves seguras y no las comparta.
      </p>

      <Card className="bg-white rounded-3xl shadow-sm border border-slate-100">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800">Generar Nueva Clave API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newKeyName" className="text-sm font-medium text-slate-700">Nombre de la Clave</Label>
            <Input
              id="newKeyName"
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Ej. Clave para Integración de Reportes"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#003366] outline-none transition-all"
            />
          </div>
          <Button
            onClick={handleGenerateApiKey}
            disabled={isGenerating || !newKeyName}
            className="bg-[#003366] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#002244] transition-all"
          >
            {isGenerating ? 'Generando...' : 'Generar Clave API'}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-white rounded-3xl shadow-sm border border-slate-100">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800">Sus Claves API Existentes</CardTitle>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <p className="text-center py-8 text-slate-400 italic">No ha generado ninguna clave API aún.</p>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div key={key.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-800">{key.key_name}</p>
                    <p className="text-xs text-slate-500">Creada: {new Date(key.created_at).toLocaleDateString()}</p>
                  </div>
                  <Button
                    variant="destructive" // Assuming shadcn/ui destructive variant
                    onClick={() => handleDeleteApiKey(key.id)}
                    className="bg-rose-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-rose-600 transition-all"
                  >
                    Revocar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog to display the newly generated API key */}
      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">¡Su Nueva Clave API!</DialogTitle>
            <DialogDescription className="text-slate-600">
              Por favor, copie esta clave ahora. No la mostraremos de nuevo por razones de seguridad.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="displayApiKey" className="sr-only">Clave API</Label>
            <Input
              id="displayApiKey"
              type="text"
              value={generatedApiKey || ''}
              readOnly
              className="font-mono text-sm bg-slate-100 border-slate-200 p-3 rounded-lg"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (generatedApiKey) {
                  navigator.clipboard.writeText(generatedApiKey);
                  toast.success('Clave copiada al portapapeles!');
                }
                setShowNewKeyDialog(false);
              }}
              className="bg-[#003366] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#002244] transition-all"
            >
              Copiar y Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApiKeyManagement;