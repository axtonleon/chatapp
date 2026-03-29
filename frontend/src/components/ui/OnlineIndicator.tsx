import clsx from 'clsx'

interface Props {
  isOnline: boolean
  className?: string
}

export default function OnlineIndicator({ isOnline, className }: Props) {
  return (
    <span
      className={clsx(
        'inline-block w-2.5 h-2.5 rounded-full',
        isOnline ? 'bg-green-500' : 'bg-gray-400',
        className,
      )}
    />
  )
}
