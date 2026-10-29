import { useId } from 'react'
import { PiStar, PiStarFill } from 'react-icons/pi'
import { starsLabel } from '../../walkthrough/flow'

const STARS = [1, 2, 3, 4, 5]

type Props = {
  legend: string
  value: number | null
  onChange: (value: number) => void
}

/** A native radio group styled as five stars, so Tab and the arrow keys work as usual. */
function StarRating({ legend, value, onChange }: Props) {
  const name = useId()
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="flex gap-1">
        {STARS.map((stars) => {
          const Icon = value !== null && stars <= value ? PiStarFill : PiStar
          return (
            <label
              key={stars}
              className="cursor-pointer rounded-full p-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-border-focus"
            >
              <input
                type="radio"
                name={name}
                value={stars}
                checked={value === stars}
                onChange={() => onChange(stars)}
                className="sr-only"
              />
              <Icon aria-hidden="true" className="size-10 text-icon-default" />
              <span className="sr-only">{starsLabel(stars)}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export default StarRating
