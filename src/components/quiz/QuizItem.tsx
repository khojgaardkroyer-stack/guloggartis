import { PiMapPin } from 'react-icons/pi'
import type { QuizItem as Item } from '../../quiz/items'
import { splitOnWarning } from '../../quiz/quiz'

type Props = {
  item: Item
  /** Highlight the warning sign (after the visitor has answered) */
  revealed: boolean
}

const LINK_PATTERN = /([a-z0-9-]+\.(?:net|dk|com))/i

/** Styles anything that looks like a URL as a link, without making it clickable. */
function LinkLikeText({ text }: { text: string }) {
  return text.split(LINK_PATTERN).map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className="text-text-link underline">
        {part}
      </span>
    ) : (
      part
    ),
  )
}

function Highlighted({ text, field, item, revealed }: Props & { text: string; field: Item['warningIn'] }) {
  const parts = revealed && item.warningIn === field ? splitOnWarning(text, item.warning) : [text]
  if (parts.length === 1) return <LinkLikeText text={text} />
  const [before, warning, after] = parts
  return (
    <>
      <LinkLikeText text={before} />
      <mark className="rounded bg-surface-yellow-light text-inherit">
        <LinkLikeText text={warning} />
      </mark>
      <LinkLikeText text={after} />
    </>
  )
}

function QuizItem({ item, revealed }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-lg font-semibold">{item.situation}</p>
      {item.kind === 'chat' ? (
        <div className="max-w-md space-y-1">
          <p className="text-sm font-semibold text-text-primary">{item.sender}</p>
          <p className="rounded-2xl rounded-tl-sm bg-surface-gray-light px-4 py-3 text-lg text-text-primary">
            <Highlighted item={item} revealed={revealed} text={item.text} field="text" />
          </p>
        </div>
      ) : (
        <AdCard item={item} revealed={revealed} />
      )}
    </div>
  )
}

function AdCard({ item, revealed }: { item: Extract<Item, { kind: 'ad' }>; revealed: boolean }) {
  const Icon = item.icon
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div
        aria-hidden="true"
        className="flex h-32 shrink-0 items-center justify-center rounded-2xl bg-surface-gray-light text-6xl text-icon-default sm:size-32"
      >
        <Icon />
      </div>
      <div className="space-y-1 text-text-primary">
        <p className="text-xl font-bold">
          <Highlighted item={item} revealed={revealed} text={item.title} field="title" />
        </p>
        <p className="text-xl font-bold">{item.price}</p>
        <p className="flex items-center gap-1 text-sm">
          <PiMapPin aria-hidden="true" className="text-icon-default" /> {item.place}
        </p>
        <p className="text-lg">
          <Highlighted item={item} revealed={revealed} text={item.description} field="description" />
        </p>
      </div>
    </div>
  )
}

export default QuizItem
