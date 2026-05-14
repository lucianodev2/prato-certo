interface RatingStarsProps {
  value: number
  onChange?: (v: number) => void
  readOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' }

export default function RatingStars({ value, onChange, readOnly = false, size = 'md' }: RatingStarsProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={`${sizeMap[size]} transition-transform ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          aria-label={`${star} estrelas`}
        >
          {star <= value ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  )
}
