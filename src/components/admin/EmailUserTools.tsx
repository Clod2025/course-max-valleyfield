import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Eye, Mail, KeyRound, Link2, Trash2 } from 'lucide-react'

const EmailUserTools = () => {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const withLoading = async (key: string, fn: () => Promise<void>) => {
    setLoading(key)
    try { await fn() } finally { setLoading(null) }
  }

  const lookupByEmail = async () => {
    const { data, error } = await supabase.functions.invoke('get-user-by-email', { body: { email } })
    if (error) throw error
    return data
  }

  const handleCheck = () => withLoading('check', async () => {
    try {
      const res = await lookupByEmail()
      if (res?.exists) {
        toast({ title: 'Utilisateur trouvé', description: `ID: ${res.user.id}`, variant: 'default' })
      } else {
        toast({ title: 'Introuvable', description: 'Aucun utilisateur avec cet email', variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message || 'Vérification impossible', variant: 'destructive' })
    }
  })

  const handleDelete = () => withLoading('delete', async () => {
    try {
      const res = await lookupByEmail()
      if (!res?.exists) {
        toast({ title: 'Introuvable', description: 'Aucun utilisateur avec cet email', variant: 'destructive' })
        return
      }
      const { data, error } = await supabase.functions.invoke('delete-users', { body: { userIds: [res.user.id] } })
      if (error) throw error
      const item = data?.results?.[0]
      toast({ title: 'Suppression', description: `${item?.status}: ${item?.message || ''}`, variant: item?.status === 'success' ? 'default' : 'destructive' })
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message || 'Suppression impossible', variant: 'destructive' })
    }
  })

  const handleUpdatePassword = () => withLoading('updatePwd', async () => {
    try {
      if (!newPassword) {
        toast({ title: 'Mot de passe requis', description: 'Veuillez saisir un nouveau mot de passe', variant: 'destructive' })
        return
      }
      const { data, error } = await supabase.functions.invoke('update-user-password', { body: { email, newPassword } })
      if (error) throw error
      toast({ title: 'Mot de passe mis à jour', description: data?.message || 'Succès', variant: 'default' })
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message || 'Mise à jour impossible', variant: 'destructive' })
    }
  })

  const handleMagicLink = () => withLoading('magic', async () => {
    try {
      const redirectUrl = `${window.location.origin}/`
      const { data, error } = await supabase.functions.invoke('send-magic-link', { body: { email, redirectUrl } })
      if (error) throw error
      toast({ title: 'Magic link envoyé', description: data?.message || 'Vérifiez votre email', variant: 'default' })
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message || 'Envoi impossible', variant: 'destructive' })
    }
  })

  const handleResetLink = () => withLoading('reset', async () => {
    try {
      const redirectUrl = `${window.location.origin}/`
      const { data, error } = await supabase.functions.invoke('send-password-reset', { body: { email, redirectUrl } })
      if (error) throw error
      toast({ title: 'Lien de réinitialisation envoyé', description: data?.message || 'Vérifiez votre email', variant: 'default' })
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message || 'Envoi impossible', variant: 'destructive' })
    }
  })

  return (
    <section aria-label="Outils par email" className="space-y-4">
      <h4 className="font-medium">Outils par email</h4>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="email">Email utilisateur</Label>
          <Input id="email" type="email" placeholder="user@test.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <PasswordInput id="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" size="sm" onClick={handleCheck} disabled={!email || loading!==null} className="flex items-center gap-2">
          <Eye className="w-4 h-4" /> {loading==='check' ? 'Vérification…' : 'Vérifier'}
        </Button>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={!email || loading!==null} className="flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> {loading==='delete' ? 'Suppression…' : 'Supprimer'}
        </Button>
        <Button variant="default" size="sm" onClick={handleUpdatePassword} disabled={!email || loading!==null} className="flex items-center gap-2">
          <KeyRound className="w-4 h-4" /> {loading==='updatePwd' ? 'Mise à jour…' : 'Maj mot de passe'}
        </Button>
        <Button variant="outline" size="sm" onClick={handleMagicLink} disabled={!email || loading!==null} className="flex items-center gap-2">
          <Link2 className="w-4 h-4" /> {loading==='magic' ? 'Envoi…' : 'Magic link'}
        </Button>
        <Button variant="outline" size="sm" onClick={handleResetLink} disabled={!email || loading!==null} className="flex items-center gap-2">
          <Mail className="w-4 h-4" /> {loading==='reset' ? 'Envoi…' : 'Lien reset'}
        </Button>
      </div>
    </section>
  )
}

export default EmailUserTools
