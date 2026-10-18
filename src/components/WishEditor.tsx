import { useEffect, useState } from 'react'
import { Button } from './ui/Buttons'
import { Chip, Field, Sheet, inputLight } from './ui/Kit'
import { INTERESTS } from '@/domain/interests'
import type { InterestId, Priority, WishItem } from '@/domain/types'
import { useDemo } from '@/data/demoStore'
import { toast } from '@/data/uiStore'

const PRIORITIES: { id: Priority; label: string }[] = [
  { id: 'high', label: 'Очень хочу' },
  { id: 'normal', label: 'Хочу' },
  { id: 'low', label: 'Было бы неплохо' },
]

export function WishEditor({
  open,
  onClose,
  item,
  defaultCategory,
}: {
  open: boolean
  onClose: () => void
  item?: WishItem
  defaultCategory?: InterestId
}) {
  const { addWish, updateWish } = useDemo()
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<InterestId>('other')
  const [priority, setPriority] = useState<Priority>('normal')

  useEffect(() => {
    if (!open) return
    setTitle(item?.title ?? '')
    setPrice(item?.price ? String(item.price) : '')
    setUrl(item?.url ?? '')
    setDescription(item?.description ?? '')
    setCategory(item?.category ?? defaultCategory ?? 'other')
    setPriority(item?.priority ?? 'normal')
  }, [open, item, defaultCategory])

  const save = () => {
    const t = title.trim()
    if (t.length < 2) return toast('Напишите, что вы хотите', 'error')
    const u = url.trim()
    if (u && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(u)) return toast('Ссылка должна начинаться с https://', 'error')
    const data = {
      title: t.slice(0, 80),
      price: price ? Number(price) : undefined,
      url: u || undefined,
      description: description.trim().slice(0, 300) || undefined,
      category,
      priority,
    }
    if (item) updateWish(item.id, data)
    else addWish(data)
    toast(item ? 'Желание обновлено' : 'Добавлено в вишлист')
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={item ? 'Изменить желание' : 'Новое желание'}>
      <div className="space-y-4">
        <Field label="Что подарить">
          <input className={inputLight} value={title} maxLength={80} placeholder="Например, тёплый плед" onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Цена, ₽">
            <input className={inputLight} inputMode="numeric" placeholder="Примерно" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, '').slice(0, 7))} />
          </Field>
          <Field label="Ссылка">
            <input className={inputLight} inputMode="url" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} />
          </Field>
        </div>
        <Field label="Подробности">
          <textarea className={`${inputLight} h-20 resize-none py-3`} placeholder="Цвет, размер, модель" value={description} maxLength={300} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div>
          <p className="mb-2 text-secondary opacity-70">Категория</p>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
            {INTERESTS.map((i) => (
              <Chip key={i.id} tone="light" active={category === i.id} onClick={() => setCategory(i.id)}>
                {i.title}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-secondary opacity-70">Насколько хочется</p>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((p) => (
              <Chip key={p.id} tone="light" active={priority === p.id} onClick={() => setPriority(p.id)}>
                {p.label}
              </Chip>
            ))}
          </div>
        </div>
        <Button className="w-full" onClick={save}>
          {item ? 'Сохранить' : 'Добавить в вишлист'}
        </Button>
      </div>
    </Sheet>
  )
}

export const priorityLabel = (p: Priority) => PRIORITIES.find((x) => x.id === p)!.label
