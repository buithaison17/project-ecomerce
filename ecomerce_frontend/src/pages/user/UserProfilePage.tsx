import { zodResolver } from "@hookform/resolvers/zod";
import { message, Tabs } from "antd";
import { Camera, Eye, EyeOff, Lock, Mail, Save, User, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAuthStore } from "../../store/authStore";
import { userService, type UserProfile } from "../../service/userService";

const profileSchema = z.object({
    fullName: z.string().min(2, "Vui lòng nhập họ tên"),
    email: z.string().email("Email không hợp lệ"),
    dateOfBirth: z.string().min(1, "Vui lòng chọn ngày sinh"),
    gender: z.enum(["MALE", "FEMALE"]),
});

const passwordSchema = z.object({
    oldPassword: z.string().min(6, "Mật khẩu cũ tối thiểu 6 ký tự"),
    newPassword: z.string().min(6, "Mật khẩu mới tối thiểu 6 ký tự"),
    confirmPassword: z.string().min(6, "Vui lòng xác nhận mật khẩu"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const inputClass =
    "w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export default function UserProfilePage() {
    const { user, loadCurrentUser } = useAuthStore();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>("");

    const {
        register: registerProfile,
        handleSubmit: handleSubmitProfile,
        formState: { errors: profileErrors, isSubmitting: isSubmittingProfile },
        reset: resetProfile,
    } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
    });

    const {
        register: registerPassword,
        handleSubmit: handleSubmitPassword,
        formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
        reset: resetPassword,
    } = useForm<PasswordForm>({
        resolver: zodResolver(passwordSchema),
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await userService.getCurrentUser();
            setProfile(data);
            resetProfile({
                fullName: data.fullName,
                email: data.email,
                dateOfBirth: data.dateOfBirth,
                gender: data.gender as "MALE" | "FEMALE",
            });
            if (data.avatarUrl) {
                setAvatarPreview(data.avatarUrl);
            }
        } catch {
            message.error("Không thể tải thông tin người dùng");
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const onSubmitProfile = async (data: ProfileForm) => {
        try {
            const formData = new FormData();
            formData.append("fullName", data.fullName);
            formData.append("email", data.email);
            formData.append("dateOfBirth", data.dateOfBirth);
            formData.append("gender", data.gender);
            if (avatarFile) {
                formData.append("avatarUrl", avatarFile);
            }

            await userService.updateProfile(formData);
            message.success("Cập nhật thông tin thành công");
            await loadCurrentUser();
            await loadProfile();
        } catch {
            message.error("Không thể cập nhật thông tin");
        }
    };

    const onSubmitPassword = async (data: PasswordForm) => {
        try {
            await userService.changePassword({
                oldPassword: data.oldPassword,
                newPassword: data.newPassword,
            });
            message.success("Đổi mật khẩu thành công");
            resetPassword();
        } catch {
            message.error("Mật khẩu cũ không đúng");
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-lg">Đang tải...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8">
            <div className="mx-auto max-w-4xl">
                <h1 className="mb-8 text-3xl font-bold">Thông tin tài khoản</h1>

                <div className="rounded-2xl bg-white p-6 shadow-lg md:p-8">
                    {/* Avatar Section */}
                    <div className="mb-8 flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="h-32 w-32 overflow-hidden rounded-full bg-slate-200">
                                {avatarPreview ? (
                                    <img
                                        src={avatarPreview}
                                        alt="Avatar"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-slate-400">
                                        <UserRound size={64} />
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-indigo-600 p-2 text-white hover:bg-indigo-700">
                                <Camera size={16} />
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                />
                            </label>
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-bold">{profile?.fullName}</h2>
                            <p className="text-slate-600">{profile?.email}</p>
                        </div>
                    </div>

                    <Tabs
                        defaultActiveKey="profile"
                        items={[
                            {
                                key: "profile",
                                label: "Thông tin cá nhân",
                                children: (
                                    <form
                                        onSubmit={handleSubmitProfile(onSubmitProfile)}
                                        className="space-y-6"
                                    >
                                        <div className="grid gap-6 md:grid-cols-2">
                                            <FormField
                                                label="Tên đăng nhập"
                                                icon={<UserRound size={18} />}
                                            >
                                                <input
                                                    value={profile?.username}
                                                    disabled
                                                    className={`${inputClass} bg-slate-100`}
                                                />
                                            </FormField>
                                            <FormField
                                                label="Họ và tên"
                                                error={profileErrors.fullName?.message}
                                                icon={<User size={18} />}
                                            >
                                                <input
                                                    {...registerProfile("fullName")}
                                                    placeholder="Nhập họ và tên"
                                                    className={inputClass}
                                                />
                                            </FormField>
                                            <FormField
                                                label="Email"
                                                error={profileErrors.email?.message}
                                                icon={<Mail size={18} />}
                                            >
                                                <input
                                                    {...registerProfile("email")}
                                                    placeholder="Nhập email"
                                                    className={inputClass}
                                                />
                                            </FormField>
                                            <FormField
                                                label="Ngày sinh"
                                                error={profileErrors.dateOfBirth?.message}
                                                icon={<User size={18} />}
                                            >
                                                <input
                                                    type="date"
                                                    {...registerProfile("dateOfBirth")}
                                                    className={inputClass}
                                                />
                                            </FormField>
                                            <FormField
                                                label="Giới tính"
                                                error={undefined}
                                                icon={<User size={18} />}
                                            >
                                                <select
                                                    {...registerProfile("gender")}
                                                    className={`${inputClass} bg-white`}
                                                >
                                                    <option value="MALE">Nam</option>
                                                    <option value="FEMALE">Nữ</option>
                                                </select>
                                            </FormField>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isSubmittingProfile}
                                            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-70"
                                        >
                                            <Save size={18} />
                                            {isSubmittingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                                        </button>
                                    </form>
                                ),
                            },
                            {
                                key: "password",
                                label: "Đổi mật khẩu",
                                children: (
                                    <form
                                        onSubmit={handleSubmitPassword(onSubmitPassword)}
                                        className="max-w-md space-y-6"
                                    >
                                        <FormField
                                            label="Mật khẩu cũ"
                                            error={passwordErrors.oldPassword?.message}
                                            icon={<Lock size={18} />}
                                        >
                                            <input
                                                type={showOldPassword ? "text" : "password"}
                                                {...registerPassword("oldPassword")}
                                                placeholder="Nhập mật khẩu cũ"
                                                className={`${inputClass} pr-11`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowOldPassword((v) => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                            >
                                                {showOldPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                                            </button>
                                        </FormField>
                                        <FormField
                                            label="Mật khẩu mới"
                                            error={passwordErrors.newPassword?.message}
                                            icon={<Lock size={18} />}
                                        >
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                {...registerPassword("newPassword")}
                                                placeholder="Nhập mật khẩu mới"
                                                className={`${inputClass} pr-11`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword((v) => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                            >
                                                {showNewPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                                            </button>
                                        </FormField>
                                        <FormField
                                            label="Xác nhận mật khẩu mới"
                                            error={passwordErrors.confirmPassword?.message}
                                            icon={<Lock size={18} />}
                                        >
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                {...registerPassword("confirmPassword")}
                                                placeholder="Nhập lại mật khẩu mới"
                                                className={`${inputClass} pr-11`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword((v) => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                            >
                                                {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                                            </button>
                                        </FormField>
                                        <button
                                            type="submit"
                                            disabled={isSubmittingPassword}
                                            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-70"
                                        >
                                            <Lock size={18} />
                                            {isSubmittingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
                                        </button>
                                    </form>
                                ),
                            },
                        ]}
                    />
                </div>
            </div>
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
