import { Link } from 'react-router'
import { Screen } from '@/components/ui/Screen'
import { buttonClass } from '@/components/ds'
import { Art } from '@/components/art/Art'

export function NotFound() {
  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <Art name="bauble" size={150} />
        <h1 className="type-title mt-4">Такой страницы нет</h1>
        <p className="mt-2 text-callout text-snow/60">Возможно, игру удалили или ссылка устарела</p>
        <Link to="/home" className={buttonClass({ variant: 'secondary', size: 'medium', className: 'mt-6' })}>
          На главную
        </Link>
      </div>
    </Screen>
  )
}
