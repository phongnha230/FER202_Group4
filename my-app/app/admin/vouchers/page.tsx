"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, Loader2, Pencil, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

interface Voucher {
    id: string;
    code: string;
    description: string | null;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    applies_to: "order" | "shipping";
    min_order_amount: number;
    max_uses: number | null;
    used_count: number;
    expires_at: string | null;
    is_active: boolean;
    created_at: string;
}

const emptyForm = {
    code: "",
    description: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: "",
    applies_to: "order" as "order" | "shipping",
    min_order_amount: "",
    max_uses: "",
    expires_at: "",
};

function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN");
}

export default function VouchersPage() {
    const supabase = createClient();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);

    const fetchVouchers = async () => {
        setLoading(true);
        const { data } = await supabase
            .from("vouchers")
            .select("*")
            .order("created_at", { ascending: false });
        setVouchers((data as Voucher[]) || []);
        setLoading(false);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchVouchers(); }, []);

    const handleCreate = async () => {
        setFormError(null);
        if (!form.code.trim()) return setFormError("Vui lòng nhập mã voucher");
        if (!form.discount_value || Number(form.discount_value) <= 0) return setFormError("Giá trị giảm phải > 0");

        setSaving(true);
        const { error } = await supabase.from("vouchers").insert({
            code: form.code.toUpperCase().trim(),
            description: form.description || null,
            discount_type: form.discount_type,
            discount_value: Number(form.discount_value),
            applies_to: form.applies_to,
            min_order_amount: Number(form.min_order_amount) || 0,
            max_uses: form.max_uses ? Number(form.max_uses) : null,
            expires_at: form.expires_at || null,
            is_active: true,
        });

        setSaving(false);
        if (error) {
            setFormError(error.message.includes("unique") ? "Mã voucher đã tồn tại" : error.message);
            return;
        }
        setForm(emptyForm);
        setShowForm(false);
        fetchVouchers();
    };

    const handleToggle = async (v: Voucher) => {
        setTogglingId(v.id);
        await supabase.from("vouchers").update({ is_active: !v.is_active }).eq("id", v.id);
        setTogglingId(null);
        fetchVouchers();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Xóa voucher này?")) return;
        setDeletingId(id);
        await supabase.from("vouchers").delete().eq("id", id);
        setDeletingId(null);
        fetchVouchers();
    };

    const handleExportCSV = () => {
        const headers = ["Mã code", "Mô tả", "Loại giảm", "Giá trị", "Áp dụng cho", "Đơn tối thiểu ($)", "Đã dùng", "Tối đa", "Hết hạn", "Trạng thái", "Ngày tạo"];
        const rows = vouchers.map((v) => [
            v.code,
            v.description ?? "",
            v.discount_type === "percentage" ? "Phần trăm" : "Cố định",
            v.discount_type === "percentage" ? `${v.discount_value}%` : `$${v.discount_value}`,
            v.applies_to === "shipping" ? "Phí vận chuyển" : "Đơn hàng",
            v.min_order_amount > 0 ? v.min_order_amount : 0,
            v.used_count,
            v.max_uses ?? "Không giới hạn",
            formatDate(v.expires_at),
            v.is_active ? "Đang hoạt động" : "Đã tắt",
            formatDate(v.created_at),
        ]);

        const csv = [headers, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `vouchers_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleEdit = (v: Voucher) => {
        setEditingVoucher(v);
        setForm({
            code: v.code,
            description: v.description ?? "",
            discount_type: v.discount_type,
            discount_value: String(v.discount_value),
            applies_to: v.applies_to,
            min_order_amount: v.min_order_amount > 0 ? String(v.min_order_amount) : "",
            max_uses: v.max_uses !== null ? String(v.max_uses) : "",
            expires_at: v.expires_at ? v.expires_at.split("T")[0] : "",
        });
        setShowForm(true);
        setFormError(null);
    };

    const handleUpdate = async () => {
        if (!editingVoucher) return;
        setFormError(null);
        if (!form.code.trim()) return setFormError("Vui lòng nhập mã voucher");
        if (!form.discount_value || Number(form.discount_value) <= 0) return setFormError("Giá trị giảm phải > 0");

        setSaving(true);
        const { error } = await supabase.from("vouchers").update({
            code: form.code.toUpperCase().trim(),
            description: form.description || null,
            discount_type: form.discount_type,
            discount_value: Number(form.discount_value),
            applies_to: form.applies_to,
            min_order_amount: Number(form.min_order_amount) || 0,
            max_uses: form.max_uses ? Number(form.max_uses) : null,
            expires_at: form.expires_at || null,
        }).eq("id", editingVoucher.id);

        setSaving(false);
        if (error) {
            setFormError(error.message.includes("unique") ? "Mã voucher đã tồn tại" : error.message);
            return;
        }
        setEditingVoucher(null);
        setForm(emptyForm);
        setShowForm(false);
        fetchVouchers();
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Vouchers</h1>
                    <p className="text-sm text-slate-500 mt-1">Quản lý mã giảm giá</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportCSV} disabled={vouchers.length === 0}>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button onClick={() => { setEditingVoucher(null); setForm(emptyForm); setShowForm(!showForm); setFormError(null); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo voucher
                    </Button>
                </div>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6 shadow-sm">
                    <h2 className="text-base font-semibold mb-4">{editingVoucher ? `Chỉnh sửa: ${editingVoucher.code}` : "Voucher mới"}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Mã code *</label>
                            <Input
                                placeholder="VD: SUMMER20"
                                value={form.code}
                                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Loại giảm *</label>
                            <Select
                                value={form.discount_type}
                                onValueChange={(v) => setForm({ ...form, discount_type: v as "percentage" | "fixed" })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Phần trăm (%)</SelectItem>
                                    <SelectItem value="fixed">Số tiền cố định ($)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Áp dụng cho *</label>
                            <Select
                                value={form.applies_to}
                                onValueChange={(v) => setForm({ ...form, applies_to: v as "order" | "shipping" })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="order">Đơn hàng (subtotal)</SelectItem>
                                    <SelectItem value="shipping">Phí vận chuyển</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">
                                Giá trị * {form.discount_type === "percentage" ? "(%)" : "($)"}
                            </label>
                            <Input
                                type="number"
                                min="0"
                                placeholder={form.discount_type === "percentage" ? "10" : "20"}
                                value={form.discount_value}
                                onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Đơn tối thiểu ($)</label>
                            <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={form.min_order_amount}
                                onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Số lần dùng tối đa</label>
                            <Input
                                type="number"
                                min="1"
                                placeholder="Không giới hạn"
                                value={form.max_uses}
                                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Ngày hết hạn</label>
                            <Input
                                type="date"
                                value={form.expires_at}
                                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-3">
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Mô tả (hiện cho khách)</label>
                            <Input
                                placeholder="VD: Giảm 20% cho đơn hàng mùa hè"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                        </div>
                    </div>

                    {formError && <p className="text-sm text-red-500 mt-3">{formError}</p>}

                    <div className="flex gap-3 mt-4">
                        <Button onClick={editingVoucher ? handleUpdate : handleCreate} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {editingVoucher ? "Cập nhật" : "Lưu voucher"}
                        </Button>
                        <Button variant="outline" onClick={() => { setShowForm(false); setEditingVoucher(null); setForm(emptyForm); setFormError(null); }}>
                            Hủy
                        </Button>
                    </div>
                </div>
            )}

            {/* Voucher Table */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead className="font-semibold">Mã code</TableHead>
                            <TableHead className="font-semibold">Loại giảm</TableHead>
                            <TableHead className="font-semibold">Áp dụng cho</TableHead>
                            <TableHead className="font-semibold">Đơn tối thiểu</TableHead>
                            <TableHead className="font-semibold">Đã dùng</TableHead>
                            <TableHead className="font-semibold">Hết hạn</TableHead>
                            <TableHead className="font-semibold">Trạng thái</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : vouchers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                                    Chưa có voucher nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            vouchers.map((v) => (
                                <TableRow key={v.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-mono font-semibold text-slate-900">{v.code}</p>
                                            {v.description && (
                                                <p className="text-xs text-slate-400 mt-0.5">{v.description}</p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {v.discount_type === "percentage"
                                            ? <span className="font-medium text-blue-600">{v.discount_value}%</span>
                                            : <span className="font-medium text-green-600">${v.discount_value}</span>
                                        }
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {(v.applies_to ?? "order") === "shipping"
                                            ? <span className="text-orange-600 font-medium">Phí ship</span>
                                            : <span>Đơn hàng</span>
                                        }
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {v.min_order_amount > 0 ? `$${v.min_order_amount}` : "—"}
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {v.used_count}
                                        {v.max_uses !== null && (
                                            <span className="text-slate-400"> / {v.max_uses}</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-slate-600">{formatDate(v.expires_at)}</TableCell>
                                    <TableCell>
                                        <Badge variant={v.is_active ? "default" : "secondary"}>
                                            {v.is_active ? "Đang hoạt động" : "Đã tắt"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(v)}
                                                title="Chỉnh sửa voucher"
                                            >
                                                <Pencil className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggle(v)}
                                                disabled={togglingId === v.id}
                                                title={v.is_active ? "Tắt voucher" : "Bật voucher"}
                                            >
                                                {togglingId === v.id
                                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                                    : v.is_active
                                                        ? <ToggleRight className="h-4 w-4 text-green-500" />
                                                        : <ToggleLeft className="h-4 w-4 text-slate-400" />
                                                }
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(v.id)}
                                                disabled={deletingId === v.id}
                                                title="Xóa voucher"
                                            >
                                                {deletingId === v.id
                                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                                    : <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                                                }
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
