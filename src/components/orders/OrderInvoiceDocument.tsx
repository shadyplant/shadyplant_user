"use client";
import { formatCurrency } from "@/lib/formatCurrency";
import {
  formatAddress,
  formatDateTime,
  type Order,
} from "@/components/orders/orderUtils";

type InvoiceLineItem = {
  key: string;
  itemName: string;
  description: string;
  hsn: string;
  quantity: number;
  mrp: number;
  discountPercent: number;
  discountAmount: number;
  rate: number;
  taxLabel: string;
  amount: number;
};

const COMPANY = {
  name: "GRASS GREEN NURSERY",
  gstin: "18BNZPA9267Q1ZP",
  addressLines: [
    "Shariatpur, Chenimari - Moinbari Rd Near",
    "TND Bazar Barpeta, Assam, 781319",
  ],
  email: "shadyplant@gmail.com",
  phone: "6001518547",
};

function formatInvoiceNumber(order: Order) {
  return `INV-${String(order.orderNumber || order.id || "")
    .trim()
    .replace(/[^A-Za-z0-9-]/g, "")
    .toUpperCase()}`;
}

function formatInvoiceDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function titleCaseWords(input: string) {
  return input.replace(/\b\w/g, (char) => char.toUpperCase());
}

function numberToWordsBelowThousand(value: number): string {
  const ones = [
    "",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];
  const tens = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];
  const number = Math.max(0, Math.floor(value));
  if (number < 20) return ones[number];
  if (number < 100) {
    const remainder = number % 10;
    return `${tens[Math.floor(number / 10)]}${remainder ? ` ${ones[remainder]}` : ""}`.trim();
  }
  const remainder = number % 100;
  return `${ones[Math.floor(number / 100)]} hundred${remainder ? ` ${numberToWordsBelowThousand(remainder)}` : ""}`.trim();
}

function numberToIndianWords(value: number) {
  const number = Math.max(0, Math.round(Number(value || 0)));
  if (number === 0) return "Zero Rupees Only";
  const parts: string[] = [];
  const crore = Math.floor(number / 10000000);
  const lakh = Math.floor((number % 10000000) / 100000);
  const thousand = Math.floor((number % 100000) / 1000);
  const hundredRemainder = number % 1000;
  if (crore) parts.push(`${numberToWordsBelowThousand(crore)} crore`);
  if (lakh) parts.push(`${numberToWordsBelowThousand(lakh)} lakh`);
  if (thousand) parts.push(`${numberToWordsBelowThousand(thousand)} thousand`);
  if (hundredRemainder)
    parts.push(numberToWordsBelowThousand(hundredRemainder));
  return `${titleCaseWords(parts.join(" ").trim())} Rupees Only`;
}

function getInvoiceLineItems(order: Order): InvoiceLineItem[] {
  if (Array.isArray(order.orderItems) && order.orderItems.length > 0) {
    return order.orderItems.map((item, index) => {
      const quantity = Math.max(1, Math.floor(Number(item.quantity || 0)));
      const rate = Number(item.unitPrice || 0);
      const mrp = Math.max(Number(item.unitMrp || rate), rate);
      const unitDiscount = Math.max(0, mrp - rate);
      const discountAmount = Number((unitDiscount * quantity).toFixed(2));
      const discountPercent =
        mrp > 0 ? Number(((unitDiscount / mrp) * 100).toFixed(2)) : 0;
      const amount =
        Number(item.subtotal || 0) > 0
          ? Number(item.subtotal || 0)
          : rate * quantity;
      const descriptionParts = [
        item.variantLabel,
        item.packLabel,
        item.unit ? `Unit - ${item.unit}` : "",
      ].filter(Boolean);
      return {
        key: item.variantId || item.productId || `${index + 1}`,
        itemName: String(item.name || "Product").trim(),
        description: descriptionParts.join(", ") || "Catalog order item",
        hsn: "0602",
        quantity,
        mrp,
        discountPercent,
        discountAmount,
        rate,
        taxLabel: "0%",
        amount,
      };
    });
  }
  const materialSubtotal = Number(
    order.pricing.materialSubtotal ?? order.pricing.itemsSubtotal ?? 0,
  );
  const quantity = Math.max(1, Math.floor(Number(order.quantitySqft || 0)));
  const unitRate = Number(order.pricing.materialSubtotal || 0)
    ? Number(order.pricing.materialSubtotal || 0) / quantity
    : 0;
  return [
    {
      key: order.id,
      itemName: "Premium grass order",
      description: `${quantity} sqft`,
      hsn: "0602",
      quantity,
      mrp: unitRate,
      discountPercent: 0,
      discountAmount: 0,
      rate: unitRate,
      taxLabel: "0%",
      amount: materialSubtotal,
    },
  ];
}

function formatDiscountPercent(value: number) {
  const roundedValue = Number(value || 0);

  if (!roundedValue) {
    return "0%";
  }

  return `${Number.isInteger(roundedValue) ? roundedValue : roundedValue.toFixed(2)}%`;
}

function getBillingLines(order: Order) {
  const billing = order.billingDetails || {};
  return [
    billing.name || order.fullName,
    billing.contact || order.phoneNumber,
    billing.email || order.email,
    billing.gstin ? `GST: ${billing.gstin}` : "",
    billing.address || "",
    [billing.city, billing.state].filter(Boolean).join(", "),
  ].filter(Boolean);
}

