import { useEffect, useState } from 'react';
import { UserService } from '@/services/user.service';
import { User } from '@/types';
import { Loader2, Plus, Pencil, Trash2, Key, Ban, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatDateIST } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const userSchema = z.object({
    full_name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    role: z.enum(['admin', 'marketer', 'super_admin']),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

const passwordSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const { register, handleSubmit, reset, setValue, control, formState: { errors, isSubmitting: formSubmitting } } = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            role: 'marketer'
        }
    });

    const { register: registerPw, handleSubmit: handleSubmitPw, reset: resetPw, formState: { errors: errorsPw, isSubmitting: pwSubmitting } } = useForm<{ password: string }>({
        resolver: zodResolver(passwordSchema)
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await UserService.getAllUsers();
            setUsers(data);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const onSubmitCreate = async (data: UserFormValues) => {
        try {
            await UserService.createUser(data);
            toast({ title: 'Success', description: 'User created successfully' });
            setIsCreateOpen(false);
            reset();
            loadUsers();
        } catch (error: any) {
            toast({ title: 'Error', description: error.response?.data?.message || 'Failed to create user', variant: 'destructive' });
        }
    };

    const onEditClick = (user: User) => {
        setSelectedUser(user);
        setValue('full_name', user.full_name);
        setValue('email', user.email);
        setValue('role', user.role);
        setIsEditOpen(true);
    };

    const onSubmitEdit = async (data: UserFormValues) => {
        if (!selectedUser) return;
        try {
            await UserService.updateUser(selectedUser.id, data);
            toast({ title: 'Success', description: 'User updated successfully' });
            setIsEditOpen(false);
            loadUsers();
        } catch (error: any) {
            toast({ title: 'Error', description: 'Failed to update user', variant: 'destructive' });
        }
    };

    const toggleStatus = async (user: User) => {
        try {
            await UserService.updateUser(user.id, { is_active: !user.is_active });
            toast({ title: 'Success', description: `User ${user.is_active ? 'deactivated' : 'activated'}` });
            loadUsers();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
        }
    };

    const onDeleteClick = async (user: User) => {
        if (!confirm(`Are you sure you want to delete ${user.full_name}? This cannot be undone.`)) return;
        try {
            await UserService.deleteUser(user.id);
            toast({ title: 'Success', description: 'User deleted' });
            loadUsers();
        } catch (error: any) {
            toast({ title: 'Error', description: error.response?.data?.message || 'Failed to delete user', variant: 'destructive' });
        }
    };

    const onPasswordClick = (user: User) => {
        setSelectedUser(user);
        resetPw();
        setIsPasswordOpen(true);
    };

    const onSubmitPassword = async (data: { password: string }) => {
        if (!selectedUser) return;
        try {
            await UserService.changePassword(selectedUser.id, data.password);
            toast({ title: 'Success', description: 'Password changed successfully' });
            setIsPasswordOpen(false);
        } catch (error: any) {
            toast({ title: 'Error', description: 'Failed to change password', variant: 'destructive' });
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Users</h2>
                    <p className="text-muted-foreground">Manage user access and roles.</p>
                </div>
                <Button onClick={() => { reset(); setIsCreateOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add User
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>
                        Total {users.length} users registered.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Session</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => {
                                const lastSession = user.sessions?.[0];
                                return (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-foreground">{user.full_name}</p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'admin' || user.role === 'super_admin' ? 'default' : 'secondary'} className="capitalize">
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.is_active ? 'outline' : 'destructive'} className={user.is_active ? "text-green-600 border-green-600" : ""}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {lastSession ? (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger className="text-left">
                                                                <p>{formatDateIST(lastSession.login_at)}</p>
                                                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                                                    {lastSession.ip_address}
                                                                </p>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>IP: {lastSession.ip_address}</p>
                                                                <p>Agent: {lastSession.user_agent}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">No session data</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="icon" onClick={() => onEditClick(user)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => onPasswordClick(user)}>
                                                <Key className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => toggleStatus(user)} title={user.is_active ? "Deactivate" : "Activate"}>
                                                {user.is_active ? <Ban className="h-4 w-4 text-orange-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => onDeleteClick(user)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create User Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input {...register('full_name')} />
                            {errors.full_name && <p className="text-sm text-red-500">{errors.full_name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input {...register('email')} />
                            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Controller
                                control={control}
                                name="role"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="marketer">Marketer</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <Input type="password" {...register('password')} />
                            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSubmit(onSubmitCreate)} disabled={formSubmitting}>Create User</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input {...register('full_name')} />
                            {errors.full_name && <p className="text-sm text-red-500">{errors.full_name.message}</p>}
                        </div>
                        {/* Email usually read-only or handled carefully */}
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Controller
                                control={control}
                                name="role"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="marketer">Marketer</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSubmit(onSubmitEdit)} disabled={formSubmitting}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Password Dialog */}
            <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>Reset password for {selectedUser?.full_name}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input type="password" {...registerPw('password')} />
                            {errorsPw.password && <p className="text-sm text-red-500">{errorsPw.password.message}</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSubmitPw(onSubmitPassword)} disabled={pwSubmitting}>Update Password</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
