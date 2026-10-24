import { zodResolver } from "@hookform/resolvers/zod";
import { message } from "antd";
import axios from "axios";
import {
    Camera,
    CheckCircle2,
    Eye,
    EyeOff,
    KeyRound,
    MapPin,
    Phone,
    Plus,
    Save,
    Trash2,
    User,
    UserCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as z from "zod";
import {
    userService,
    type UserDeliveryItem,
    type UserProfile,
} from "../../service/userService";
import { useAuthStore } from "../../store/authStore";

// ------------------------------------------------ Schemas
const profileSchema = z.object({
    fullName: z.string().min(2, "Họ và tên phải có ít nhất 2 ký tự"),
    email: z.string().email("Email không hợp lệ"),
    dateOfBirth: z.string().min(1, "Vui lòng chọn ngày sinh"),
    gender: z.enum(["MALE", "FEMALE"]),
});

const passwordSchema = z
    .object({
        oldPassword: z.string().min(6, "Mật khẩu hiện tại tối thiểu 6 ký tự"),
        newPassword: z.string().min(6, "Mật khẩu mới tối thiểu 6 ký tự"),
        confirmPassword: z.string().min(6, "Vui lòng xác nhận mật khẩu mới"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Mật khẩu xác nhận không khớp",
        path: ["confirmPassword"],
    })
    .refine((data) => data.oldPassword !== data.newPassword, {
        message: "Mật khẩu mới phải khác mật khẩu hiện tại",
        path: ["newPassword"],
    });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100/70";

const resolveAvatarUrl = (url?: string | null, name?: string) => {
    if (url) {
        if (url.startsWith("http://") || url.startsWith("https://")) return url;
        return `http://localhost:8080${url.startsWith("/") ? "" : "/"}${url}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name || "ShopNova"
    )}&background=4f46e5&color=fff&bold=true`;
};

export default function UserProfilePage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const user = useAuthStore((state) => state.user);
    const loadCurrentUser = useAuthStore((state) => state.loadCurrentUser);

    // Active tab: 'info' | 'password' | 'addresses'
    const activeTab = searchParams.get("tab") || "info";
    const setTab = (tab: string) => {
        setSearchParams({ tab });
    };

    const [loadingProfile, setLoadingProfile] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);

    // Avatar state
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Password visibility
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Address state
    const [addresses, setAddresses] = useState<UserDeliveryItem[]>([]);
    const [loadingAddresses, setLoadingAddresses] = useState(false);
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({ address: "", phoneNumber: "" });
    const [addingAddress, setAddingAddress] = useState(false);

    // ------------------------------------------------ Form Hook: Profile
    const {
        register: registerProfile,
        handleSubmit: handleProfileSubmit,
        reset: resetProfileForm,
        formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
    } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
    });

    // ------------------------------------------------ Form Hook: Password
    const {
        register: registerPassword,
        handleSubmit: handlePasswordSubmit,
        reset: resetPasswordForm,
        formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
    } = useForm<PasswordForm>({
        resolver: zodResolver(passwordSchema),
    });

    // Load Profile
    useEffect(() => {
        if (!user) {
            navigate("/login", { state: { returnTo: "/profile" } });
            return;
        }

        userService
            .getCurrentUser()
            .then((data) => {
                setProfile(data);
                resetProfileForm({
                    fullName: data.fullName || "",
                    email: data.email || "",
                    dateOfBirth: data.dateOfBirth || "2000-01-01",
                    gender: data.gender === "FEMALE" ? "FEMALE" : "MALE",
                });
            })
            .catch(() => {
                message.error("Không thể tải thông tin cá nhân");
            })
            .finally(() => {
                setLoadingProfile(false);
            });
    }, [user, navigate, resetProfileForm]);

    // Load Addresses when address tab active
    useEffect(() => {
        if (activeTab === "addresses") {
            setLoadingAddresses(true);
            userService
                .getDeliveries()
                .then(setAddresses)
                .catch(() => message.error("Không tải được danh sách địa chỉ"))
                .finally(() => setLoadingAddresses(false));
        }
    }, [activeTab]);

    // Handle Avatar Selection
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            message.error("Vui lòng chọn tệp hình ảnh (JPG, PNG, WEBP)");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            message.error("Dung lượng ảnh tối đa là 5MB");
            return;
        }

        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    // Submit Profile Updates
    const onProfileSubmit = async (data: ProfileForm) => {
        try {
            const formData = new FormData();
            formData.append("fullName", data.fullName);
            formData.append("email", data.email);
            formData.append("dateOfBirth", data.dateOfBirth);
            formData.append("gender", data.gender);
            if (avatarFile) {
                formData.append("avatarUrl", avatarFile);
            }

            const res = await userService.updateProfile(formData);
            message.success("Cập nhật thông tin cá nhân thành công");

            // Refresh user state
            await loadCurrentUser();
            if (res?.data?.userInformation) {
                setProfile((prev) =>
                    prev
                        ? {
                              ...prev,
                              fullName: data.fullName,
                              email: data.email,
                              dateOfBirth: data.dateOfBirth,
                              gender: data.gender,
                              avatarUrl: res.data.userInformation.avatarUrl || prev.avatarUrl,
                          }
                        : null
                );
            }
        } catch (error) {
            const responseData = axios.isAxiosError(error) ? error.response?.data : undefined;
            message.error(responseData?.message || "Không thể cập nhật thông tin cá nhân");
        }
    };

    // Submit Password Change
    const onPasswordSubmit = async (data: PasswordForm) => {
        try {
            await userService.changePassword({
                oldPassword: data.oldPassword,
                newPassword: data.newPassword,
            });
            message.success("Đổi mật khẩu thành công!");
            resetPasswordForm();
        } catch (error) {
            const responseData = axios.isAxiosError(error) ? error.response?.data : undefined;
            message.error(
                responseData?.message || "Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại."
            );
        }
    };

    // Handle Address Creation
    const handleCreateAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAddress.address.trim() || !newAddress.phoneNumber.trim()) {
            message.error("Vui lòng nhập đầy đủ địa chỉ và số điện thoại");
            return;
        }
        setAddingAddress(true);
        try {
            const created = await userService.createDelivery(newAddress);
            message.success("Thêm địa chỉ thành công");
            setAddresses((prev) => [...prev, created]);
            setNewAddress({ address: "", phoneNumber: "" });
            setShowAddAddress(false);
        } catch {
            message.error("Không thể thêm địa chỉ nhận hàng");
        } finally {
            setAddingAddress(false);
        }
    };

    const handleDeleteAddress = async (id: number) => {
        try {
            await userService.deleteDelivery(id);
            message.success("Đã xóa địa chỉ");
            setAddresses((prev) => prev.filter((item) => item.id !== id));
        } catch {
            message.error("Không thể xóa địa chỉ này");
        }
    };

    const currentAvatar =
        avatarPreview || resolveAvatarUrl(profile?.avatarUrl || user?.avatarUrl, profile?.fullName || user?.fullName);

    return (
        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
            {/* Header User Card */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-100/60 to-violet-100/30 blur-2xl pointer-events-none" />
                <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                    <div className="relative group">
                        <img
                            src={currentAvatar}
                            alt="Ảnh đại diện"
                            className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-lg shadow-indigo-100 ring-2 ring-indigo-50 sm:h-28 sm:w-28"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-2 -right-2 grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
                            title="Tải ảnh mới"
                        >
                            <Camera size={17} />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                    <div className="text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
                                {profile?.fullName || user?.fullName || "Người dùng"}
                            </h1>
                            <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                                <UserCheck size={13} />
                                {user?.role === "ADMIN" ? "Quản trị viên" : "Khách hàng"}
                            </span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            @{profile?.username || user?.username} • {profile?.email || user?.email}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                            Quản lý thông tin hồ sơ, bảo mật mật khẩu và sổ địa chỉ giao hàng.
                        </p>
                    </div>
                </div>

                {/* Tabs Segmented Navigation */}
                <div className="mt-8 flex overflow-x-auto border-t border-slate-100 pt-4 scrollbar-none">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setTab("info")}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                                activeTab === "info"
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                        >
                            <User size={16} />
                            <span>Thông tin cá nhân</span>
                        </button>

                        <button
                            onClick={() => setTab("password")}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                                activeTab === "password"
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                        >
                            <KeyRound size={16} />
                            <span>Đổi mật khẩu</span>
                        </button>

                        <button
                            onClick={() => setTab("addresses")}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                                activeTab === "addresses"
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                        >
                            <MapPin size={16} />
                            <span>Sổ địa chỉ nhận hàng</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Contents */}
            <div className="mt-8">
                {/* ===================== TAB 1: THÔNG TIN CÁ NHÂN ===================== */}
                {activeTab === "info" && (
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Thông tin cá nhân</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Cập nhật ảnh đại diện và thông tin liên hệ của bạn để mua sắm thuận tiện hơn.
                            </p>
                        </div>

                        {loadingProfile ? (
                            <div className="py-12 text-center text-sm text-slate-400">
                                Đang tải thông tin cá nhân...
                            </div>
                        ) : (
                            <form
                                onSubmit={handleProfileSubmit(onProfileSubmit)}
                                className="mt-6 space-y-5 max-w-2xl"
                            >
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        Tên đăng nhập (Username)
                                        <input
                                            disabled
                                            value={profile?.username || user?.username || ""}
                                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-100 py-2.5 px-3.5 text-sm text-slate-500 font-semibold cursor-not-allowed"
                                        />
                                        <span className="mt-1 block text-xs text-slate-400">
                                            Tên đăng nhập không thể thay đổi
                                        </span>
                                    </label>

                                    <label className="block text-sm font-semibold text-slate-700">
                                        Họ và tên
                                        <input
                                            {...registerProfile("fullName")}
                                            placeholder="Nguyễn Văn A"
                                            className={inputClass}
                                        />
                                        {profileErrors.fullName?.message && (
                                            <span className="mt-1 block text-xs text-rose-600">
                                                {profileErrors.fullName.message}
                                            </span>
                                        )}
                                    </label>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        Email
                                        <input
                                            type="email"
                                            {...registerProfile("email")}
                                            placeholder="email@example.com"
                                            className={inputClass}
                                        />
                                        {profileErrors.email?.message && (
                                            <span className="mt-1 block text-xs text-rose-600">
                                                {profileErrors.email.message}
                                            </span>
                                        )}
                                    </label>

                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="block text-sm font-semibold text-slate-700">
                                            Ngày sinh
                                            <input
                                                type="date"
                                                {...registerProfile("dateOfBirth")}
                                                className={inputClass}
                                            />
                                            {profileErrors.dateOfBirth?.message && (
                                                <span className="mt-1 block text-xs text-rose-600">
                                                    {profileErrors.dateOfBirth.message}
                                                </span>
                                            )}
                                        </label>

                                        <label className="block text-sm font-semibold text-slate-700">
                                            Giới tính
                                            <select
                                                {...registerProfile("gender")}
                                                className={`${inputClass} font-semibold`}
                                            >
                                                <option value="MALE">Nam</option>
                                                <option value="FEMALE">Nữ</option>
                                            </select>
                                        </label>
                                    </div>
                                </div>

                                {avatarFile && (
                                    <div className="flex items-center gap-3 rounded-2xl bg-indigo-50 p-3.5 text-xs text-indigo-900">
                                        <CheckCircle2 size={18} className="text-indigo-600 shrink-0" />
                                        <span>
                                            Đã chọn ảnh mới: <strong>{avatarFile.name}</strong>. Hãy bấm{" "}
                                            <strong>Lưu thay đổi</strong> để áp dụng ảnh đại diện.
                                        </span>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={isProfileSubmitting}
                                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-70"
                                    >
                                        <Save size={16} />
                                        <span>
                                            {isProfileSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                                        </span>
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* ===================== TAB 2: ĐỔI MẬT KHẨU ===================== */}
                {activeTab === "password" && (
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Đổi mật khẩu</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Để bảo mật tài khoản, vui lòng đặt mật khẩu có ít nhất 6 ký tự kết hợp chữ và số.
                            </p>
                        </div>

                        <form
                            onSubmit={handlePasswordSubmit(onPasswordSubmit)}
                            className="mt-6 space-y-4 max-w-md"
                        >
                            <label className="block text-sm font-semibold text-slate-700">
                                Mật khẩu hiện tại
                                <div className="relative mt-1.5">
                                    <input
                                        type={showOldPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        {...registerPassword("oldPassword")}
                                        placeholder="Nhập mật khẩu hiện tại"
                                        className={`${inputClass} pr-11`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowOldPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        tabIndex={-1}
                                    >
                                        {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {passwordErrors.oldPassword?.message && (
                                    <span className="mt-1 block text-xs text-rose-600">
                                        {passwordErrors.oldPassword.message}
                                    </span>
                                )}
                            </label>

                            <label className="block text-sm font-semibold text-slate-700">
                                Mật khẩu mới
                                <div className="relative mt-1.5">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        {...registerPassword("newPassword")}
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
                                </div>
                                {passwordErrors.newPassword?.message && (
                                    <span className="mt-1 block text-xs text-rose-600">
                                        {passwordErrors.newPassword.message}
                                    </span>
                                )}
                            </label>

                            <label className="block text-sm font-semibold text-slate-700">
                                Xác nhận mật khẩu mới
                                <div className="relative mt-1.5">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        {...registerPassword("confirmPassword")}
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
                                </div>
                                {passwordErrors.confirmPassword?.message && (
                                    <span className="mt-1 block text-xs text-rose-600">
                                        {passwordErrors.confirmPassword.message}
                                    </span>
                                )}
                            </label>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isPasswordSubmitting}
                                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-70"
                                >
                                    <KeyRound size={16} />
                                    <span>
                                        {isPasswordSubmitting ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ===================== TAB 3: SỔ ĐỊA CHỈ NHẬN HÀNG ===================== */}
                {activeTab === "addresses" && (
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Sổ địa chỉ nhận hàng</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Quản lý các địa chỉ giao hàng để thanh toán nhanh hơn khi đặt đơn.
                                </p>
                            </div>
                            {!showAddAddress && (
                                <button
                                    onClick={() => setShowAddAddress(true)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
                                >
                                    <Plus size={16} />
                                    <span>Thêm địa chỉ mới</span>
                                </button>
                            )}
                        </div>

                        {/* Add address form */}
                        {showAddAddress && (
                            <form
                                onSubmit={handleCreateAddress}
                                className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 space-y-4"
                            >
                                <h3 className="font-bold text-sm text-indigo-900">Thêm địa chỉ mới</h3>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Số điện thoại
                                        <input
                                            required
                                            value={newAddress.phoneNumber}
                                            onChange={(e) =>
                                                setNewAddress((p) => ({ ...p, phoneNumber: e.target.value }))
                                            }
                                            placeholder="09xx xxx xxx"
                                            className={inputClass}
                                        />
                                    </label>
                                    <label className="block text-xs font-bold text-slate-700 sm:col-span-2">
                                        Địa chỉ cụ thể
                                        <textarea
                                            required
                                            rows={2}
                                            value={newAddress.address}
                                            onChange={(e) =>
                                                setNewAddress((p) => ({ ...p, address: e.target.value }))
                                            }
                                            placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                                            className={`${inputClass} resize-none`}
                                        />
                                    </label>
                                </div>
                                <div className="flex justify-end gap-2.5 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddAddress(false)}
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addingAddress}
                                        className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-60"
                                    >
                                        {addingAddress ? "Đang lưu..." : "Lưu địa chỉ"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Address list */}
                        <div className="mt-6 space-y-3">
                            {loadingAddresses ? (
                                <p className="py-8 text-center text-sm text-slate-400">
                                    Đang tải sổ địa chỉ...
                                </p>
                            ) : addresses.length > 0 ? (
                                addresses.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 p-4 transition hover:border-indigo-200"
                                    >
                                        <div className="min-w-0 flex items-start gap-3">
                                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-indigo-600">
                                                <MapPin size={18} />
                                            </span>
                                            <div>
                                                <p className="font-bold text-sm text-slate-800">
                                                    {item.address}
                                                </p>
                                                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                                    <Phone size={13} />
                                                    {item.phoneNumber}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteAddress(item.id)}
                                            className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                                            title="Xóa địa chỉ"
                                        >
                                            <Trash2 size={17} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
                                    <MapPin className="mx-auto text-slate-300" size={32} />
                                    <p className="mt-2 text-sm font-bold text-slate-700">
                                        Chưa có địa chỉ giao hàng nào
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-400">
                                        Hãy thêm địa chỉ để thuận tiện hơn khi thanh toán.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
