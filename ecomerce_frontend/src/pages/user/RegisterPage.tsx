import { zodResolver } from "@hookform/resolvers/zod";
import { message } from "antd";
import {
    Calendar,
    Eye,
    EyeOff,
    Lock,
    Mail,
    ShoppingBag,
    User,
    UserRound,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import * as z from "zod";
import { api } from "../../lib/axios";

const schema = z.object({
    username: z.string().min(3, "Tên đăng nhập tối thiểu 3 ký tự"),
    fullName: z.string().min(2, "Vui lòng nhập họ tên"),
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
    dateOfBirth: z.string().min(1, "Vui lòng chọn ngày sinh"),
    gender: z.enum(["MALE", "FEMALE"]),
});

type RegisterForm = z.infer<typeof schema>;

const inputClass =
    "w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export default function RegisterPage() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterForm>({
        resolver: zodResolver(schema),
        defaultValues: { gender: "MALE" },
    });

    const onSubmit = async (data: RegisterForm) => {
        try {
            await api.post("/auth/register", data);
            message.success("Đăng ký thành công. Hãy đăng nhập.");
            navigate("/login");
        } catch {
            message.error(
                "Không thể đăng ký. Email hoặc tên đăng nhập có thể đã tồn tại.",
            );
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
                        Tạo tài khoản mới
                    </p>
                    <h1 className="mt-4 max-w-md text-4xl font-black leading-tight">
                        Tham gia cùng chúng tôi ngay hôm nay.
                    </h1>
                    <p className="mt-5 max-w-md leading-7 text-indigo-100">
                        Đăng ký để trải nghiệm mua sắm dễ dàng và bảo mật với
                        ShopNova.
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
                    <h2 className="mt-6 text-3xl font-black">Đăng ký</h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Điền thông tin để tạo tài khoản mới.
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
                                {...register("username")}
                                placeholder="Nhập tên đăng nhập"
                                className={inputClass}
                            />
                        </FormField>
                        <FormField
                            label="Họ và tên"
                            error={errors.fullName?.message}
                            icon={<User size={18} />}
                        >
                            <input
                                {...register("fullName")}
                                placeholder="Nhập họ và tên"
                                className={inputClass}
                            />
                        </FormField>
                        <FormField
                            label="Email"
                            error={errors.email?.message}
                            icon={<Mail size={18} />}
                        >
                            <input
                                type="email"
                                {...register("email")}
                                placeholder="Nhập email"
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
                        <FormField
                            label="Ngày sinh"
                            error={errors.dateOfBirth?.message}
                            icon={<Calendar size={18} />}
                        >
                            <input
                                type="date"
                                {...register("dateOfBirth")}
                                className={inputClass}
                            />
                        </FormField>
                        <FormField
                            label="Giới tính"
                            error={undefined}
                            icon={<User size={18} />}
                        >
                            <select
                                {...register("gender")}
                                className={`${inputClass} bg-white`}
                            >
                                <option value="MALE">Nam</option>
                                <option value="FEMALE">Nữ</option>
                            </select>
                        </FormField>
                        <button
                            disabled={isSubmitting}
                            className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-70"
                        >
                            {isSubmitting ? "Đang tạo tài khoản..." : "Đăng ký"}
                        </button>
                    </form>
                    <p className="mt-7 text-center text-sm text-slate-600">
                        Đã có tài khoản?{" "}
                        <Link
                            to="/login"
                            className="font-bold text-indigo-600 hover:underline"
                        >
                            Đăng nhập ngay
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
