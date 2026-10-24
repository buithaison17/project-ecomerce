export function resolveImageUrl(url?: string | null, fallback = "https://placehold.co/600x600/f1f5f9/64748b?text=ShopNova"): string {
    if (!url) return fallback;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("data:")) {
        return url;
    }
    const backendUrl = "http://localhost:8080";
    return `${backendUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}
