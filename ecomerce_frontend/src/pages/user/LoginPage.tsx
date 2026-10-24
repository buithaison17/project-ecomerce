import { zodResolver } from "@hookform/resolvers/zod";
import { message } from "antd";
import axios from "axios";
import {
    ArrowLeft,
    Calendar,
    Eye,
    EyeOff,
    KeyRound,
    Lock,
    Mail,
    ShoppingBag,
    Sparkles,
    UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as z from "zod";
import { loginService } from "../../service/loginService";
import { useAuthStore } from "../../store/authStore";

// ------------------------------------------------ Schemas
const loginSchema = z.object({
    username: z.string().min(1, "Vui lòng nhập tên đăng nhập"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

const registerSchema = z.object({
    username: z.string().min(3, "Tên đăng nhập tối thiểu 3 ký tự"),
    fullName: z.string().min(2, "Vui lòng nhập họ tên"),
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
    dateOfBirth: z.string().min(1, "Vui lòng chọn ngày sinh"),
    gender: z.enum(["MALE", "FEMALE"]),
});

const forgotSchema = z
    .object({
        usernameOrEmail: z.string().min(1, "Vui lòng nhập email hoặc tên đăng nhập"),
        newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
        confirmPassword: z.string().min(6, "Vui lòng xác nhận mật khẩu mới"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Mật khẩu xác nhận không khớp",
        path: ["confirmPassword"],
    });

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type ForgotForm = z.infer<typeof forgotSchema>;

type AuthMode = "login" | "register" | "forgot";

const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100/70";

export default function LoginPage({ initialMode }: { initialMode?: AuthMode }) {
    const navigate = useNavigate();
    const location = useLocation();
    const login = useAuthStore((state) => state.login);

    // Determine initial mode from prop or pathname
    const defaultMode: AuthMode =
        initialMode || (location.pathname === "/register" ? "register" : "login");

    const [mode, setMode] = useState<AuthMode>(defaultMode);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [registeredUsername, setRegisteredUsername] = useState("");

    // Synchronize mode if prop or route changes
    useEffect(() => {
        if (initialMode) {
            setMode(initialMode);
        } else if (location.pathname === "/register") {
            setMode("register");
        }
    }, [initialMode, location.pathname]);

    // Handle seamless mode switch without full page redirect
    const switchMode = (newMode: AuthMode) => {
        setMode(newMode);
        if (newMode === "register") {
            window.history.replaceState(null, "", "/register");
        } else {
            window.history.replaceState(null, "", "/login");
        }
    };

    // ------------------------------------------------ Login Form
    const {
        register: registerLogin,
        handleSubmit: handleLoginSubmit,
        setValue: setLoginValue,
        formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    useEffect(() => {
        if (registeredUsername) {
            setLoginValue("username", registeredUsername);
        }
    }, [registeredUsername, setLoginValue]);

    const onLoginSubmit = async (data: LoginForm) => {
        try {
            await login(data);
            message.success("Đăng nhập thành công");
            const currentUser = useAuthStore.getState().user;
            const returnTo = (location.state as { returnTo?: string } | null)?.returnTo;
            navigate(currentUser?.role === "ADMIN" ? "/admin" : returnTo || "/");
        } catch {
            message.error("Tên đăng nhập hoặc mật khẩu không chính xác");
        }
    };

    // ------------------------------------------------ Register Form
    const {
        register: registerRegister,
        handleSubmit: handleRegisterSubmit,
        reset: resetRegisterForm,
        formState: { errors: registerErrors, isSubmitting: isRegisterSubmitting },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: { gender: "MALE" },
    });

    const onRegisterSubmit = async (data: RegisterForm) => {
        try {
            await loginService.register(data);
            message.success("Đăng ký thành công! Hãy đăng nhập để tiếp tục.");
            setRegisteredUsername(data.username);
            resetRegisterForm();
            switchMode("login");
        } catch (error) {
            const responseData = axios.isAxiosError(error) ? error.response?.data : undefined;
            const fieldErrors = responseData?.errors as Record<string, string> | undefined;
            const errorMessage = fieldErrors ? Object.values(fieldErrors)[0] : responseData?.message;
            message.error(errorMessage || "Không thể đăng ký. Email hoặc tên đăng nhập có thể đã tồn tại.");
        }
    };

    // ------------------------------------------------ Forgot Password Form
    const {
        register: registerForgot,
        handleSubmit: handleForgotSubmit,
        reset: resetForgotForm,
        formState: { errors: forgotErrors, isSubmitting: isForgotSubmitting },
    } = useForm<ForgotForm>({
        resolver: zodResolver(forgotSchema),
    });

    const onForgotSubmit = async (data: ForgotForm) => {
        try {
            await loginService.resetPassword({
                usernameOrEmail: data.usernameOrEmail,
                newPassword: data.newPassword,
            });
            message.success("Đặt lại mật khẩu thành công! Hãy đăng nhập với mật khẩu mới.");
            setRegisteredUsername(data.usernameOrEmail);
            resetForgotForm();
            switchMode("login");
        } catch (error) {
            const responseData = axios.isAxiosError(error) ? error.response?.data : undefined;
            message.error(
                responseData?.message ||
                    "Không thể đặt lại mật khẩu. Vui lòng kiểm tra lại email hoặc tên đăng nhập."
            );
        }
    };

    return (
        <div className="grid min-h-screen bg-slate-100 lg:grid-cols-2">
            {/* Left Hero Panel */}
            <aside className="hidden flex-col justify-between bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-700 p-12 text-white lg:flex">
                <Link to="/" className="flex items-center gap-3 text-2xl font-black">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 shadow-inner">
                        <ShoppingBag size={23} />
                    </span>
                    Shop<span className="text-indigo-300">Nova</span>
                </Link>
                <div className="max-w-md">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-indigo-200 backdrop-blur-md">
                        <Sparkles size={14} className="text-amber-300" />
                        <span>Trải nghiệm mua sắm thông minh</span>
                    </div>
                    <h1 className="mt-4 text-4xl font-black leading-tight text-white">
                        {mode === "register"
                            ? "Khởi đầu trải nghiệm mua sắm tuyệt vời."
                            : mode === "forgot"
                            ? "Bảo vệ & khôi phục tài khoản dễ dàng."
                            : "Mua sắm dễ dàng, bảo mật mỗi ngày."}
                    </h1>
                    <p className="mt-4 leading-7 text-indigo-100/90 text-sm">
                        {mode === "register"
                            ? "Tạo tài khoản để nhận ưu đãi thành viên, lưu địa chỉ giao hàng và theo dõi hành trình đơn hàng thuận tiện nhất."
                            : mode === "forgot"
                            ? "Đừng lo lắng nếu bạn quên mật khẩu. Chúng tôi hỗ trợ bạn lấy lại quyền truy cập tài khoản chỉ trong vài bước."
                            : "Đăng nhập để theo dõi đơn hàng, quản lý danh sách yêu thích và tận hưởng dịch vụ khách hàng 24/7."}
                    </p>
                </div>
                <div className="flex items-center justify-between text-xs text-indigo-200 border-t border-white/10 pt-6">
                    <p>© 2026 ShopNova E-Commerce</p>
                    <p>Bảo mật & Mã hóa đa tầng</p>
                </div>
            </aside>

            {/* Right Interactive Auth Form */}
            <main className="flex items-center justify-center px-4 py-10 sm:px-6">
                <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-xl shadow-slate-200/80 sm:p-9 border border-slate-100">
                    {/* Mobile Brand Link */}
                    <div className="flex items-center justify-between lg:hidden mb-4">
                        <Link to="/" className="flex items-center gap-2 text-xl font-black">
                            <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white">
                                <ShoppingBag size={18} />
                            </span>
                            Shop<span className="text-indigo-600">Nova</span>
                        </Link>
                        {mode === "forgot" && (
                            <button
                                type="button"
                                onClick={() => switchMode("login")}
                                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600"
                            >
                                <ArrowLeft size={14} /> Quay lại
                            </button>
                        )}
                    </div>

                    {/* Segmented Mode Switcher (Login / Register) */}
                    {mode !== "forgot" ? (
                        <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1.5">
                            <button
                                type="button"
                                onClick={() => switchMode("login")}
                                className={`rounded-xl py-2.5 text-sm font-bold transition-all ${
                                    mode === "login"
                                        ? "bg-white text-indigo-700 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Đăng nhập
                            </button>
                            <button
                                type="button"
                                onClick={() => switchMode("register")}
                                className={`rounded-xl py-2.5 text-sm font-bold transition-all ${
                                    mode === "register"
                                        ? "bg-white text-indigo-700 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Đăng ký
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => switchMode("login")}
                            className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition"
                        >
                            <ArrowLeft size={15} />
                            <span>Quay lại Đăng nhập</span>
                        </button>
                    )}

                    {/* ======================= MODE 1: LOGIN ======================= */}
                    {mode === "login" && (
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">Đăng nhập</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Nhập thông tin tài khoản của bạn để tiếp tục.
                            </p>

                            <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="mt-6 space-y-4">
                                <FormField
                                    label="Tên đăng nhập"
                                    error={loginErrors.username?.message}
                                    icon={<UserRound size={17} />}
                                >
                                    <input
                                        autoComplete="username"
                                        {...registerLogin("username")}
                                        placeholder="Nhập tên đăng nhập"
                                        className={inputClass}
                                    />
                                </FormField>

                                <FormField
                                    label={
                                        <div className="flex items-center justify-between">
                                            <span>Mật khẩu</span>
                                            <button
                                                type="button"
                                                onClick={() => setMode("forgot")}
                                                className="text-xs font-bold text-indigo-600 hover:underline"
                                            >
                                                Quên mật khẩu?
                                            </button>
                                        </div>
                                    }
                                    error={loginErrors.password?.message}
                                    icon={<Lock size={17} />}
                                >
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        {...registerLogin("password")}
                                        placeholder="Nhập mật khẩu"
                                        className={`${inputClass} pr-11`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </FormField>

                                <button
                                    disabled={isLoginSubmitting}
                                    className="mt-2 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-70"
                                >
                                    {isLoginSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                                </button>
                            </form>

                            <p className="mt-6 text-center text-sm text-slate-600">
                                Chưa có tài khoản?{" "}
                                <button
                                    type="button"
                                    onClick={() => switchMode("register")}
                                    className="font-bold text-indigo-600 hover:underline"
                                >
                                    Đăng ký ngay
                                </button>
                            </p>
                        </div>
                    )}

                    {/* ======================= MODE 2: REGISTER ======================= */}
                    {mode === "register" && (
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">Tạo tài khoản</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Đăng ký nhanh để trải nghiệm mua sắm không giới hạn.
                            </p>

                            <form
                                onSubmit={handleRegisterSubmit(onRegisterSubmit)}
                                className="mt-5 space-y-3.5"
                            >
                                <FormField
                                    label="Tên đăng nhập"
                                    error={registerErrors.username?.message}
                                    icon={<UserRound size={17} />}
                                >
                                    <input
                                        autoComplete="username"
                                        {...registerRegister("username")}
                                        placeholder="Tối thiểu 3 ký tự"
                                        className={inputClass}
                                    />
                                </FormField>

                                <FormField
                                    label="Họ và tên"
                                    error={registerErrors.fullName?.message}
                                    icon={<UserRound size={17} />}
                                >
                                    <input
                                        {...registerRegister("fullName")}
                                        placeholder="Ví dụ: Nguyễn Văn A"
                                        className={inputClass}
                                    />
                                </FormField>

                                <FormField
                                    label="Email"
                                    error={registerErrors.email?.message}
                                    icon={<Mail size={17} />}
                                >
                                    <input
                                        type="email"
                                        autoComplete="email"
                                        {...registerRegister("email")}
                                        placeholder="email@example.com"
                                        className={inputClass}
                                    />
                                </FormField>

                                <FormField
                                    label="Mật khẩu"
                                    error={registerErrors.password?.message}
                                    icon={<Lock size={17} />}
                                >
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        {...registerRegister("password")}
                                        placeholder="Tối thiểu 6 ký tự"
                                        className={`${inputClass} pr-11`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </FormField>

                                <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                        label="Ngày sinh"
                                        error={registerErrors.dateOfBirth?.message}
                                        icon={<Calendar size={17} />}
                                    >
                                        <input
                                            type="date"
                                            {...registerRegister("dateOfBirth")}
                                            className={inputClass}
                                        />
                                    </FormField>

                                    <label className="block text-sm font-semibold text-slate-700">
                                        Giới tính
                                        <select
                                            {...registerRegister("gender")}
                                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100/70"
                                        >
                                            <option value="MALE">Nam</option>
                                            <option value="FEMALE">Nữ</option>
                                        </select>
                                    </label>
                                </div>

                                <button
                                    disabled={isRegisterSubmitting}
                                    className="mt-3 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-70"
                                >
                                    {isRegisterSubmitting ? "Đang tạo tài khoản..." : "Đăng ký tài khoản"}
                                </button>
                            </form>

                            <p className="mt-5 text-center text-sm text-slate-600">
                                Đã có tài khoản?{" "}
                                <button
                                    type="button"
                                    onClick={() => switchMode("login")}
                                    className="font-bold text-indigo-600 hover:underline"
                                >
                                    Đăng nhập
                                </button>
                            </p>
                        </div>
                    )}

                    {/* ======================= MODE 3: FORGOT PASSWORD ======================= */}
                    {mode === "forgot" && (
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                                    <KeyRound size={20} />
                                </span>
                                <h2 className="text-2xl font-black text-slate-900">Quên mật khẩu</h2>
                            </div>
                            <p className="mt-2 text-sm text-slate-500">
                                Nhập email hoặc tên đăng nhập của bạn cùng mật khẩu mới để khôi phục tài khoản.
                            </p>

                            <form onSubmit={handleForgotSubmit(onForgotSubmit)} className="mt-6 space-y-4">
                                <FormField
                                    label="Email hoặc Tên đăng nhập"
                                    error={forgotErrors.usernameOrEmail?.message}
                                    icon={<UserRound size={17} />}
                                >
                                    <input
                                        {...registerForgot("usernameOrEmail")}
                                        placeholder="Nhập tên đăng nhập hoặc email"
                                        className={inputClass}
                                    />
                                </FormField>

                                <FormField
                                    label="Mật khẩu mới"
                                    error={forgotErrors.newPassword?.message}
                                    icon={<Lock size={17} />}
                                >
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        {...registerForgot("newPassword")}
                                        placeholder="Tối thiểu 6 ký tự"
                                        className={`${inputClass} pr-11`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        tabIndex={-1}
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </FormField>

                                <FormField
                                    label="Xác nhận mật khẩu mới"
                                    error={forgotErrors.confirmPassword?.message}
                                    icon={<Lock size={17} />}
                                >
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        {...registerForgot("confirmPassword")}
                                        placeholder="Nhập lại mật khẩu mới"
                                        className={`${inputClass} pr-11`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </FormField>

                                <button
                                    disabled={isForgotSubmitting}
                                    className="mt-2 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-70"
                                >
                                    {isForgotSubmitting ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                                </button>
                            </form>

                            <p className="mt-6 text-center text-sm text-slate-600">
                                Nhớ lại mật khẩu?{" "}
                                <button
                                    type="button"
                                    onClick={() => switchMode("login")}
                                    className="font-bold text-indigo-600 hover:underline"
                                >
                                    Quay lại Đăng nhập
                                </button>
                            </p>
                        </div>
                    )}
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
    label: React.ReactNode;
    error?: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <label className="block text-sm font-semibold text-slate-700">
            {label}
            <span className="relative mt-1.5 block">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {icon}
                </span>
                {children}
            </span>
            {error && <span className="mt-1 block text-xs font-normal text-rose-600">{error}</span>}
        </label>
    );
}
