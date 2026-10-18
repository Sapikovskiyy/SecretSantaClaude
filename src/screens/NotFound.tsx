import { Link } from 'react-router'
import { Screen } from '@/components/ui/Screen'
import { Art } from '@/components/art/Art'

export function NotFound() {
  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <Art name="bauble" size={150} />
        <h1 className="type-title mt-4">Такой страницы нет</h1>
        <p className="mt-2 text-[15px] text-snow/60">Возможно, игру удалили или ссылка устарела</p>
        <Link to="/home" className="mt-6 flex h-14 items-center rounded-full bg-snow px-6 text-[16px] font-medium text-ink">
          На главную
        </Link>
      </div>
    </Screen>
  )
}
