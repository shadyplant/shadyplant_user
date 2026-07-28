"use client";

import { Minus, Plus } from "lucide-react";
import {
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type TouchEvent,
} from "react";

type QuantityStepperProps = {
  value: string | number;
  min: number;
  max: number;
  ariaLabel: string;
  decreaseAriaLabel?: string;
  increaseAriaLabel?: string;
  className?: string;
  inputClassName?: string;
  decreaseDisabled?: boolean;
  increaseDisabled?: boolean;
  onChange: (value: string) => void;
  onCommit: (value: string) => void | Promise<void>;
  onDecrease: () => void | Promise<void>;
  onIncrease: () => void | Promise<void>;
  onInputFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  onInputKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  onMouseDown?: (event: MouseEvent<HTMLElement>) => void;
  onTouchStart?: (event: TouchEvent<HTMLElement>) => void;
  iconSize?: number;
  iconStrokeWidth?: number;
  compact?: boolean;
};

function joinClassNames(...classNames: Array<string | undefined | false>) {
  return classNames.filter(Boolean).join(" ");
}

export default function QuantityStepper({
  value,
  min,
  max,
  ariaLabel,
  decreaseAriaLabel = "Decrease quantity",
  increaseAriaLabel = "Increase quantity",
  className,
  inputClassName,
  decreaseDisabled = false,
  increaseDisabled = false,
  onChange,
  onCommit,
  onDecrease,
  onIncrease,
  onInputFocus,
  onInputKeyDown,
  onMouseDown,
  onTouchStart,
  iconSize = 19,
  iconStrokeWidth = 2.7,
  compact = false,
}: QuantityStepperProps) {
  function handleInputFocus(event: FocusEvent<HTMLInputElement>) {
    onInputFocus?.(event);
    event.currentTarget.select();
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onInputKeyDown?.(event);

    if (!event.defaultPrevented && event.key === "Enter") {
      event.currentTarget.blur();
    }
  }

  return (
    <div
      style={
        compact
          ? ({
              height: "1.75rem",
              gridTemplateColumns: "1.45rem minmax(4ch,1fr) 1.45rem",
            } as CSSProperties)
          : undefined
      }
      className={joinClassNames(
        "grid h-11 w-full shrink-0 grid-cols-[2.75rem_minmax(8ch,1fr)_2.75rem] items-center overflow-hidden rounded-[0.5rem] border border-[#4c8d5b] bg-white text-[#0d9a55] sm:h-12 sm:grid-cols-[3rem_minmax(9ch,1fr)_3rem]",
        compact && "sm:h-12 sm:grid-cols-[3rem_minmax(9ch,1fr)_3rem] rounded-sm",
        className,
      )}
    >
      <button
        type="button"
        aria-label={decreaseAriaLabel}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onClick={() => void onDecrease()}
        disabled={decreaseDisabled}
        className={joinClassNames(
          "flex h-full touch-manipulation items-center justify-center bg-[#e7f9e7] transition hover:bg-[#d7f1d7] disabled:cursor-not-allowed disabled:opacity-50",
          compact && "text-[0.7rem]",
        )}
      >
        <Minus size={iconSize} strokeWidth={iconStrokeWidth} />
      </button>

      <input
        type="number"
        min={min}
        max={max}
        inputMode="numeric"
        value={value}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onFocus={handleInputFocus}
        onChange={(event) => onChange(event.target.value)}
        onBlur={(event) => void onCommit(event.target.value)}
        onKeyDown={handleInputKeyDown}
        className={joinClassNames(
          "h-full w-full min-w-0 border-x border-[#d9eddc] bg-white px-1 text-center text-[16px] font-semibold tabular-nums leading-none text-[#0d9a55] outline-none [appearance:textfield] focus:bg-[#f4fbf2] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none sm:px-2 sm:text-[18px]",
          inputClassName,
        )}
        aria-label={ariaLabel}
      />

      <button
        type="button"
        aria-label={increaseAriaLabel}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onClick={() => void onIncrease()}
        disabled={increaseDisabled}
        className={joinClassNames(
          "flex h-full touch-manipulation items-center justify-center bg-[#e7f9e7] transition hover:bg-[#d7f1d7] disabled:cursor-not-allowed disabled:opacity-50",
          compact && "text-[0.7rem]",
        )}
      >
        <Plus size={iconSize} strokeWidth={iconStrokeWidth} />
      </button>
    </div>
  );
}
