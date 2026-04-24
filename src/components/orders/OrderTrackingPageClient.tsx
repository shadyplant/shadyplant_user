"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  MapPin,
  RefreshCw,
  Truck,
} from "lucide-react";
import SiteShell from "@/components/SiteShell";
import {
  customerOrders,
  getProductById,
  type CustomerOrder,
} from "@/content/store";
import { formatCurrency } from "@/lib/formatCurrency";

type FilterKey = "All" | "Active" | "Delivered";

const filterOptions: FilterKey[] = ["All", "Active", "Delivered"];

function isActiveOrder(status: CustomerOrder["status"]) {
  return status !== "Delivered";
}

function statusColor(status: CustomerOrder["status"]) {
  switch (status) {
    case "Delivered":
      return "text-green-700";
    case "Out for Delivery":
      return "text-blue-700";
    case "Packed":
      return "text-amber-700";
    default:
      return "text-gray-600";
  }
}

export default function OrderTrackingPageClient() {
  const [filter, setFilter] = useState<FilterKey>("All");

  const orders = useMemo(() => {
    return customerOrders.filter((order) => {
      if (filter === "Delivered") return order.status === "Delivered";
      if (filter === "Active") return isActiveOrder(order.status);
      return true;
    });
  }, [filter]);

  return (
    <SiteShell>
      <section className="px-4 py-8 md:px-8 md:py-12  min-h-screen">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Your Orders</h1>
          </div>

          {/* Clean Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {filterOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    filter === option
                      ? "border-black text-black"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {option} Orders
                </button>
              ))}
            </nav>
          </div>

          {/* Order List */}
          <div className="space-y-6">
            {orders.map((order) => {
              const orderItems = order.items.flatMap((item) => {
                const product = getProductById(item.productId);
                if (!product) return [];
                return [{ ...item, product }];
              });

              const reorderHref = orderItems[0]
                ? `/products/${orderItems[0].product.id}`
                : "/";

              return (
                <article
                  key={order.id}
                  className="rounded-lg border border-gray-200 bg-white  overflow-hidden"
                >
                  {/* Order Card Header (Amazon/Shopify style) */}
                  <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm">
                    <div className="flex flex-wrap md:flex-nowrap gap-6 md:gap-12">
                      <div>
                        <p className="text-gray-500 font-medium uppercase text-xs mb-1">
                          Order Placed
                        </p>
                        <p className="text-gray-900">{order.placedAt}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium uppercase text-xs mb-1">
                          Total
                        </p>
                        <p className="text-gray-900">
                          {formatCurrency(order.total)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium uppercase text-xs mb-1">
                          Ship To
                        </p>
                        <p className="text-blue-600 hover:underline cursor-pointer line-clamp-1 max-w-[200px]">
                          {order.address.split(",")[0]}
                        </p>
                      </div>
                    </div>
                    <div className="md:text-right">
                      <p className="text-gray-500 font-medium uppercase text-xs mb-1">
                        Order # {order.orderNumber}
                      </p>
                      <Link
                        href={`#`}
                        className="text-blue-600 hover:underline"
                      >
                        View order details
                      </Link>
                    </div>
                  </div>

                  {/* Order Card Body */}
                  <div className="p-6">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-gray-900">
                        {order.etaLabel}
                      </h2>
                      <p
                        className={`text-sm font-medium mt-1 ${statusColor(order.status)}`}
                      >
                        {order.status}
                      </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                      {/* Items List */}
                      <div className="flex-1 space-y-6">
                        {orderItems.map((item) => (
                          <div
                            key={`${order.id}-${item.product.id}`}
                            className="flex gap-4"
                          >
                            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                              <Image
                                src={item.product.image}
                                alt={item.product.name}
                                fill
                                sizes="80px"
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <Link
                                href={`/products/${item.product.id}`}
                                className="text-base font-medium text-blue-600 hover:underline line-clamp-2"
                              >
                                {item.product.name}
                              </Link>
                              <p className="text-sm text-gray-500 mt-1">
                                Qty: {item.quantity}
                              </p>
                              <div className="mt-3 flex gap-3">
                                <Link
                                  href={reorderHref}
                                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50 transition-colors"
                                >
                                  <RefreshCw size={14} />
                                  Buy it again
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Tracking / Address Sidebar */}
                      <div className="w-full lg:w-72 space-y-6 lg:border-l lg:border-gray-200 lg:pl-8">
                        {/* Action Buttons */}
                        <div className="space-y-3">
                          <button className="w-full bg-black text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors">
                            Track Package
                          </button>
                          <Link
                            href="/get-quote"
                            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                          >
                            <HelpCircle size={16} />
                            Get Support
                          </Link>
                        </div>

                        {/* Condensed Timeline */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <Truck size={16} className="text-gray-500" />
                            Tracking History
                          </h3>
                          <div className="space-y-4">
                            {order.timeline.map((step, index) => (
                              <div
                                key={`${order.id}-${step.label}`}
                                className="flex gap-3 relative"
                              >
                                {/* Vertical line connector */}
                                {index !== order.timeline.length - 1 && (
                                  <div className="absolute top-6 bottom-[-16px] left-[11px] w-[2px] bg-gray-200" />
                                )}
                                <div className="relative z-10 flex-shrink-0 mt-0.5">
                                  {step.completed ? (
                                    <CheckCircle2
                                      size={24}
                                      className="text-green-600 bg-white"
                                    />
                                  ) : (
                                    <Clock
                                      size={24}
                                      className="text-gray-300 bg-white"
                                    />
                                  )}
                                </div>
                                <div className="pb-2">
                                  <p
                                    className={`text-sm font-medium ${step.completed ? "text-gray-900" : "text-gray-500"}`}
                                  >
                                    {step.label}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {step.timestamp}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Address */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-2">
                            <MapPin size={16} className="text-gray-500" />
                            Delivery Address
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {order.address}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
