import { PiCoin } from 'react-icons/pi'
import { MONEY_LABEL, type Money } from '../../walkthrough/flow'

const BOXES = ['Køber', 'Handelskonto', 'Sælger']

/** Which box the coin sits in. Refunded money is back with the buyer. */
const POSITION: Record<Money, number> = { buyer: 0, escrow: 1, seller: 2, refunded: 0 }

const TRANSLATE = ['translate-x-0', 'translate-x-full', 'translate-x-[200%]']

type Props = {
  money: Money
}

/** Three boxes and a coin that slides to wherever the money is. */
function MoneyTrack({ money }: Props) {
  const position = POSITION[money]
  return (
    <div className="space-y-2">
      <div className="relative">
        <div aria-hidden="true" className="grid grid-cols-3">
          {BOXES.map((label, i) => (
            <div key={label} className="px-1">
              <div
                className={`rounded-xl px-1 pt-12 pb-2 text-center text-xs font-semibold break-words transition-colors duration-400 motion-reduce:transition-none sm:text-sm ${
                  i === position ? 'bg-surface-yellow-light' : 'bg-surface-gray-light'
                }`}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
        <div
          aria-hidden="true"
          className={`absolute top-2 left-0 flex w-1/3 justify-center transition-transform duration-400 ease-in-out motion-reduce:transition-none ${TRANSLATE[position]}`}
        >
          <PiCoin className="size-8 text-icon-default" />
        </div>
      </div>
      <p className="text-center text-base font-semibold">{MONEY_LABEL[money]}</p>
    </div>
  )
}

export default MoneyTrack
