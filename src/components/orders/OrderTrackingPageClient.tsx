"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  MapPin,
  PackageSearch,
  Truck,
} from "lucide-react";
import SiteShell from "@/components/SiteShell";
import { type ApiResponse } from "@/lib/api";
import { formatCurrency } from "@/lib/formatCurrency";
import { useAuth } from "@/components/auth/AuthProvider";

type TrackingStep = {
  key: string;
  title: string;
  description: string;
  state: "complete" | "current" | "upcoming";
};

type Order = {
  id: string;
  orderNumber: string;
  trackingCode: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  deliveryAddress: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    landmark: string;
    notes: string;
  };
  deliveryDate: string;
  quantitySqft: number;
  distanceKm: number;
  vehicle: {
    name: string;
    rate: number;
    description: string;
  };
  paymentMethodLabel: string;
  paymentStatusLabel: string;
  currentStatus: string;
  trackingTimeline: TrackingStep[];
  pricing: {
    total: number;
    materialSubtotal: number;
    shippingSubtotal: number;
    recommendedSubtotal: number;
  };
  createdAt: string;
};

type FilterKey = "All" | "Active" | "Delivered";

const filterOptions: FilterKey[] = ["All", "Active", "Delivered"];

function isDelivered(order: Order) {
  return order.currentStatus === "delivered";
}

