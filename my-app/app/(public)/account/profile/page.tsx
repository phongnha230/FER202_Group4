'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Lock, LogOut, Save, X, AlertCircle, CheckCircle2, Phone, MapPin, Edit3 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Toast Component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 mb-4 text-sm rounded-lg shadow-lg animate-in slide-in-from-right-5 fade-in duration-300 ${
            type === 'success' ? 'text-green-800 bg-green-50 border border-green-200' : 'text-red-800 bg-red-50 border border-red-200'
        }`} role="alert">
            {type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className="ml-4 hover:opacity-70 transition-opacity">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('Vietnam');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
    };

    useEffect(() => {
        checkUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push('/login');
            return;
        }
        
        setUser(session.user);
        setFullName(session.user.user_metadata.full_name || '');
        setEmail(session.user.email || '');
        setPhone(session.user.user_metadata.phone || '');
        setStreet(session.user.user_metadata.street || '');
        setCity(session.user.user_metadata.city || '');
        setCountry(session.user.user_metadata.country || 'Vietnam');
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { 
                    full_name: fullName,
                    phone: phone,
                    street: street,
                    city: city,
                    country: country
                }
            });

            if (error) throw error;

            showNotification('Profile updated successfully!', 'success');
            setEditing(false);
            checkUser();
        } catch (error) {
            showNotification(error instanceof Error ? error.message : 'Failed to update profile', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showNotification('Please select an image file', 'error');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('Image size should be less than 5MB', 'error');
            return;
        }

        setAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUploadAvatar = async () => {
        if (!avatarFile || !user) return;

        setUploadingAvatar(true);
        try {
            // Create unique file name
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, avatarFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Update user metadata
            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (updateError) throw updateError;

            showNotification('Avatar updated successfully!', 'success');
            setAvatarFile(null);
            setAvatarPreview(null);
            checkUser(); // Refresh user data
        } catch (error) {
            showNotification(error instanceof Error ? error.message : 'Failed to upload avatar', 'error');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleCancelAvatar = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
                    <p className="mt-4 text-slate-600 font-medium">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-8 sm:py-12">
            {notification && (
                <Toast 
                    message={notification.message} 
                    type={notification.type} 
                    onClose={() => setNotification(null)} 
                />
            )}

            <div className="container-custom max-w-5xl px-4">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900 mb-4 inline-flex items-center gap-2 transition-colors">
                        ← Back to Home
                    </Link>
                    <div className="mt-4">
                        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">My Profile</h1>
                        <p className="text-slate-600 mt-2">Manage your account information and preferences</p>
                    </div>
                </div>

                <div className="grid gap-6">
                    {/* Profile Info Card */}
                    <Card className="border-slate-200 shadow-md">
                        <CardHeader className="pb-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <CardTitle className="text-xl">Profile Information</CardTitle>
                                    <CardDescription>Update your personal details below</CardDescription>
                                </div>
                                {!editing ? (
                                    <Button 
                                        onClick={() => setEditing(true)}
                                        className="bg-slate-900 hover:bg-slate-800 text-white"
                                    >
                                        <Edit3 className="w-4 h-4 mr-2" />
                                        Edit Profile
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button 
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                        <Button 
                                            onClick={() => {
                                                setEditing(false);
                                                setFullName(user?.user_metadata.full_name || '');
                                                setPhone(user?.user_metadata.phone || '');
                                                setStreet(user?.user_metadata.street || '');
                                                setCity(user?.user_metadata.city || '');
                                                setCountry(user?.user_metadata.country || 'Vietnam');
                                            }}
                                            variant="outline"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* Avatar Section */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b">
                                <div className="relative group">
                                    <Avatar className="h-24 w-24 ring-4 ring-slate-100">
                                        <AvatarImage src={avatarPreview || user?.user_metadata.avatar_url} />
                                        <AvatarFallback className="text-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white font-bold">
                                            {fullName?.charAt(0)?.toUpperCase() || email?.charAt(0)?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    {editing && !avatarFile && (
                                        <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <Edit3 className="w-6 h-6 text-white" />
                                            <input
                                                id="avatar-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleAvatarChange}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-xl text-slate-900">{fullName || 'User'}</h3>
                                    <p className="text-sm text-slate-600 mt-1">{email}</p>
                                    {!editing && phone && (
                                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            {phone}
                                        </p>
                                    )}
                                    {avatarFile && (
                                        <div className="flex gap-2 mt-3">
                                            <Button
                                                onClick={handleUploadAvatar}
                                                disabled={uploadingAvatar}
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                {uploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
                                            </Button>
                                            <Button
                                                onClick={handleCancelAvatar}
                                                disabled={uploadingAvatar}
                                                size="sm"
                                                variant="outline"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName" className="flex items-center gap-2 text-slate-700 font-semibold">
                                        <User className="w-4 h-4" />
                                        Full Name
                                    </Label>
                                    <Input
                                        id="fullName"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        disabled={!editing}
                                        className={`${!editing ? 'bg-slate-50 border-slate-200' : 'border-slate-300 focus:border-slate-900'} transition-all`}
                                        placeholder="Enter your full name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="flex items-center gap-2 text-slate-700 font-semibold">
                                        <Phone className="w-4 h-4" />
                                        Phone Number
                                    </Label>
                                    <Input
                                        id="phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        disabled={!editing}
                                        className={`${!editing ? 'bg-slate-50 border-slate-200' : 'border-slate-300 focus:border-slate-900'} transition-all`}
                                        placeholder="+84 123 456 789"
                                    />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="email" className="flex items-center gap-2 text-slate-700 font-semibold">
                                        <Mail className="w-4 h-4" />
                                        Email Address
                                    </Label>
                                    <Input
                                        id="email"
                                        value={email}
                                        disabled
                                        className="bg-slate-50 border-slate-200"
                                    />
                                    <p className="text-xs text-slate-500 italic">Email address cannot be changed</p>
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="street" className="flex items-center gap-2 text-slate-700 font-semibold">
                                        <MapPin className="w-4 h-4" />
                                        Street Address
                                    </Label>
                                    <Input
                                        id="street"
                                        value={street}
                                        onChange={(e) => setStreet(e.target.value)}
                                        disabled={!editing}
                                        className={`${!editing ? 'bg-slate-50 border-slate-200' : 'border-slate-300 focus:border-slate-900'} transition-all`}
                                        placeholder="Enter your street address"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="city" className="flex items-center gap-2 text-slate-700 font-semibold">
                                        <MapPin className="w-4 h-4" />
                                        City
                                    </Label>
                                    <Input
                                        id="city"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        disabled={!editing}
                                        className={`${!editing ? 'bg-slate-50 border-slate-200' : 'border-slate-300 focus:border-slate-900'} transition-all`}
                                        placeholder="Enter your city"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="country" className="flex items-center gap-2 text-slate-700 font-semibold">
                                        <MapPin className="w-4 h-4" />
                                        Country
                                    </Label>
                                    <Select 
                                        value={country} 
                                        onValueChange={setCountry}
                                        disabled={!editing}
                                    >
                                        <SelectTrigger className={`${!editing ? 'bg-slate-50 border-slate-200' : 'border-slate-300 focus:border-slate-900'} transition-all`}>
                                            <SelectValue placeholder="Select country" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Vietnam">🇻🇳 Vietnam</SelectItem>
                                            <SelectItem value="Thailand">🇹🇭 Thailand</SelectItem>
                                            <SelectItem value="Singapore">🇸🇬 Singapore</SelectItem>
                                            <SelectItem value="Malaysia">🇲🇾 Malaysia</SelectItem>
                                            <SelectItem value="Indonesia">🇮🇩 Indonesia</SelectItem>
                                            <SelectItem value="Philippines">🇵🇭 Philippines</SelectItem>
                                            <SelectItem value="Myanmar">🇲🇲 Myanmar</SelectItem>
                                            <SelectItem value="Cambodia">🇰🇭 Cambodia</SelectItem>
                                            <SelectItem value="Laos">🇱🇦 Laos</SelectItem>
                                            <SelectItem value="Brunei">🇧🇳 Brunei</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security Card */}
                    <Card className="border-slate-200 shadow-md">
                        <CardHeader>
                            <CardTitle className="text-xl">Security</CardTitle>
                            <CardDescription>Manage your password and account security</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button 
                                variant="outline" 
                                className="w-full sm:w-auto border-slate-300 hover:bg-slate-50"
                                asChild
                            >
                                <Link href="/forgot-password">
                                    <Lock className="w-4 h-4 mr-2" />
                                    Change Password
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Account Actions */}
                    <Card className="border-slate-200 shadow-md">
                        <CardHeader>
                            <CardTitle className="text-xl">Account Actions</CardTitle>
                            <CardDescription>Manage your account settings</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button 
                                variant="outline" 
                                className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Log Out
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
