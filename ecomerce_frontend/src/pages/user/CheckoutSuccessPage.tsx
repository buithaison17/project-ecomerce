import { CheckCircle2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import type { PaymentMethod } from "../../types/cart";

export default function CheckoutSuccessPage() { const location = useLocation(); const state = location.state as { paymentMethod?: PaymentMethod } | null; return <section className="mx-auto grid min-h-[60vh] max-w-7xl place-items-center px-4 text-center"><div className="max-w-md"><CheckCircle2 className="mx-auto text-emerald-500" size={64} /><h1 className="mt-5 text-3xl font-black">Đặt hàng thành công!</h1><p className="mt-3 leading-7 text-slate-600">{state?.paymentMethod === "CARD" ? "Giao dịch thanh toán mô phỏng đã thành công. " : "Đơn hàng đã được tiếp nhận. "}Chúng tôi sẽ sớm liên hệ để xác nhận thông tin giao hàng.</p><Link to="/products" className="mt-7 inline-block rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white">Tiếp tục mua sắm</Link></div></section>; }
