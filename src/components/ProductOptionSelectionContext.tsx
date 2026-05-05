"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product, ProductOption, ProductOptionGroup } from "@/lib/products";
import { formatCurrency } from "@/lib/formatCurrency";

type ProductOptionSelection = {
  groupKey: string;
  optionKey: string;
  label: string;
  groupTitle: string;
};

type ResolvedProductPurchaseState = {
  variantId: string;
  lineId: string;
  optionSelections: ProductOptionSelection[];
  selectedLabels: string[];
  displayLabel: string;
  price: number;
  stock: number;
  packLabel: string;
  weight: number;
};

type ProductOptionSelectionContextValue = {
  product: Product;
  optionGroups: ProductOptionGroup[];
  selectedOptionKeys: Record<string, string>;
  resolved: ResolvedProductPurchaseState;
  selectOption: (groupKey: string, optionKey: string) => void;
};

const ProductOptionSelectionContext =
  createContext<ProductOptionSelectionContextValue | null>(null);

function normalizeOptionNumber(value: number | null | undefined) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : null;
}

function buildVariantId(selections: ProductOptionSelection[]) {
  return selections
    .map((selection) => `${selection.groupKey}~${selection.optionKey}`)
    .join("|");
}

function buildLineId(productId: string, variantId: string) {
  return `${productId}::${variantId || "default"}`;
}

function buildDefaultSelections(optionGroups: ProductOptionGroup[]) {
  return Object.fromEntries(
    optionGroups.flatMap((group) => {
      const selectedOption =
        group.options.find((option) => option.isDefault && !option.isDisabled) ||
        group.options.find((option) => !option.isDisabled) ||
        null;

      return selectedOption ? [[group.key, selectedOption.key]] : [];
    }),
  );
}

function resolvePurchaseState(
  product: Product,
  optionGroups: ProductOptionGroup[],
  selectedOptionKeys: Record<string, string>,
): ResolvedProductPurchaseState {
  const selectedOptions = optionGroups.flatMap((group) => {
    const requestedOptionKey = selectedOptionKeys[group.key];
    const selectedOption =
      group.options.find(
        (option) => option.key === requestedOptionKey && !option.isDisabled,
      ) ||
      group.options.find((option) => option.isDefault && !option.isDisabled) ||
      group.options.find((option) => !option.isDisabled) ||
      null;

    return selectedOption
      ? [
          {
            group,
            option: selectedOption,
          },
        ]
      : [];
  });
  const optionSelections = selectedOptions.map(({ group, option }) => ({
    groupKey: group.key,
    optionKey: option.key,
    label: option.label,
    groupTitle: group.title,
  }));
  const resolvedPriceCandidate = [...selectedOptions]
    .reverse()
    .find(({ option }) => normalizeOptionNumber(option.price) !== null)?.option.price;
  const resolvedStockCandidate = [...selectedOptions]
    .reverse()
    .find(({ option }) => normalizeOptionNumber(option.stock) !== null)?.option.stock;
  const resolvedPackLabelCandidate = [...selectedOptions]
    .reverse()
    .find(({ option }) => String(option.packLabel || "").trim())?.option.packLabel;
  const resolvedWeightCandidate = [...selectedOptions]
    .reverse()
    .find(({ option }) => normalizeOptionNumber(option.weight) !== null)?.option.weight;
  const variantId = buildVariantId(optionSelections);

  return {
    variantId,
    lineId: buildLineId(product.id, variantId),
    optionSelections,
    selectedLabels: optionSelections.map((selection) => selection.label),
    displayLabel: optionSelections.map((selection) => selection.label).join(" / "),
    price:
      normalizeOptionNumber(resolvedPriceCandidate) ?? Number(product.price || 0),
    stock:
      Math.max(
        0,
        Math.floor(
          normalizeOptionNumber(resolvedStockCandidate) ?? Number(product.stock || 0),
        ),
      ),
    packLabel:
      String(resolvedPackLabelCandidate || "").trim() || product.packLabel,
    weight:
      normalizeOptionNumber(resolvedWeightCandidate) ?? Number(product.weight || 0),
  };
}

export function ProductOptionSelectionProvider({
  product,
  optionGroups,
  children,
}: {
  product: Product;
  optionGroups: ProductOptionGroup[];
  children: ReactNode;
}) {
  const [selectedOptionKeys, setSelectedOptionKeys] = useState<Record<string, string>>(
    () => buildDefaultSelections(optionGroups),
  );
  const resolved = useMemo(
    () => resolvePurchaseState(product, optionGroups, selectedOptionKeys),
    [optionGroups, product, selectedOptionKeys],
  );
  const value = useMemo<ProductOptionSelectionContextValue>(
    () => ({
      product,
      optionGroups,
      selectedOptionKeys,
      resolved,
      selectOption(groupKey, optionKey) {
        setSelectedOptionKeys((current) => ({
          ...current,
          [groupKey]: optionKey,
        }));
      },
    }),
    [optionGroups, product, resolved, selectedOptionKeys],
  );

  return (
    <ProductOptionSelectionContext.Provider value={value}>
      {children}
    </ProductOptionSelectionContext.Provider>
  );
}

export function useProductOptionSelection() {
  const context = useContext(ProductOptionSelectionContext);

  if (!context) {
    throw new Error("useProductOptionSelection must be used inside its provider.");
  }

  return context;
}

export function useOptionalProductOptionSelection() {
  return useContext(ProductOptionSelectionContext);
}

