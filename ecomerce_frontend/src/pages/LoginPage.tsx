import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    ShoppingBag,
    ArrowRight,
    ShieldCheck,
    Zap,
    RotateCcw,
    Sparkles,
    AlertCircle,
    Loader2,
    Star,
    CheckCircle2,
    LockKeyhole,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { message } from "antd";

// ============================================================================
// 1. Zod Schema Validation (Loại bỏ .default() để đồng bộ kiểu Type với useForm)
// ============================================================================
const loginSchema = z.object({
    email: z.string().min(1, { message: "Vui lòng nhập địa chỉ email" }).email({
        message: "Email không đúng định dạng (VD: name@example.com)",
    }),
    password: z
        .string()
        .min(1, { message: "Vui lòng nhập mật khẩu" })
        .min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
    rememberMe: z.boolean(),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ============================================================================
// 2. Component Chính
// ============================================================================
export default function LoginPage() {
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

    // Khởi tạo React Hook Form với Generic chuẩn xác
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
            rememberMe: false, // Cung cấp giá trị mặc định rõ ràng tại đây
        },
        mode: "onTouched",
    });
    // Auth Store
    const { login } = useAuthStore();

    // Xử lý gửi biểu mẫu
    const onSubmit = async (data: LoginFormData) => {
        const { email, password } = data;
        try {
            await login({ username: email, password });
            message.success("Đăng nhập thành công");
        } catch (error) {
            message.error("Tài khoản hoặc mật khẩu không chính xác");
            console.log(error);
        }
    };

    return (
        <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans antialiased text-slate-800">
            {/* Toast Notification khi đăng nhập thành công */}
            {submittedEmail && (
                <div className="fixed top-5 right-5 z-50 flex items-start gap-3 bg-white border border-emerald-200 shadow-2xl rounded-2xl p-4 max-w-sm transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 pr-2">
                        <h4 className="text-sm font-semibold text-slate-900">
                            Đăng nhập thành công!
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                            Chào mừng{" "}
                            <span className="font-medium text-slate-700">
                                {submittedEmail}
                            </span>{" "}
                            trở lại với ShopNova.
                        </p>
                    </div>
                    <button
                        onClick={() => setSubmittedEmail(null)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Khung chứa Split Screen 2 cột */}
            <div className="w-full max-w-6xl min-h-[720px] bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200/80">
                {/* ====================================================================
            CỘT TRÁI: BANNER THƯƠNG HIỆU & GIÁ TRỊ (Hiển thị trên màn hình lớn)
           ==================================================================== */}
                <div className="hidden lg:flex lg:col-span-5 relative bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white flex-col justify-between p-12 overflow-hidden">
                    {/* Hiệu ứng đốm sáng trang trí nền */}
                    <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-indigo-600/30 blur-[100px] pointer-events-none" />
                    <div className="absolute -bottom-28 -right-20 w-96 h-96 rounded-full bg-violet-600/25 blur-[120px] pointer-events-none" />
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

                    {/* Phần trên: Logo & Lời giới thiệu */}
                    <div className="relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 p-[1px] shadow-lg shadow-indigo-500/25">
                                <div className="w-full h-full bg-slate-950/80 backdrop-blur-md rounded-2xl flex items-center justify-center">
                                    <ShoppingBag className="w-5 h-5 text-indigo-400" />
                                </div>
                            </div>
                            <div>
                                <span className="text-2xl font-black tracking-tight text-white">
                                    Shop
                                    <span className="text-indigo-400">
                                        Nova
                                    </span>
                                </span>
                                <span className="block text-[10px] tracking-widest text-slate-400 font-semibold uppercase">
                                    Premium Commerce
                                </span>
                            </div>
                        </div>

                        <div className="mt-12 space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-indigo-200 backdrop-blur-md">
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>Siêu hội mua sắm • Giảm đến 50%</span>
                            </div>
                            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-snug">
                                Nâng tầm trải nghiệm mua sắm trực tuyến.
                            </h2>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Hơn 500.000+ sản phẩm chính hãng với bảo hành
                                toàn diện và dịch vụ vận chuyển hỏa tốc ngay
                                trong ngày.
                            </p>
                        </div>
                    </div>

                    {/* Phần giữa: Trust Badges (Cam kết thương hiệu) */}
                    <div className="relative z-10 my-8 space-y-3.5 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5">
                        <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-white tracking-wide">
                                    100% Hàng chính hãng
                                </h4>
                                <p className="text-[11px] text-slate-400">
                                    Cam kết đền bù 200% nếu phát hiện hàng giả
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center shrink-0">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-white tracking-wide">
                                    Giao hàng hỏa tốc 2 giờ
                                </h4>
                                <p className="text-[11px] text-slate-400">
                                    Đúng giờ, bồi hoàn phí nếu trễ hạn giao
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                                <RotateCcw className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-white tracking-wide">
                                    Đổi trả miễn phí 15 ngày
                                </h4>
                                <p className="text-[11px] text-slate-400">
                                    Thủ tục nhanh gọn tận nơi hoàn toàn miễn phí
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Phần dưới: Rating khách hàng & Bản quyền */}
                    <div className="relative z-10 pt-4 border-t border-white/10 space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                            <div className="flex items-center gap-1.5">
                                <div className="flex text-amber-400">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className="w-3.5 h-3.5 fill-current"
                                        />
                                    ))}
                                </div>
                                <span className="font-semibold text-white">
                                    4.9/5
                                </span>
                                <span>(120k+ đánh giá)</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px]">
                                <LockKeyhole className="w-3.5 h-3.5 text-indigo-400" />
                                <span>SSL 256-bit</span>
                            </div>
                        </div>
                        <div className="text-[11px] text-slate-500 flex justify-between">
                            <span>© 2026 ShopNova Inc.</span>
                            <div className="flex gap-3">
                                <a
                                    href="#terms"
                                    className="hover:text-slate-300 transition-colors"
                                >
                                    Điều khoản
                                </a>
                                <a
                                    href="#privacy"
                                    className="hover:text-slate-300 transition-colors"
                                >
                                    Bảo mật
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ====================================================================
            CỘT PHẢI: FORM ĐĂNG NHẬP
           ==================================================================== */}
                <div className="col-span-1 lg:col-span-7 p-6 sm:p-12 lg:p-16 flex flex-col justify-center">
                    {/* Header trên Mobile */}
                    <div className="lg:hidden flex items-center gap-2.5 mb-8">
                        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-slate-900">
                            Shop<span className="text-indigo-600">Nova</span>
                        </span>
                    </div>

                    {/* Tiêu đề & Lời chào */}
                    <div className="mb-8">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Chào mừng bạn trở lại! 👋
                        </h1>
                        <p className="text-sm text-slate-500 mt-2">
                            Vui lòng nhập thông tin xác thực để truy cập vào tài
                            khoản và đơn hàng của bạn.
                        </p>
                    </div>

                    {/* Biểu mẫu đăng nhập */}
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-5"
                        noValidate
                    >
                        {/* Input Email */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                            >
                                Địa chỉ Email{" "}
                                <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative rounded-xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="nguyenvana@gmail.com"
                                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-slate-900 placeholder-slate-400 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 transition-all duration-200 ${
                                        errors.email
                                            ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
                                            : "border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:ring-indigo-100"
                                    }`}
                                    {...register("email")}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1 animate-in fade-in">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{errors.email.message}</span>
                                </p>
                            )}
                        </div>

                        {/* Input Mật khẩu */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label
                                    htmlFor="password"
                                    className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                                >
                                    Mật khẩu{" "}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <a
                                    tabIndex={-1}
                                    href="#forgot-password"
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
                                >
                                    Quên mật khẩu?
                                </a>
                            </div>
                            <div className="relative rounded-xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="Tối thiểu 6 ký tự"
                                    className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm text-slate-900 placeholder-slate-400 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 transition-all duration-200 ${
                                        errors.password
                                            ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
                                            : "border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:ring-indigo-100"
                                    }`}
                                    {...register("password")}
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() =>
                                        setShowPassword((prev) => !prev)
                                    }
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                                    aria-label={
                                        showPassword
                                            ? "Ẩn mật khẩu"
                                            : "Hiện mật khẩu"
                                    }
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-slate-500" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-slate-400" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1 animate-in fade-in">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{errors.password.message}</span>
                                </p>
                            )}
                        </div>

                        {/* Checkbox Ghi nhớ đăng nhập */}
                        <div className="flex items-center justify-between pt-0.5">
                            <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                                <input
                                    type="checkbox"
                                    id="rememberMe"
                                    className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer accent-indigo-600 transition-colors"
                                    {...register("rememberMe")}
                                />
                                <span className="text-sm text-slate-600 group-hover:text-slate-900">
                                    Ghi nhớ đăng nhập trên thiết bị này
                                </span>
                            </label>
                        </div>

                        {/* Nút Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3.5 px-5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Đang xác thực tài khoản...</span>
                                </>
                            ) : (
                                <>
                                    <span>Đăng Nhập</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Dải phân cách */}
                    <div className="relative my-7">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-3 text-slate-400 font-medium tracking-wider">
                                Hoặc đăng nhập nhanh với
                            </span>
                        </div>
                    </div>

                    {/* Các nút Đăng nhập mạng xã hội */}
                    <div className="grid grid-cols-3 gap-3">
                        {/* Google */}
                        <button
                            type="button"
                            className="flex items-center justify-center gap-2 py-2.5 px-3 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-xs font-semibold text-slate-700 active:scale-[0.98] cursor-pointer"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path
                                    fill="#EA4335"
                                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                                />
                                <path
                                    fill="#4285F4"
                                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.8 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                                />
                            </svg>
                            <span className="hidden sm:inline">Google</span>
                        </button>

                        {/* Apple */}
                        <button
                            type="button"
                            className="flex items-center justify-center gap-2 py-2.5 px-3 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-xs font-semibold text-slate-700 active:scale-[0.98] cursor-pointer"
                        >
                            <svg
                                className="w-4 h-4 fill-current text-slate-900"
                                viewBox="0 0 24 24"
                            >
                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.93.04-2.02.63-2.66 1.38-.56.64-1.05 1.7-0.91 2.72 1.05.08 2.05-.48 2.65-1.23z" />
                            </svg>
                            <span className="hidden sm:inline">Apple</span>
                        </button>

                        {/* Facebook */}
                        <button
                            type="button"
                            className="flex items-center justify-center gap-2 py-2.5 px-3 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-xs font-semibold text-slate-700 active:scale-[0.98] cursor-pointer"
                        >
                            <svg
                                className="w-4 h-4 fill-[#1877F2]"
                                viewBox="0 0 24 24"
                            >
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            <span className="hidden sm:inline">Facebook</span>
                        </button>
                    </div>

                    {/* Điều hướng chuyển qua trang Đăng Ký */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-600">
                            Bạn chưa có tài khoản ShopNova?{" "}
                            <a
                                href="#register"
                                className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
                            >
                                Đăng ký ngay bây giờ
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