function formatDateTime(value: string) {
  if (!value) {
    return "Pending";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function formatAddress(order: Order) {
  return [
    order.deliveryAddress.line1,
    order.deliveryAddress.line2,
    order.deliveryAddress.city,
    order.deliveryAddress.state,
    order.deliveryAddress.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

export default function OrderTrackingPageClient() {
  const { fetchWithAuth, isAuthenticated, isReady } = useAuth();
  const [filter, setFilter] = useState<FilterKey>("All");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isAuthenticated) {
      return;
    }

    let isActive = true;

    fetchWithAuth<ApiResponse<{ orders: Order[] }>>("/orders")
      .then((response) => {
        if (!isActive) {
          return;
        }

        setOrders(response.data.orders);
      })
      .catch((nextError) => {
        if (!isActive) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : "Unable to load orders.");
      });

    return () => {
      isActive = false;
    };
  }, [fetchWithAuth, isAuthenticated, isReady]);

  const filteredOrders = useMemo(() => {
    return (orders || []).filter((order) => {
      if (filter === "Delivered") {
        return isDelivered(order);
      }

      if (filter === "Active") {
        return !isDelivered(order);
      }

      return true;
    });
  }, [filter, orders]);

  return (
    <SiteShell>
      <section className="min-h-screen px-4 py-8 md:px-8 md:py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Your Orders</h1>
            <p className="mt-2 text-sm text-gray-600">
              Live order history from your Grass Green Nursery account.
            </p>
          </div>

          {!isReady || (isAuthenticated && orders === null && !error) ? (
            <div className="rounded-[1.6rem] border border-[#dbe8cd] bg-white p-6 text-sm text-[#58724f]">
              Loading your orders...
            </div>
          ) : !isAuthenticated ? (
            <div className="rounded-[1.6rem] border border-[#dbe8cd] bg-white p-8 text-center shadow-[0_18px_45px_rgba(33,79,20,0.06)]">
              <PackageSearch size={28} className="mx-auto text-[#214f14]" />
              <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-[#163915]">
                Sign in to view your orders
              </h2>
              <p className="mt-3 text-sm text-[#58724f]">
                Your order timeline and delivery history are available after login.
              </p>
              <Link
                href="/auth?next=/order"
                className="mt-6 inline-flex rounded-full bg-[#214f14] px-5 py-3 text-sm font-semibold text-white"
              >
                Continue to sign in
              </Link>
            </div>
          ) : error ? (
            <div className="rounded-[1.6rem] border border-[#f2d2d2] bg-[#fff7f7] p-6 text-sm text-[#9c3131]">
              {error}
            </div>
          ) : (
            <>
              <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {filterOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setFilter(option)}
                      className={`whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium transition-colors ${
                        filter === option
                          ? "border-black text-black"
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      }`}
                    >
                      {option} Orders
                    </button>
                  ))}
                </nav>
              </div>

              {!filteredOrders.length ? (
                <div className="rounded-[1.6rem] border border-[#dbe8cd] bg-white p-8 text-center shadow-[0_18px_45px_rgba(33,79,20,0.06)]">
                  <PackageSearch size={28} className="mx-auto text-[#214f14]" />
                  <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-[#163915]">
                    No orders in this view
                  </h2>
                  <p className="mt-3 text-sm text-[#58724f]">
                    Place your first order from the delivery calculator or switch filters.
                  </p>
                  <Link
                    href="/checkout"
                    className="mt-6 inline-flex rounded-full bg-[#214f14] px-5 py-3 text-sm font-semibold text-white"
                  >
                    Start a new order
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredOrders.map((order) => {
                    const formattedAddress = formatAddress(order);

                    return (
                      <article
                        key={order.id}
                        className="overflow-hidden rounded-lg border border-gray-200 bg-white"
                      >
                        <div className="flex flex-col gap-4 border-b border-gray-200 bg-[#f6faef] px-6 py-4 text-sm md:flex-row md:items-center md:justify-between">
                          <div className="flex flex-wrap gap-6 md:gap-12">
                            <div>
                              <p className="mb-1 text-xs font-medium uppercase text-gray-500">
                                Order Placed
                              </p>
                              <p className="text-gray-900">{formatDateTime(order.createdAt)}</p>
                            </div>
                            <div>
                              <p className="mb-1 text-xs font-medium uppercase text-gray-500">
                                Total
                              </p>
                              <p className="text-gray-900">{formatCurrency(order.pricing.total)}</p>
                            </div>
                            <div>
                              <p className="mb-1 text-xs font-medium uppercase text-gray-500">
                                Ship To
                              </p>
                              <p className="max-w-[220px] text-gray-800">
                                {formattedAddress || "Address unavailable"}
                              </p>
                            </div>
                          </div>
                          <div className="md:text-right">
                            <p className="mb-1 text-xs font-medium uppercase text-gray-500">
                              Order # {order.orderNumber}
                            </p>
                            <p className="text-sm text-gray-700">
                              Tracking code: {order.trackingCode}
                            </p>
                          </div>
                        </div>

                        <div className="p-6">
                          <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                              Delivery target: {formatDateTime(order.deliveryDate)}
                            </h2>
                            <p className="mt-1 text-sm font-medium capitalize text-gray-700">
                              {order.currentStatus.replace(/_/g, " ")}
                            </p>
                          </div>

                          <div className="flex flex-col gap-8 lg:flex-row">
                            <div className="flex-1 space-y-4">
                              <div className="rounded-[1.4rem] border border-[#dbe8cd] bg-[#fbfdf8] p-4">
                                <p className="text-sm font-semibold text-[#163915]">
                                  Order summary
                                </p>
                                <div className="mt-4 grid gap-3 text-sm text-[#58724f] md:grid-cols-2">
                                  <p>Quantity: {order.quantitySqft} sqft</p>
                                  <p>Distance: {order.distanceKm} km</p>
                                  <p>Vehicle: {order.vehicle.name}</p>
                                  <p>Payment: {order.paymentStatusLabel}</p>
                                  <p>Method: {order.paymentMethodLabel}</p>
                                  <p>Shipping: {formatCurrency(order.pricing.shippingSubtotal)}</p>
                                </div>
                              </div>

                              <div className="rounded-[1.4rem] border border-[#dbe8cd] bg-[#fbfdf8] p-4">
                                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#163915]">
                                  <MapPin size={16} className="text-[#214f14]" />
                                  Delivery Address
                                </h3>
                                <p className="mt-3 text-sm leading-6 text-[#58724f]">
                                  {formattedAddress || "Address unavailable"}
                                </p>
                              </div>
                            </div>

                            <div className="w-full space-y-6 lg:w-72 lg:border-l lg:border-gray-200 lg:pl-8">
                              <div className="space-y-3">
                                <Link
                                  href="/checkout"
                                  className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                >
                                  <HelpCircle size={16} />
                                  Start another order
                                </Link>
                              </div>

                              <div>
                                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                                  <Truck size={16} className="text-gray-500" />
                                  Tracking History
                                </h3>
                                <div className="space-y-4">
                                  {order.trackingTimeline.map((step, index) => (
                                    <div
                                      key={`${order.id}-${step.key}`}
                                      className="relative flex gap-3"
                                    >
                                      {index !== order.trackingTimeline.length - 1 ? (
                                        <div className="absolute bottom-[-16px] left-[11px] top-6 w-[2px] bg-gray-200" />
                                      ) : null}
                                      <div className="relative z-10 mt-0.5 shrink-0">
                                        {step.state === "complete" ? (
                                          <CheckCircle2
                                            size={24}
                                            className="bg-white text-green-600"
                                          />
                                        ) : (
                                          <Clock
                                            size={24}
                                            className={
                                              step.state === "current"
                                                ? "bg-white text-amber-500"
                                                : "bg-white text-gray-300"
                                            }
                                          />
                                        )}
                                      </div>
                                      <div className="pb-2">
                                        <p
                                          className={`text-sm font-medium ${
                                            step.state === "upcoming"
                                              ? "text-gray-500"
                                              : "text-gray-900"
                                          }`}
                                        >
                                          {step.title}
                                        </p>
                                        <p className="text-xs text-gray-500">{step.description}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
