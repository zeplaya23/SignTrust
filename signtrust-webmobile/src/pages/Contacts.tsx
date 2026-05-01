import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactService } from '../services/contactService';
import TopBar from '../components/layout/TopBar';
import Sheet from '../components/ui/Sheet';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { toast } from '../components/ui/Toast';

export default function Contacts() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const { data } = useQuery({ queryKey: ['contacts'], queryFn: () => contactService.getAll() });

  const create = useMutation({
    mutationFn: () => contactService.create({ name, email, phone }),
    onSuccess: () => {
      toast('Contact ajouté', 'success');
      qc.invalidateQueries({ queryKey: ['contacts'] });
      setOpen(false); setName(''); setEmail(''); setPhone('');
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => contactService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });

  return (
    <div className="flex flex-col">
      <TopBar
        title="Contacts"
        back
        right={
          <button onClick={() => setOpen(true)} className="text-sm text-primary font-medium">+ Ajouter</button>
        }
      />

      <div className="px-5 pt-4 flex flex-col gap-2">
        {(data ?? []).map((c) => (
          <div key={c.id} className="bg-white rounded-2xl p-4 border border-line-soft flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center font-semibold">
              {c.name?.[0]}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-ink truncate">{c.name}</p>
              <p className="text-xs text-muted truncate">{c.email}</p>
            </div>
            <button
              onClick={() => remove.mutate(c.id)}
              className="text-danger text-sm w-9 h-9 rounded-full active:bg-danger-light"
              aria-label="Supprimer"
            >
              ✕
            </button>
          </div>
        ))}
        {!data?.length && <p className="text-center text-muted text-sm py-12">Aucun contact.</p>}
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title="Nouveau contact">
        <div className="flex flex-col gap-3">
          <Input label="Nom complet" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Téléphone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button size="lg" fullWidth onClick={() => create.mutate()} loading={create.isPending} disabled={!name || !email}>
            Enregistrer
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
