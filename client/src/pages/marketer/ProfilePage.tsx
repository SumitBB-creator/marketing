import { useEffect, useState } from 'react';
import { UserService } from '@/services/user.service';
import { UploadService } from '@/services/upload.service';
import { useAuth } from '@/context/AuthContext';

import { Loader2, Save, Key, Camera, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const profileSchema = z.object({
    full_name: z.string().min(1, 'Name is required'),
    email: z.string().email().optional(), // Read only
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    headline: z.string().optional(),
    bio: z.string().optional(),
});

const passwordSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const { updateUser } = useAuth();

    const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(profileSchema)
    });

    const { register: registerPw, handleSubmit: handleSubmitPw, reset: resetPw, formState: { errors: errorsPw, isSubmitting: pwSubmitting } } = useForm({
        resolver: zodResolver(passwordSchema)
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await UserService.getProfile();
            setValue('full_name', data.full_name);
            setValue('email', data.email);
            setValue('phone', data.phone || '');
            setValue('address', data.address || '');
            setValue('city', data.city || '');
            setValue('country', data.country || '');
            setValue('headline', data.headline || '');
            setValue('bio', data.bio || '');
            setAvatarUrl(data.avatar_url || null);
            setLoading(false);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' });
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const { url } = await UploadService.uploadFile(file);
            setAvatarUrl(url);

            // Auto save avatar update
            await UserService.updateProfile({ avatar_url: url });
            updateUser({ avatar_url: url }); // Update global state
            toast({ title: 'Success', description: 'Avatar updated' });
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || 'Failed to upload avatar. Max size 50MB.';
            toast({ title: 'Error', description: msg, variant: 'destructive' });
        } finally {
            setUploading(false);
        }
    };

    const onUpdateProfile = async (data: any) => {
        try {
            await UserService.updateProfile({
                ...data,
                avatar_url: avatarUrl
            });
            updateUser({ full_name: data.full_name, avatar_url: avatarUrl || undefined }); // Update global state
            toast({ title: 'Success', description: 'Profile updated' });
            loadProfile();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
        }
    };

    const onChangePassword = async (data: any) => {
        try {
            await UserService.changeProfilePassword(data.password);
            toast({ title: 'Success', description: 'Password changed' });
            resetPw();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to change password', variant: 'destructive' });
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6 w-full">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
                <p className="text-muted-foreground">Manage your account settings.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Public Profile</CardTitle>
                        <CardDescription>This information will be displayed on your profile.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-muted bg-muted flex items-center justify-center">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">
                                            <User className="h-12 w-12" />
                                        </div>
                                    )}
                                </div>
                                <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                                    {uploading ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Camera className="h-6 w-6 text-white" />}
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                                </label>
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-medium">Profile Picture</h3>
                                <p className="text-sm text-muted-foreground">Click to upload. JPG, PNG or GIF (max 5MB).</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input {...register('full_name')} />
                                {errors.full_name && <p className="text-sm text-red-500">{errors.full_name?.message as string}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Headline / Job Title</Label>
                                <Input {...register('headline')} placeholder="e.g. Senior Marketing Manager" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Bio</Label>
                                <Textarea {...register('bio')} placeholder="Tell us a little about yourself" className="h-20" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                        <CardDescription>Private details for internal use.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input {...register('email')} disabled className="bg-muted" />
                            <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input {...register('phone')} placeholder="+1 (555) 000-0000" />
                        </div>
                        <div className="space-y-2">
                            <Label>Address</Label>
                            <Input {...register('address')} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <Label>City</Label>
                                <Input {...register('city')} />
                            </div>
                            <div className="space-y-2">
                                <Label>Country</Label>
                                <Input {...register('country')} />
                            </div>
                        </div>
                        <div className="pt-2">
                            <Button onClick={handleSubmit(onUpdateProfile)} disabled={isSubmitting}>
                                <Save className="mr-2 h-4 w-4" /> Save Changes
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Security</CardTitle>
                        <CardDescription>Change your password.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input type="password" {...registerPw('password')} />
                            {errorsPw.password && <p className="text-sm text-red-500">{errorsPw.password?.message as string}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Confirm Password</Label>
                            <Input type="password" {...registerPw('confirmPassword')} />
                            {errorsPw.confirmPassword && <p className="text-sm text-red-500">{errorsPw.confirmPassword?.message as string}</p>}
                        </div>
                        <div className="pt-2">
                            <Button onClick={handleSubmitPw(onChangePassword)} disabled={pwSubmitting} variant="outline">
                                <Key className="mr-2 h-4 w-4" /> Update Password
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