function getShippingLines(order: Order) {
  return [
    order.fullName,
    order.phoneNumber,
    order.email,
    formatAddress(order),
  ].filter(Boolean);
}

// ─── Column widths (px) matching the HTML version ───────────────────────────
const COL_WIDTHS = [
  "30px",
  "120px",
  "auto",
  "40px",
  "38px",
  "56px",
  "52px",
  "52px",
  "38px",
  "78px",
];
const TABLE_HEADERS = [
  "SL",
  "Items",
  "Description",
  "HSN",
  "QTY",
  "MRP",
  "Disc.",
  "Rate",
  "TAX",
  "Amount",
];

export default function OrderInvoiceDocument({
  order,
  standalone = true,
}: {
  order: Order;
  standalone?: boolean;
}) {
  const invoiceItems = getInvoiceLineItems(order);
  const itemsSubtotal = Number(
    order.pricing.itemsSubtotal ?? order.pricing.materialSubtotal ?? 0,
  );
  const totalDiscount = invoiceItems.reduce(
    (sum, item) => sum + Number(item.discountAmount || 0),
    0,
  );
  const deliveryCharge = Number(
    order.pricing.deliveryCharge ?? order.pricing.shippingSubtotal ?? 0,
  );
  const total = Number(order.pricing.total || 0);
  const billingLines = getBillingLines(order);
  const shippingLines = getShippingLines(order);
  const emptyRowCount = Math.max(0, 6 - invoiceItems.length);

  return (
    <div
      style={{
        backgroundColor: standalone ? "#e5e5e5" : "#ffffff",
        fontFamily: "'Roboto', sans-serif",
        color: "#000000",
      }}
    >
      <style>{`
        @page { size: A4; margin: 10mm 12mm 18mm 12mm; }
        @media print {
          body { background: #ffffff !important; }
        }
      `}</style>

      {/* A4 PAGE */}
      <div
        style={{
          width: "210mm",
          height: "297mm",
          backgroundColor: "#ffffff",
          margin: standalone ? "20px auto" : "0",
          padding: "14mm 14mm 22mm 14mm",
          boxShadow: standalone ? "0 4px 32px rgba(0,0,0,0.13)" : "none",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ── HEADER: Logo | INVOICE | Invoice details ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "12px",
            gap: "16px",
          }}
        >
          {/* Logo */}
          <div style={{ minWidth: "150px" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 182.4 127.68"
              style={{ width: "140px", height: "56px", display: "block" }}
            >
              <defs>
                <style>{`
                  .cls-1 { fill: #73a000; }
                  .cls-2 { fill: #642800; }
                  .cls-3 { fill: #035f00; }
                `}</style>
              </defs>
              <g id="Layer_1-2" data-name="Layer 1">
                <g>
                  <g>
                    <path
                      className="cls-1"
                      d="M51.51,62.75c-2.28-1.47-4.64-2.83-6.55-4.8-1.12-1.15-2.25-2.3-2.92-3.91,.73-.13,1.22,.47,1.82,.23,.97,.3,1.95,.41,2.94,.16,.09,.02,.26-.05,.37-.11,.17-.02,.34-.04,.51-.06,1.27-.11,2.42-.51,3.57-1.36-1.59-.12-2.82-.84-4.14-1.27-.23-.31-.57-.42-.91-.53-1.21-.99-2.71-1.66-3.59-3.16,1.54,.01,2.99,.11,4.18-1.11-5.51-1.4-10.09-3.94-13.27-8.91,2.69,.02,5.12-.03,7.51-1.35-3.88-1.54-7.14-3.63-9.98-6.37-.8-1.03-1.59-2.05-2.52-3.24,2.47,.48,4.75,.8,7.15-.68-7.71-3.39-11.11-9.65-12.57-17.27-.58-3-1.13-6.01-1.69-9.02-.28,.41-.38,.83-.45,1.25-.59,3.56-1.08,7.14-1.77,10.67-1.05,5.3-3.12,10.05-7.82,13.22-1.88,1.27-3.97,2.12-6.24,2.93,1.86,.88,3.7,.8,5.75,.77-2.19,2.71-3.99,5.47-7.14,7.27,2.82,1.24,5.42,2.38,8.38,3.68-.7-1.04-1.16-1.76-1.66-2.46-.62-.87-.52-1.46,.39-2.15,1.84-1.4,3.51-3,4.53-5.19-.17-.04-.28-.1-.36-.07-.93,.3-1.86,.62-2.79,.93-.18,.1-.47,.13-.55,.06-.16-.15,.19-.24,.17-.43,.09-.11,.15-.26,.26-.34,4.7-3.36,7.19-7.96,7.73-13.67,.13-.2,.24-.41,.24-.68,.04,.27,.12,.48,.26,.68,.32,4.85,2.11,9.16,5.17,13.04-1.75,.26-2.47-1.02-3.49-1.71,.74,2.74,2.25,4.82,4.61,6.26,.32,.19,.73,.33,.69,.83-.54,.87-1.13,1.74-2.02,2.26-.8,.47-.64,.88-.2,1.46,1.3,1.72,2.79,3.26,4.37,4.72,.86,.8,1.73,1.58,2.79,2.55-2.71,.45-5.08,0-7.67-.42,1.63,2.68,3.86,4.38,6.27,6.07-1.26,.26-2.24-.31-3.46-.35,1.63,2.61,4.12,3.7,7.08,4.66-1.12,.36-1.88,.61-2.65,.86-.35-.05-.69-.03-.98,.19h0l-.1-.05-.09,.08c-2.2-.01-4.36-.31-6.51-.78-3.34-.74-6.7-1.26-10.14-.68-5.71,.96-10.61,3.2-13.58,8.52-.32,.26-.48,.57-.4,1.01,.43-.13,.61-.38,.72-.69,3.93-3.98,8.6-6,14.25-5.27,4.16,.54,7.85,2.3,11.14,4.82,6.75,5.16,14.29,5.28,22.13,3.68,0,0,0,0,0,0,.92-.03,1.79-.23,2.63-.6,.83-.02,1.59-.3,2.34-.63,1.22-.25,2.38-.63,3.49-1.25-1.78-.78-3.5-1.53-5.22-2.28Zm-5.1-8.61c.07,.04,.13,.09,.2,.14-.08-.03-.14-.08-.2-.14Z"
                    />
                    <path
                      className="cls-2"
                      d="M19.02,25.47s2.82,47.39,1.06,70.8-6.16,30.94-6.16,30.94H30.46S19.02,25.47,19.02,25.47Z"
                    />
                  </g>
                  <g>
                    <path
                      className="cls-3"
                      d="M69.28,45.74c2.6,0,4.85,.41,6.76,1.21s3.37,1.87,4.39,3.18c1.03,1.31,1.54,2.71,1.54,4.2s-.28,2.66-.85,3.58-1.39,1.38-2.46,1.38c-1.01,0-1.73-.29-2.16-.87-.44-.58-.71-1.23-.8-1.97-.1-.73-.15-1.33-.15-1.79v-.29c0-1.18-.16-2.25-.49-3.21-.33-.96-.93-1.73-1.82-2.3-.89-.57-2.17-.85-3.85-.85-1.95,0-3.61,.75-5,2.26-1.39,1.51-2.08,3.24-2.08,5.18,0,1.27,.49,2.44,1.46,3.51,.97,1.07,2.21,2.12,3.72,3.13,1.51,1.02,3.12,2.07,4.82,3.15,1.71,1.08,3.31,2.26,4.82,3.54s2.75,2.72,3.72,4.31c.97,1.6,1.46,3.42,1.46,5.48,0,2.19-.37,4.03-1.1,5.54-.73,1.51-1.72,2.73-2.95,3.66-1.24,.93-2.64,1.61-4.2,2.03-1.56,.43-3.19,.64-4.87,.64-2.23,0-4.38-.34-6.46-1.02-2.08-.68-3.78-1.66-5.12-2.95-1.33-1.29-2-2.83-2-4.62,0-.81,.12-1.67,.34-2.57,.23-.91,.64-1.68,1.25-2.33,.6-.64,1.45-.97,2.54-.97s1.99,.32,2.69,.97c.7,.65,1.22,1.47,1.56,2.48,.34,1.01,.51,2.04,.51,3.12v.49c0,.98,.07,1.87,.21,2.66,.14,.79,.54,1.42,1.2,1.89,.66,.47,1.75,.71,3.28,.71,1.84,0,3.4-.68,4.69-2.05s1.94-3.29,1.94-5.76c0-1.66-.45-3.18-1.34-4.54s-2.04-2.65-3.43-3.85c-1.39-1.2-2.87-2.4-4.43-3.59-1.56-1.19-3.04-2.43-4.43-3.72-1.39-1.29-2.53-2.69-3.43-4.21s-1.34-3.23-1.34-5.13c0-1.57,.4-2.96,1.2-4.17s1.81-2.21,3.03-3.03c1.22-.82,2.52-1.44,3.89-1.85,1.37-.42,2.62-.62,3.75-.62Z"
                    />
                    <path
                      className="cls-3"
                      d="M93.35,88.86c.09,.24,.17,.45,.26,.62,.15,.22,.23,.38,.23,.49,0,.09-.05,.13-.16,.13h-10.82s-.07-.02-.07-.07c0-.09,.07-.22,.2-.39,1.09-2.38,2.02-7,2.79-13.84,.76-6.84,1.15-13.11,1.15-18.79,0-2.6-.1-4.8-.31-6.61s-.53-2.96-.97-3.46c-.24-.15-.36-.28-.36-.39,0-.04,.04-.07,.13-.07h6.13c.09,0,.13,.04,.13,.13,0,.11-.04,.23-.13,.36-.22,.48-.39,1.72-.51,3.72-.12,2-.18,4.43-.18,7.3,0,5.82,.24,12.17,.72,19.05,.15-3.56,.44-6.52,.85-8.87,.42-2.35,.92-4.21,1.51-5.59,.59-1.38,1.22-2.39,1.9-3.05s1.36-1.07,2.03-1.25c.68-.17,1.3-.26,1.87-.26,1.46,0,2.61,.34,3.43,1.02,.82,.68,1.4,1.5,1.74,2.46,.34,.96,.51,1.87,.51,2.72l-.03,.29c-.02,.77-.03,1.57-.03,2.43,0,3.85,.23,8.05,.69,12.59,.46,4.55,1.15,7.86,2.07,9.94,.15,.22,.23,.39,.23,.52,0,.07-.05,.1-.16,.1h-10.82s-.07-.02-.07-.07c0-.09,.07-.22,.2-.39,.72-1.38,1.38-3.37,1.97-5.99,.59-2.61,1.06-5.45,1.41-8.51s.53-5.88,.53-8.46c0-.79-.02-1.54-.07-2.26-.02-.59-.08-1.11-.16-1.56-.09-.45-.2-.84-.33-1.16s-.28-.61-.44-.84c-.16-.23-.34-.41-.53-.54s-.37-.22-.54-.28c-.17-.05-.35-.08-.52-.08-.83,0-1.72,.76-2.66,2.28-.94,1.52-1.74,3.72-2.41,6.61s-1,6.41-1,10.56c0,1.42,.05,2.92,.15,4.51,.1,1.58,.26,3.23,.48,4.94Z"
                    />
                    <path
                      className="cls-3"
                      d="M126.18,63.48c-.22-1.03-.85-1.87-1.9-2.53-1.05-.66-2.09-.98-3.12-.98-.96,0-1.78,.27-2.46,.82-.68,.55-1.24,1.28-1.69,2.21s-.8,1.98-1.07,3.16c-.33,1.2-.84,2.04-1.54,2.53-.7,.48-1.37,.72-2,.72-.59,0-1.13-.25-1.61-.74-.48-.49-.72-1.17-.72-2.05,0-.74,.25-1.61,.75-2.59,.46-.88,1.17-1.69,2.13-2.46,.96-.76,2.16-1.39,3.59-1.89s3.06-.74,4.87-.74c1.68,0,3.09,.14,4.21,.41,1.13,.27,2.03,.73,2.72,1.36,.69,.63,1.18,1.5,1.48,2.61,.29,1.1,.44,2.5,.44,4.18,0,3.83,.23,7.94,.71,12.35,.47,4.41,1.15,7.61,2.05,9.62,.04,.09,.09,.18,.15,.28,.05,.1,.08,.18,.08,.25s-.05,.1-.16,.1h-10.82c-.07,0-.09-.02-.07-.07,0-.09,.07-.22,.2-.39,.87-1.68,1.64-4.21,2.29-7.59,.66-3.38,1.13-6.87,1.41-10.48-.42,2.23-.93,4.43-1.54,6.61-.61,2.18-1.34,4.16-2.2,5.95-.85,1.79-1.84,3.24-2.97,4.33-1.13,1.09-2.41,1.64-3.85,1.64-1.57,0-2.9-.41-3.97-1.23-1.07-.82-1.88-1.9-2.43-3.25-.55-1.34-.82-2.8-.82-4.38,0-1.88,.39-3.43,1.18-4.66,.79-1.22,1.83-2.29,3.12-3.21,1.29-.92,2.72-1.82,4.28-2.71,1.56-.89,3.15-1.89,4.75-3.02,1.61-1.12,3.11-2.52,4.51-4.18Zm.1,1.38c-.98,1.51-2.24,2.89-3.77,4.15-1.53,1.26-3.37,2.6-5.51,4.02-1.05,.72-1.89,1.54-2.51,2.46-.62,.92-1.07,1.84-1.33,2.77-.26,.93-.39,1.77-.39,2.51,0,1.51,.34,2.76,1.02,3.75,.68,1,1.6,1.49,2.75,1.49,1.05,0,2.03-.53,2.94-1.59s1.74-2.43,2.49-4.1c.75-1.67,1.43-3.46,2.02-5.38,.59-1.91,1.08-3.76,1.46-5.54,.38-1.78,.66-3.3,.84-4.54Z"
                    />
                    <path
                      className="cls-3"
                      d="M151.86,61.41c.07-1.57,.1-3.06,.1-4.46,0-2.58-.1-4.77-.31-6.58-.21-1.8-.53-2.95-.97-3.43-.22-.15-.33-.28-.33-.39,0-.04,.04-.07,.13-.07h6.1c.09,0,.13,.04,.13,.13,0,.11-.04,.23-.13,.36-.22,.48-.38,1.71-.49,3.67s-.16,4.35-.16,7.15c0,5.68,.22,11.83,.67,18.43s1.13,11.02,2.05,13.25c.04,.09,.09,.18,.15,.28,.05,.1,.08,.18,.08,.25s-.05,.1-.16,.1h-10.82s-.07-.02-.07-.07c0-.09,.07-.22,.2-.39,1.12-2.45,2.05-7.08,2.82-13.91-.98,4.5-2.27,8.02-3.87,10.56s-3.31,3.8-5.15,3.8c-2.3,0-4.19-.88-5.67-2.64-1.49-1.76-2.23-4.3-2.23-7.62,0-.76,.04-1.56,.13-2.39,.31-2.73,.81-5.12,1.51-7.17,.7-2.04,1.52-3.79,2.46-5.23,.94-1.44,1.92-2.61,2.94-3.51,1.02-.9,2-1.55,2.95-1.97,.95-.42,1.79-.62,2.51-.62,.92,0,1.75,.13,2.51,.38,.75,.25,1.38,.57,1.89,.95,.5,.38,.85,.76,1.05,1.13Zm-5.51,.2c-.68,0-1.39,.41-2.15,1.23-.75,.82-1.46,1.86-2.12,3.13-.66,1.27-1.22,2.59-1.69,3.95-.47,1.37-.78,2.62-.93,3.75-.33,2.45-.49,4.6-.49,6.46,0,2.62,.31,4.64,.93,6.03,.62,1.4,1.54,2.1,2.74,2.1,.46,0,.93-.21,1.41-.62,.48-.42,.96-.98,1.43-1.71,.47-.72,.92-1.54,1.34-2.46,.43-.92,.83-1.89,1.2-2.92,.37-1.03,.71-2.05,1-3.08,.29-1.03,.53-2.01,.71-2.93,.17-.93,.28-1.75,.33-2.48,.04-.57,.07-1.19,.07-1.87,0-1.25-.1-2.53-.29-3.85-.2-1.32-.57-2.44-1.12-3.36-.55-.92-1.33-1.38-2.36-1.38Z"
                    />
                    <path
                      className="cls-3"
                      d="M167.83,90.54c-2.21-8.9-5.21-19.28-9.02-31.16-.04-.07-.12-.14-.21-.21-.1-.08-.15-.14-.15-.18,.04-.02,.09-.03,.13-.03h6.13c.07,0,.1,.03,.1,.1,0,.11-.04,.23-.13,.36-.04,.09-.08,.2-.1,.33-.02,.13-.03,.29-.03,.46,0,1.42,.62,3.91,1.87,7.46,1.25,3.55,2.64,7.21,4.2,10.97,.04,.13,.12,.26,.23,.39,.11,.13,.24,.2,.39,.2,.2,0,.45-.2,.75-.61,.31-.4,.67-1.15,1.08-2.25,1.31-3.61,2.45-6.94,3.41-10,.96-3.06,1.44-5.16,1.44-6.3,0-.35-.05-.58-.16-.69-.26-.15-.39-.27-.39-.36,0-.04,.05-.07,.16-.07h4.75c.09,0,.12,.03,.1,.1,0,.11-.03,.23-.1,.36-3.21,7.63-5.65,13.89-7.3,18.77s-2.95,8.86-3.89,11.92c-.35,1.16-.77,2.37-1.25,3.64-.48,1.27-1.03,2.51-1.66,3.72-.62,1.21-1.35,2.31-2.18,3.3-.83,.98-1.78,1.77-2.84,2.36-1.06,.59-2.26,.89-3.59,.89-1.62,0-2.95-.26-3.98-.77s-1.8-1.16-2.3-1.95-.74-1.58-.74-2.39c0-.88,.28-1.68,.84-2.43,.56-.74,1.44-1.12,2.64-1.12,.81,0,1.42,.27,1.82,.82,.4,.55,.72,1.17,.95,1.89,.23,.71,.47,1.34,.72,1.88,.25,.55,.62,.82,1.1,.82,1.07,0,2.05-.55,2.94-1.64,.89-1.09,1.68-2.42,2.39-3.98,.71-1.56,1.33-3.1,1.85-4.61Z"
                    />
                  </g>
                  <g>
                    <path
                      className="cls-1"
                      d="M57.62,92.97h5.61c4.26,0,7.73,.36,10.41,1.07,2.68,.72,4.65,1.86,5.91,3.44,1.26,1.58,1.89,3.67,1.89,6.28,0,2.38-.44,4.36-1.32,5.94-.88,1.58-2.13,2.83-3.75,3.74-1.62,.91-3.55,1.58-5.78,1.99-2.23,.41-4.7,.65-7.4,.7,.22,2.55,.49,4.79,.81,6.7s.69,3.27,1.11,4.06c.06,.07,.11,.14,.17,.22,.05,.08,.08,.14,.08,.19s-.06,.08-.18,.08h-9.9s-.06-.02-.06-.05c0-.07,.06-.17,.18-.31,1.02-1.86,1.88-5.49,2.57-10.87,.69-5.38,1.03-10.33,1.03-14.83,0-2.05-.09-3.8-.27-5.24-.18-1.44-.48-2.36-.9-2.76-.22-.12-.33-.22-.33-.31,0-.03,.04-.05,.12-.05Zm5.31,1.58c-.2,1.73-.3,4.17-.3,7.33,0,3.76,.14,7.9,.42,12.42,1.94-.05,3.63-.22,5.07-.52,1.44-.29,2.67-.71,3.68-1.26,1.01-.54,1.83-1.22,2.45-2.03,.62-.81,1.07-1.77,1.34-2.87s.4-2.36,.4-3.75c0-1.86-.45-3.49-1.35-4.87-.9-1.38-2.32-2.46-4.25-3.24-1.93-.78-4.42-1.18-7.46-1.22Z"
                    />
                    <path
                      className="cls-1"
                      d="M91.11,127.4h-9.9s-.06-.02-.06-.05c0-.07,.06-.17,.18-.31,1.02-1.86,1.88-5.49,2.57-10.87,.69-5.38,1.03-10.33,1.03-14.83,0-2.05-.09-3.8-.27-5.24-.18-1.44-.48-2.36-.9-2.76-.2-.12-.3-.22-.3-.31,0-.03,.04-.05,.12-.05h5.58c.08,0,.12,.04,.12,.1,0,.09-.04,.18-.12,.28-.2,.38-.35,1.35-.45,2.9-.1,1.55-.15,3.43-.15,5.64,0,4.49,.21,9.34,.63,14.55,.42,5.21,1.04,8.7,1.86,10.46,.06,.07,.11,.14,.17,.22,.05,.08,.08,.14,.08,.19s-.06,.08-.18,.08Z"
                    />
                    <path
                      className="cls-1"
                      d="M108.22,106.38c-.2-.81-.78-1.48-1.74-1.99-.96-.52-1.91-.78-2.85-.78-.88,0-1.63,.22-2.25,.65-.62,.43-1.14,1.01-1.55,1.75s-.73,1.57-.98,2.5c-.3,.95-.77,1.61-1.41,1.99-.64,.38-1.25,.57-1.83,.57-.54,0-1.03-.19-1.47-.58-.44-.39-.66-.93-.66-1.62,0-.59,.23-1.27,.69-2.04,.42-.69,1.07-1.34,1.95-1.94,.88-.6,1.98-1.1,3.29-1.49s2.8-.58,4.46-.58c1.54,0,2.83,.11,3.86,.32,1.03,.22,1.86,.57,2.49,1.07,.63,.5,1.08,1.19,1.35,2.06,.27,.87,.4,1.97,.4,3.3,0,3.02,.21,6.27,.65,9.75,.43,3.48,1.06,6.01,1.88,7.6,.04,.07,.08,.14,.13,.22,.05,.08,.08,.14,.08,.19s-.05,.08-.15,.08h-9.9c-.06,0-.08-.02-.06-.05,0-.07,.06-.17,.18-.31,.8-1.33,1.5-3.33,2.1-5.99,.6-2.67,1.03-5.42,1.29-8.27-.38,1.76-.85,3.5-1.41,5.22-.56,1.72-1.23,3.28-2.01,4.7-.78,1.42-1.69,2.55-2.72,3.42-1.03,.86-2.21,1.29-3.53,1.29-1.44,0-2.65-.32-3.63-.97-.98-.65-1.72-1.5-2.22-2.56-.5-1.06-.75-2.21-.75-3.46,0-1.48,.36-2.71,1.08-3.68,.72-.97,1.67-1.81,2.85-2.54,1.18-.72,2.49-1.44,3.92-2.13,1.43-.7,2.88-1.49,4.35-2.38,1.47-.89,2.85-1.99,4.13-3.3Zm.09,1.09c-.9,1.19-2.05,2.28-3.45,3.27-1.4,.99-3.08,2.05-5.04,3.17-.96,.57-1.73,1.22-2.3,1.94-.57,.72-.98,1.45-1.22,2.19-.24,.73-.36,1.39-.36,1.98,0,1.19,.31,2.18,.93,2.96,.62,.79,1.46,1.18,2.52,1.18,.96,0,1.86-.42,2.69-1.25s1.59-1.92,2.28-3.24c.69-1.32,1.31-2.73,1.85-4.25,.54-1.51,.99-2.97,1.34-4.37,.35-1.41,.61-2.6,.77-3.58Z"
                    />
                    <path
                      className="cls-1"
                      d="M122.71,119.06c.06-2.67,.22-4.96,.48-6.85,.26-1.89,.59-3.46,1.01-4.7,.41-1.24,.87-2.23,1.37-2.96,.5-.73,1.03-1.28,1.58-1.63,.55-.35,1.09-.58,1.62-.69,.53-.1,1.02-.16,1.46-.16,1.34,0,2.39,.27,3.14,.8,.75,.53,1.28,1.18,1.59,1.94,.31,.76,.46,1.48,.46,2.15l-.03,.23c-.02,.6-.03,1.24-.03,1.92,0,3.04,.21,6.35,.63,9.94,.42,3.59,1.05,6.2,1.89,7.84,.14,.17,.21,.3,.21,.39,0,.07-.05,.1-.15,.1h-9.9s-.06-.02-.06-.05c0-.07,.06-.17,.18-.31,1-1.74,1.85-4.46,2.55-8.14,.7-3.68,1.05-7.05,1.05-10.11,0-.59-.02-1.14-.06-1.66-.06-.93-.22-1.65-.48-2.16-.26-.51-.56-.86-.9-1.06-.34-.2-.66-.3-.96-.3-.76,0-1.57,.6-2.43,1.8-.86,1.2-1.6,2.94-2.21,5.23-.61,2.29-.92,5.07-.92,8.35,0,.76,.02,1.54,.06,2.34s.11,1.64,.2,2.5c.09,.86,.19,1.74,.31,2.64,.08,.16,.16,.3,.24,.44,.06,.07,.11,.14,.17,.22,.05,.08,.08,.14,.08,.19s-.06,.08-.18,.08h-9.9s-.06-.02-.06-.05c0-.07,.06-.17,.18-.31,.66-1.09,1.26-2.67,1.8-4.74,.54-2.07,.98-4.32,1.31-6.75,.33-2.43,.5-4.66,.5-6.68,0-1.4-.09-2.61-.27-3.62-.18-1.02-.48-1.72-.9-2.1-.22-.12-.33-.22-.33-.28,0-.03,.04-.05,.12-.05h5.61c.08,0,.12,.04,.12,.1s-.04,.15-.12,.26c-.2,.36-.35,1.07-.45,2.13-.1,1.06-.15,2.33-.15,3.79,0,3,.2,6.32,.6,9.97Z"
                    />
                    <path
                      className="cls-1"
                      d="M137.03,102.16c2.32-.48,3.78-1.42,4.38-2.81,.6-1.39,.88-3.24,.84-5.55,0-.17-.06-.33-.17-.47s-.16-.24-.16-.31c0-.03,.04-.05,.12-.05h3.54c.08,0,.11,.04,.09,.1,0,.09-.03,.18-.09,.28-.2,.4-.36,1.42-.47,3.05s-.17,3.61-.17,5.93c2.04,0,4.04-.05,6-.16,.34-.05,.63-.08,.87-.08,.18,0,.28,.06,.3,.18v1.55c0,.24-.15,.34-.45,.28-.18,0-.4,0-.66-.03-1.68-.1-3.69-.17-6.03-.21,.04,3.67,.2,7.43,.48,11.26,.12,1.8,.33,3.41,.62,4.85,.29,1.44,.78,2.73,1.47,3.87,.69,1.14,1.69,2.15,2.99,3.03,.14,.12,.21,.24,.21,.36,0,.07-.06,.11-.18,.13-.96,.19-1.8,.28-2.52,.28-.76,0-1.59-.11-2.49-.32-.9-.22-1.75-.63-2.54-1.24-.79-.61-1.45-1.5-1.97-2.65-.52-1.16-.78-2.68-.78-4.58,0-.59,.03-1.22,.09-1.89,.44-4.49,.75-8.85,.93-13.1-1.06,.05-2.15,.11-3.27,.18-.38,.07-.69,.1-.93,.1-.06,0-.11,0-.15-.03s-.06-.04-.06-.08l.06-1.79c0-.09,.03-.13,.09-.13Z"
                    />
                  </g>
                </g>
              </g>
            </svg>
          </div>

          {/* INVOICE title */}
          <div style={{ flex: 1, textAlign: "center" }}>
            <p
              style={{
                fontSize: "24px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textDecoration: "underline",
                color: "#111111",
              }}
            >
              INVOICE
            </p>
          </div>

          {/* Invoice meta */}
          <div
            style={{
              minWidth: "170px",
              fontSize: "10.5px",
              lineHeight: "1.75",
              color: "#222222",
            }}
          >
            {[
              { label: "Invoice Number", value: formatInvoiceNumber(order) },
              { label: "Order Number", value: order.orderNumber },
              {
                label: "Invoice Date",
                value: formatInvoiceDate(order.updatedAt || order.createdAt),
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "16px",
                }}
              >
                <span style={{ fontWeight: 600 }}>{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── COMPANY DETAILS ── */}
        <div style={{ textAlign: "center", marginBottom: "14px" }}>
          <h1
            style={{
              fontSize: "19px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: "#111111",
            }}
          >
            {COMPANY.name}
          </h1>
          <p
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#222222",
              marginTop: "2px",
            }}
          >
            GSTIN - {COMPANY.gstin}
          </p>
          <div
            style={{
              fontSize: "9.5px",
              lineHeight: "1.7",
              color: "#444444",
              marginTop: "4px",
            }}
          >
            {COMPANY.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p>Email : {COMPANY.email}</p>
            <p>
              Phone - <strong>{COMPANY.phone}</strong>
            </p>
          </div>
        </div>

        {/* ── HR DIVIDER ── */}
        <hr
          style={{
            border: "none",
            borderTop: "1.5px solid #222222",
            marginBottom: "14px",
          }}
        />

        {/* ── BILL TO / SHIP TO ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "14px",
            marginBottom: "14px",
          }}
        >
          {[
            { title: "Bill to :", lines: billingLines },
            { title: "Ship to :", lines: shippingLines },
          ].map(({ title, lines }) => (
            <div key={title} style={{ borderRadius: "4px", padding: "10px" }}>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#222222",
                  marginBottom: "3px",
                  textAlign: "left",
                }}
              >
                {title}
              </p>
              <div
                style={{
                  fontSize: "10px",
                  lineHeight: "1.6",
                  color: "#333333",
                  textAlign: "left",
                }}
              >
                {lines.map((line, i) => (
                  <p key={i} style={{ textAlign: "left" }}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── ITEMS TABLE ── */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #cccccc",
            marginBottom: 0,
          }}
        >
          <thead>
            <tr>
              {TABLE_HEADERS.map((label, i) => (
                <th
                  key={label}
                  style={{
                    width: COL_WIDTHS[i],
                    background: "#005a0d",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: "11px",
                    padding: "7px 6px",
                    textAlign: "center",
                    border: "1px solid #444444",
                  }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoiceItems.map((item, index) => (
              <tr
                key={item.key}
                style={{ background: index % 2 === 0 ? "#ffffff" : "#fafafa" }}
              >
                <Td center>{String(index + 1).padStart(2, "0")}</Td>
                <Td center>{item.itemName}</Td>
                <Td center>{item.description}</Td>
                <Td center>{item.hsn}</Td>
                <Td center>{item.quantity}</Td>
                <Td center>{formatAmount(item.mrp)}</Td>
                <Td center>{formatDiscountPercent(item.discountPercent)}</Td>
                <Td center>{formatAmount(item.rate)}</Td>
                <Td center>{item.taxLabel}</Td>
                <Td center>{formatAmount(item.amount)}</Td>
              </tr>
            ))}

            {/* Empty filler rows */}
            {Array.from({ length: emptyRowCount }).map((_, i) => (
              <tr key={`empty-${i}`} style={{ height: "28px" }}>
                {Array.from({ length: 10 }).map((__, c) => (
                  <td
                    key={c}
                    style={{ border: "1px solid #d1d1d1", fontSize: "10.5px" }}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── BOTTOM SUMMARY TABLE ── */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #cccccc",
            borderTop: "none",
          }}
        >
          <tbody>
            {/* Row 1–3: Policies (rowspan 3) + Sub total / Delivery / Discount */}
            <tr>
              <td
                rowSpan={3}
                style={{
                  width: "60%",
                  border: "1px solid #d1d1d1",
                  verticalAlign: "top",
                  padding: "10px",
                }}
              >
                <div
                  style={{
                    fontSize: "9.5px",
                    color: "#444444",
                    lineHeight: "1.7",
                    textAlign: "left",
                  }}
                >
                  <p>• Live plants may vary in size/appearance</p>
                  <p>• No return after dispatch</p>
                  <p>• Replacement within 24 hrs with proof</p>
                  <p>• Delivery delays possible</p>
                  <p>
                    • For details, see Terms &amp; Conditions of shadyplant.com
                  </p>
                </div>
              </td>
              <SummaryLabelTd>Sub total</SummaryLabelTd>
              <SummaryValueTd>{formatAmount(itemsSubtotal)}</SummaryValueTd>
            </tr>
            <tr>
              <SummaryLabelTd>Delivery Charge</SummaryLabelTd>
              <SummaryValueTd>{formatAmount(deliveryCharge)}</SummaryValueTd>
            </tr>
            <tr>
              <SummaryLabelTd>Discount</SummaryLabelTd>
              <SummaryValueTd>{formatAmount(totalDiscount)}</SummaryValueTd>
            </tr>

            {/* Row 4: Net total in words | Net total dark */}
            <tr>
              <td
                style={{
                  border: "1px solid #d1d1d1",
                  padding: "8px 10px",
                  fontSize: "10.5px",
                  fontWeight: 600,
                  color: "#111111",
                  textAlign: "left",
                }}
              >
                Net Total (in words) : {numberToIndianWords(total)}
              </td>
              <td
                style={{
                  background: "#005a0d",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "11px",
                  padding: "8px 12px",
                  textAlign: "center",
                  border: "1px solid #333",
                }}
              >
                Net total
              </td>
              <td
                style={{
                  background: "#222222",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "12px",
                  padding: "8px 10px",
                  textAlign: "center",
                  border: "1px solid #333",
                }}
              >
                {formatCurrency(total)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── THANK YOU ── */}
        <div
          style={{
            textAlign: "left",
            marginTop: "20px",
            marginBottom: "14px",
          }}
        >
          <p style={{ fontSize: "13px", color: "#222222" }}>
            &quot;Thank you for purchasing from{" "}
            <strong>grassgreennursery.com</strong>&quot;
          </p>
        </div>

        {/* ── FOOTER — always pinned to bottom ── */}
        <div
          style={{
            position: "absolute",
            bottom: "10mm",
            left: "14mm",
            right: "14mm",
            borderTop: "1px solid #e0e0e0",
            paddingTop: "5px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "9px", color: "#888888" }}>
            Generated on {formatDateTime(order.updatedAt || order.createdAt)}
          </span>
          <span style={{ fontSize: "9px", color: "#888888" }}>Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
}

// ─── Small helper sub-components ─────────────────────────────────────────────

function Td({
  children,
  center,
  left,
}: {
  children: React.ReactNode;
  center?: boolean;
  left?: boolean;
}) {
  return (
    <td
      style={{
        border: "1px solid #d1d1d1",
        fontSize: "10.5px",
        padding: "8px 6px",
        textAlign: left ? "left" : center ? "center" : "center",
        verticalAlign: "middle",
      }}
    >
      {children}
    </td>
  );
}

function SummaryLabelTd({ children }: { children: React.ReactNode }) {
  return (
    <td
      style={{
        border: "1px solid #d1d1d1",
        background: "#f5f5f5",
        fontWeight: 600,
        fontSize: "11px",
        padding: "6px 12px",
        textAlign: "center",
      }}
    >
      {children}
    </td>
  );
}

function SummaryValueTd({ children }: { children: React.ReactNode }) {
  return (
    <td
      style={{
        border: "1px solid #d1d1d1",
        fontSize: "11px",
        padding: "6px 10px",
        textAlign: "center",
      }}
    >
      {children}
    </td>
  );
}
