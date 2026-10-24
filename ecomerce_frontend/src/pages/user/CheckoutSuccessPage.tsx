import { CheckCircle2, Package, ShoppingBag } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import type { PaymentMethod } from "../../types/cart";

export default function CheckoutSuccessPage() {
    const location = useLocation();
    const state = location.state as { paymentMethod?: PaymentMethod; orderId?: number } | null;

    return (
        <section className="mx-auto grid min-h-[65vh] max-w-7xl place-items-center px-4 py-12 text-center">
            <div className="max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-100 sm:p-10">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
                    <CheckCircle2 size={48} />
                </div>
                <h1 className="mt-6 text-2xl font-black text-slate-900 sm:text-3xl">Đặt hàng thành công!</h1>
                {state?.orderId && (
                    <div className="mt-2 inline-block rounded-lg bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-700">
                        Mã đơn hàng: #{state.orderId}
                    </div>
                )}
                <p className="mt-3 leading-6 text-slate-600">
                    {state?.paymentMethod === "CARD"
                        ? "Giao dịch thanh toán mô phỏng đã hoàn tất. "
                        : "Đơn hàng của bạn đã được gửi đến bộ phận xử lý. "}
                    Chúng tôi sẽ sớm liên hệ xác nhận và tiến hành giao hàng tới bạn.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Link
                        to="/orders"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 hover:shadow-indigo-300"
                    >
                        <Package size={18} />
                        <span>Xem đơn hàng</span>
                    </Link>
                    <Link
                        to="/products"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-100"
                    >
                        <ShoppingBag size={18} />
                        <span>Tiếp tục mua sắm</span>
                    </Link>
                </div>
            </div>
        </section>
    );
}
