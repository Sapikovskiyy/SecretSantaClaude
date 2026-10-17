import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Copy, Send } from 'lucide-react';
import { Button, Header, Screen } from '@/components/ui';
import { GiftArt } from '@/components/Art';
import { useApp } from '@/store/app';
import { AnimatedFeedback } from '@/motion';
import { inviteLink, shareInvite } from '@/lib/telegram';

export default function Invite() {
  const { id } = useParams();
  const nav = useNavigate();
  const room = useApp((s) => s.rooms.find((r) => r.id === id));
  const [copied, setCopied] = useState(false);
  if (!room) return <Screen><Header /><p>Комната не найдена.</p></Screen>;
  const link = inviteLink(room.code);
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { window.prompt('Скопируйте ссылку:', link); }
  };
  return (
    <Screen style="--surface-interests">
      <Header title="Приглашение" />
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <GiftArt className="h-44 w-44 animate-float" />
        <h2 className="mt-4 font-display text-3xl leading-tight">Позовите друзей в «{room.name}»</h2>
        <p className="mt-3 text-sm text-cream/80">Ссылка откроет игру сразу, вводить код не нужно.</p>
        <div className="mt-6 w-full rounded-2xl bg-black/25 p-4 text-left">
          <p className="text-xs text-cream/70">Код: <b className="font-display text-base tracking-widest">{room.code}</b></p>
          <p className="mt-1 break-all text-sm">{link}</p>
        </div>
      </div>
      <div className="space-y-3">
        <AnimatedFeedback show={copied}>Ссылка скопирована</AnimatedFeedback>
        <Button variant="cream" className="w-full" onClick={() => shareInvite(room.code, room.name)}><Send size={18} />Отправить в Telegram</Button>
        <Button variant="ghost" className="w-full" onClick={copy}><Copy size={18} />{copied ? 'Скопировано' : 'Скопировать ссылку'}</Button>
        <Button variant="ghost" className="w-full" onClick={() => nav(`/room/${room.id}`, { replace: true })}>К комнате</Button>
      </div>
    </Screen>
  );
}
