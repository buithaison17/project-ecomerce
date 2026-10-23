import { zodResolver } from "@hookform/resolvers/zod";
import { message } from "antd";
import { Eye, EyeOff, Lock, ShoppingBag, UserRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import * as z from "zod";
import { useAuthStore } from "../../store/authStore";

const loginSchema = z.object({
    username: z.string().min(1, "Vui lòng nhập tên đăng nhập"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type LoginForm = z.infer<typeof loginSchema>;
const inputClass =
    "w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export default function LoginPage() {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const [showPassword, setShowPassword] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        try {
            await login(data);
            message.success("Đăng nhập thành công");
            navigate("/");
        } catch {
            message.error("Tên đăng nhập hoặc mật khẩu không chính xác");
        }
    };

    return (
        <div className="grid min-h-screen bg-slate-100 lg:grid-cols-2">
            <aside className="hidden flex-col justify-between bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-700 p-12 text-white lg:flex">
                <Link
                    to="/"
                    className="flex items-center gap-3 text-2xl font-black"
                >
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
                        <ShoppingBag size={23} />
                    </span>
                    ShopNova
                </Link>
                <div>
                    <p className="text-sm font-bold uppercase tracking-[.2em] text-indigo-200">
                        Chào mừng trở lại
                    </p>
                    <h1 className="mt-4 max-w-md text-4xl font-black leading-tight">
                        Mua sắm dễ dàng, bảo mật mỗi ngày.
                    </h1>
                    <p className="mt-5 max-w-md leading-7 text-indigo-100">
                        Đăng nhập để theo dõi đơn hàng và lưu lại những sản phẩm
                        bạn yêu thích.
                    </p>
                </div>
                <p className="text-sm text-indigo-200">© 2026 ShopNova</p>
            </aside>
            <main className="flex items-center justify-center px-4 py-10">
                <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl sm:p-9">
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-xl font-black lg:hidden"
                    >
                        <ShoppingBag className="text-indigo-600" />
                        Shop<span className="text-indigo-600">Nova</span>
                    </Link>
                    <h2 className="mt-6 text-3xl font-black">Đăng nhập</h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Nhập thông tin tài khoản của bạn để tiếp tục.
                    </p>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="mt-7 space-y-5"
                    >
                        <FormField
                            label="Tên đăng nhập"
                            error={errors.username?.message}
                            icon={<UserRound size={18} />}
                        >
                            <input
                                autoComplete="username"
                                {...register("username")}
                                placeholder="Nhập tên đăng nhập"
                                className={inputClass}
                            />
                        </FormField>
                        <FormField
                            label="Mật khẩu"
                            error={errors.password?.message}
                            icon={<Lock size={18} />}
                        >
                            <input
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                {...register("password")}
                                placeholder="Nhập mật khẩu"
                                className={`${inputClass} pr-11`}
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setShowPassword((value) => !value)
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            >
                                {showPassword ? (
                                    <EyeOff size={19} />
                                ) : (
                                    <Eye size={19} />
                                )}
                            </button>
                        </FormField>
                        <button
                            disabled={isSubmitting}
                            className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-70"
                        >
                            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                        </button>
                    </form>
                    <p className="mt-7 text-center text-sm text-slate-600">
                        Chưa có tài khoản?{" "}
                        <Link
                            to="/register"
                            className="font-bold text-indigo-600 hover:underline"
                        >
                            Đăng ký ngay
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}

function FormField({
    label,
    error,
    icon,
    children,
}: {
    label: string;
    error?: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <label className="block text-sm font-semibold">
            {label}
            <span className="relative mt-1.5 block">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {icon}
                </span>
                {children}
            </span>
            {error && (
                <span className="mt-1 block text-xs font-normal text-rose-600">
                    {error}
                </span>
            )}
        </label>
    );
}
