import { zodResolver } from "@hookform/resolvers/zod";
import { message } from "antd";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import * as z from "zod";
import { api } from "../../lib/axios.ts";

const schema = z.object({
    username: z.string().min(3, "Tên đăng nhập tối thiểu 3 ký tự"),
    fullName: z.string().min(2, "Vui lòng nhập họ tên"),
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
    dateOfBirth: z.string().min(1, "Vui lòng chọn ngày sinh"),
    gender: z.enum(["MALE", "FEMALE"]),
});

type RegisterForm = z.infer<typeof schema>;

const inputClass = "w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500";

export default function RegisterPage() {
    const navigate = useNavigate();
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
            message.error("Không thể đăng ký. Email hoặc tên đăng nhập có thể đã tồn tại.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 px-4 py-10">
            <div className="mx-auto max-w-md rounded-2xl bg-white p-7 shadow-xl sm:p-9">
                <Link to="/" className="text-xl font-black">
                    Shop<span className="text-indigo-600">Nova</span>
                </Link>
                <h1 className="mt-6 text-2xl font-black">Tạo tài khoản</h1>
                <p className="mt-2 text-sm text-slate-600">
                    Đăng ký để bắt đầu trải nghiệm mua sắm.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                    <FieldError error={errors.username?.message} label="Tên đăng nhập">
                        <input {...register("username")} className={inputClass} />
                    </FieldError>
                    <FieldError error={errors.fullName?.message} label="Họ và tên">
                        <input {...register("fullName")} className={inputClass} />
                    </FieldError>
                    <FieldError error={errors.email?.message} label="Email">
                        <input type="email" {...register("email")} className={inputClass} />
                    </FieldError>
                    <FieldError error={errors.password?.message} label="Mật khẩu">
                        <input type="password" {...register("password")} className={inputClass} />
                    </FieldError>
                    <FieldError error={errors.dateOfBirth?.message} label="Ngày sinh">
                        <input type="date" {...register("dateOfBirth")} className={inputClass} />
                    </FieldError>
                    <label className="block text-sm font-semibold">
                        Giới tính
                        <select {...register("gender")} className={`${inputClass} mt-1 bg-white`}>
                            <option value="MALE">Nam</option>
                            <option value="FEMALE">Nữ</option>
                        </select>
                    </label>
                    <button
                        disabled={isSubmitting}
                        className="w-full rounded-lg bg-indigo-600 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:opacity-70"
                    >
                        {isSubmitting ? "Đang tạo tài khoản..." : "Đăng ký"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-600">
                    Đã có tài khoản?{" "}
                    <Link to="/login" className="font-bold text-indigo-600">
                        Đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    );
}

function FieldError({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block text-sm font-semibold">
            {label}
            <span className="mt-1 block">{children}</span>
            {error && <span className="mt-1 block text-xs font-normal text-rose-600">{error}</span>}
        </label>
    );
}
