import OrderSuccess from "@/components/orders/OrderSuccess";

export default function TestPage() {
  return (
    <OrderSuccess
      orderNumber="INV-00234"
      orderDate="10/05/2026"
      deliveryDate="18/05/2026"
      total="1,52,560.00"
    />
  );
}