function formatProductOptionLabel(option: ProductOption) {
  if (option.label.trim()) {
    return option.label.trim();
  }

  if (option.value !== null && option.unit.trim()) {
    return `${Number.isInteger(option.value) ? option.value : Number(option.value.toFixed(2))} ${option.unit}`;
  }

  if (option.value !== null) {
    return Number.isInteger(option.value)
      ? String(option.value)
      : String(Number(option.value.toFixed(2)));
  }

  return option.key;
}

export function ProductOptionGroupsSelector({
  variant,
}: {
  variant: "mobile" | "desktop";
}) {
  const { optionGroups, product, resolved, selectOption, selectedOptionKeys } =
    useProductOptionSelection();

  if (!optionGroups.length) {
    return null;
  }

  return (
    <div className={variant === "mobile" ? "mt-4 space-y-3" : "mt-6 space-y-4 md:mt-8"}>
      {optionGroups.map((group) => (
        <section
          key={group.key}
          className={
            variant === "mobile"
              ? "rounded-xl border border-[#dce8ce] bg-white p-4"
              : "rounded-xl border border-[#dce8ce] bg-white p-4 md:p-5"
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p
                className={
                  variant === "mobile"
                    ? "text-[15px] font-black text-[#163915]"
                    : "text-base font-bold text-[#163915]"
                }
              >
                {group.title}
              </p>
              <p
                className={
                  variant === "mobile"
                    ? "mt-0.5 text-[11px] leading-4 text-[#6d8464]"
                    : "mt-0.5 text-xs text-[#6d8464] md:text-sm"
                }
              >
                {group.subtitle || "Choose the option that fits your space best"}
              </p>
            </div>
            {group.guideLabel ? (
              <button
                type="button"
                className={
                  variant === "mobile"
                    ? "text-[11px] font-semibold text-[#2c6db3]"
                    : "text-xs font-semibold text-[#2c6db3] transition hover:text-[#214f14] md:text-sm"
                }
              >
                {group.guideLabel}
              </button>
            ) : null}
          </div>

          <div className={variant === "mobile" ? "mt-4 flex flex-wrap gap-2" : "mt-4 flex flex-wrap gap-2 md:gap-3"}>
            {group.options.map((option) => {
              const isSelected = selectedOptionKeys[group.key] === option.key;
              const optionStock = normalizeOptionNumber(option.stock);
              const isDisabled = option.isDisabled || optionStock === 0;

              return (
                <button
                  key={option.key}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => selectOption(group.key, option.key)}
                  className={`rounded-lg border text-center transition ${
                    variant === "mobile"
                      ? "min-w-[72px] px-3 py-2"
                      : "min-w-[64px] px-3 py-2 md:min-w-[76px] md:px-4 md:py-2.5"
                  } ${
                    isSelected
                      ? "border-[#214f14] bg-[#214f14] text-white shadow-sm"
                      : isDisabled
                        ? "border-[#dbe6cf] bg-[#f8fbf4] text-[#b1beaa]"
                        : "border-[#d8e6cb] bg-[#f9fcf5] text-[#163915] hover:border-[#aac58d] hover:bg-[#f2f8ea]"
                  }`}
                >
                  <span
                    className={
                      variant === "mobile"
                        ? "block text-sm font-semibold"
                        : "block text-sm font-semibold md:text-base"
                    }
                  >
                    {formatProductOptionLabel(option)}
                  </span>
                  {option.note || optionStock === 0 ? (
                    <span
                      className={`mt-1 block font-medium ${
                        variant === "mobile" ? "text-[10px]" : "text-[10px] md:text-[11px]"
                      } ${
                        isSelected ? "text-[#d6e6bd]" : "text-[#d45b39]"
                      }`}
                    >
                      {optionStock === 0 ? "Out of stock" : option.note}
                    </span>
                  ) : null}
                  {normalizeOptionNumber(option.price) !== null &&
                  normalizeOptionNumber(option.price) !== product.price ? (
                    <span
                      className={`mt-1 block ${
                        variant === "mobile" ? "text-[10px]" : "text-[10px] md:text-[11px]"
                      } ${isSelected ? "text-white/80" : "text-[#58724f]"}`}
                    >
                      {formatCurrency(Number(option.price))}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {resolved.displayLabel ? (
        <p
          className={
            variant === "mobile"
              ? "px-1 text-[11px] font-medium text-[#58724f]"
              : "px-1 text-sm font-medium text-[#58724f]"
          }
        >
          Selected: <span className="font-semibold text-[#214f14]">{resolved.displayLabel}</span>
        </p>
      ) : null}
    </div>
  );
}

export function SelectedProductPrice({
  className,
}: {
  className?: string;
}) {
  const { resolved } = useProductOptionSelection();
  return <span className={className}>{formatCurrency(resolved.price)}</span>;
}

export function SelectedProductPackLabel({
  className,
}: {
  className?: string;
}) {
  const { resolved } = useProductOptionSelection();
  return <span className={className}>{resolved.packLabel}</span>;
}

export function SelectedProductStockNotice({
  className,
}: {
  className?: string;
}) {
  const { resolved } = useProductOptionSelection();

  if (resolved.stock > 0) {
    return null;
  }

  return <span className={className}>Out of stock</span>;
}

export function SelectedProductAvailabilityRow() {
  const { resolved } = useProductOptionSelection();

  if (resolved.stock > 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#5c7752] md:text-sm">Availability</span>
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#b23b2b] md:text-sm">
        Out of stock
      </span>
    </div>
  );
}
