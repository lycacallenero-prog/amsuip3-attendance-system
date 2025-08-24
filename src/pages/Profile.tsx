import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { User, Mail, Calendar, Shield, Edit, Eye, EyeOff, Camera, Upload, CheckCircle, AlertCircle, Clock, Activity, Bell, Lock, Key, Smartphone, Globe, Save, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { debounce } from "lodash";

interface UserProfile {
  id: string;
  role: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  updated_at?: string;
  preferences?: {
    notifications?: boolean;
    two_factor?: boolean;
    theme?: 'light' | 'dark' | 'auto';
  };
}

interface FormValidation {
  firstName: { isValid: boolean; message: string };
  lastName: { isValid: boolean; message: string };
  currentPassword: { isValid: boolean; message: string };
  newPassword: { isValid: boolean; message: string };
  confirmPassword: { isValid: boolean; message: string };
}

const Profile = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Edit Profile Dialog State
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Change Password Dialog State
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    notificationsEnabled: true,
    sessionTimeout: 30
  });

  // Form Validation State
  const [validation, setValidation] = useState<FormValidation>({
    firstName: { isValid: true, message: '' },
    lastName: { isValid: true, message: '' },
    currentPassword: { isValid: true, message: '' },
    newPassword: { isValid: true, message: '' },
    confirmPassword: { isValid: true, message: '' }
  });

  // Debounced auto-save function
  const debouncedAutoSave = useCallback(
    debounce(async (firstName: string, lastName: string, phone: string) => {
      if (!user) return;
      
      setAutoSaveStatus('saving');
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) throw error;

        setUserProfile(prev => prev ? {
          ...prev,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          updated_at: new Date().toISOString()
        } : null);

        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Auto-save error:', error);
        setAutoSaveStatus('error');
        setTimeout(() => setAutoSaveStatus('idle'), 3000);
      }
    }, 1000),
    [user]
  );

  // Password strength calculator
  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    return strength;
  };

  // Form validation functions
  const validateFirstName = (value: string): { isValid: boolean; message: string } => {
    if (!value.trim()) return { isValid: false, message: 'First name is required' };
    if (value.trim().length < 2) return { isValid: false, message: 'First name must be at least 2 characters' };
    if (value.trim().length > 50) return { isValid: false, message: 'First name must be less than 50 characters' };
    return { isValid: true, message: '' };
  };

  const validateLastName = (value: string): { isValid: boolean; message: string } => {
    if (!value.trim()) return { isValid: false, message: 'Last name is required' };
    if (value.trim().length < 2) return { isValid: false, message: 'Last name must be at least 2 characters' };
    if (value.trim().length > 50) return { isValid: false, message: 'Last name must be less than 50 characters' };
    return { isValid: true, message: '' };
  };

  const validatePhone = (value: string): { isValid: boolean; message: string } => {
    if (value && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/\s/g, ''))) {
      return { isValid: false, message: 'Please enter a valid phone number' };
    }
    return { isValid: true, message: '' };
  };

  const validatePassword = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 8) return { isValid: false, message: 'Password must be at least 8 characters' };
    if (!/[a-z]/.test(password)) return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    if (!/[A-Z]/.test(password)) return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    if (!/[0-9]/.test(password)) return { isValid: false, message: 'Password must contain at least one number' };
    return { isValid: true, message: '' };
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setUserProfile(profile);
        setEditPhone(profile.phone || '');
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Auto-save effect
  useEffect(() => {
    if (editProfileOpen && (editFirstName || editLastName || editPhone)) {
      debouncedAutoSave(editFirstName, editLastName, editPhone);
    }
  }, [editFirstName, editLastName, editPhone, editProfileOpen, debouncedAutoSave]);

  // Password strength effect
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(newPassword));
  }, [newPassword]);

  // Handle Edit Profile
  const handleEditProfile = () => {
    setEditFirstName(userProfile?.first_name || '');
    setEditLastName(userProfile?.last_name || '');
    setEditPhone(userProfile?.phone || '');
    setEditProfileOpen(true);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !userProfile) return;

    // Validate form
    const firstNameValidation = validateFirstName(editFirstName);
    const lastNameValidation = validateLastName(editLastName);
    const phoneValidation = validatePhone(editPhone);

    setValidation(prev => ({
      ...prev,
      firstName: firstNameValidation,
      lastName: lastNameValidation
    }));

    if (!firstNameValidation.isValid || !lastNameValidation.isValid || !phoneValidation.isValid) {
      toast.error('Please fix the validation errors');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      let avatarUrl = userProfile.avatar_url;

      // Upload image if selected
      if (profileImage) {
        const fileExt = profileImage.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, profileImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        avatarUrl = publicUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editFirstName.trim(),
          last_name: editLastName.trim(),
          phone: editPhone.trim(),
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setUserProfile(prev => prev ? {
        ...prev,
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        phone: editPhone.trim(),
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      } : null);

      toast.success('Profile updated successfully!');
      setEditProfileOpen(false);
      setProfileImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setChangePasswordOpen(true);
  };

  const handleUpdatePassword = async () => {
    if (!user) return;

    // Validate passwords
    const currentPasswordValidation = { isValid: !!currentPassword, message: 'Current password is required' };
    const newPasswordValidation = validatePassword(newPassword);
    const confirmPasswordValidation = { 
      isValid: newPassword === confirmPassword, 
      message: 'Passwords do not match' 
    };

    setValidation(prev => ({
      ...prev,
      currentPassword: currentPasswordValidation,
      newPassword: newPasswordValidation,
      confirmPassword: confirmPasswordValidation
    }));

    if (!currentPasswordValidation.isValid || !newPasswordValidation.isValid || !confirmPasswordValidation.isValid) {
      toast.error('Please fix the validation errors');
      return;
    }

    if (newPassword === currentPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setIsChangingPassword(true);
    try {
      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword
      });

      if (signInError) {
        toast.error('Current password is incorrect');
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully!');
      setChangePasswordOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading profile...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">No user found</div>
        </div>
      </Layout>
    );
  }

  // Get user initials from email
  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'instructor':
        return 'Instructor';
      case 'student':
        return 'Student';
      default:
        return 'User';
    }
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'instructor':
        return 'default';
      case 'student':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Layout>
      <div className="px-6 py-4 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account information and preferences
          </p>
        </div>

        {/* Profile Information Card */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Your personal account details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar and Basic Info */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={userProfile?.avatar_url || user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl">
                    {user.email ? getInitials(user.email) : <User className="h-8 w-8" />}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  {userProfile?.first_name && userProfile?.last_name 
                    ? `${userProfile.first_name} ${userProfile.last_name}`
                    : user.user_metadata?.full_name || 'User'}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant={getRoleBadgeVariant(userProfile?.role || 'user')} className="text-xs">
                    {getRoleDisplayName(userProfile?.role || 'user')}
                  </Badge>
                  {userProfile?.phone && (
                    <Badge variant="outline" className="text-xs">
                      <Smartphone className="h-3 w-3 mr-1" />
                      {userProfile.phone}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Account Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-sm text-muted-foreground">
                    {getRoleDisplayName(userProfile?.role || 'user')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-sm text-muted-foreground">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {userProfile?.updated_at ? new Date(userProfile.updated_at).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Account Actions */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Button variant="outline" size="sm" onClick={handleEditProfile} className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleChangePassword} className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings Card */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Manage your account security and privacy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bell className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive notifications about account activity</p>
                </div>
              </div>
              <Switch 
                checked={securitySettings.notificationsEnabled}
                onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, notificationsEnabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Key className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p>
                </div>
              </div>
              <Switch 
                checked={securitySettings.twoFactorEnabled}
                onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Activity className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Session Timeout</p>
                  <p className="text-xs text-muted-foreground">Automatically log out after {securitySettings.sessionTimeout} minutes of inactivity</p>
                </div>
              </div>
              <Select 
                value={securitySettings.sessionTimeout.toString()}
                onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(value) }))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="!max-w-lg w-[90vw] mx-auto rounded-lg">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information and photo
            </DialogDescription>
          </DialogHeader>
          
          {/* Auto-save status */}
          {autoSaveStatus !== 'idle' && (
            <div className={`flex items-center gap-2 p-2 rounded-md text-sm ${
              autoSaveStatus === 'saving' ? 'bg-blue-50 text-blue-700' :
              autoSaveStatus === 'saved' ? 'bg-green-50 text-green-700' :
              'bg-red-50 text-red-700'
            }`}>
              {autoSaveStatus === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}
              {autoSaveStatus === 'saved' && <CheckCircle className="h-4 w-4" />}
              {autoSaveStatus === 'error' && <AlertCircle className="h-4 w-4" />}
              {autoSaveStatus === 'saving' && 'Saving...'}
              {autoSaveStatus === 'saved' && 'Changes saved automatically'}
              {autoSaveStatus === 'error' && 'Failed to save changes'}
            </div>
          )}

          <div className="space-y-6">
            {/* Profile Image Upload */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={imagePreview || userProfile?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl">
                    {user.email ? getInitials(user.email) : <User className="h-8 w-8" />}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={() => document.getElementById('profile-image-upload')?.click()}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <input
                id="profile-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {profileImage && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Image selected: {profileImage.name}
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  className={!validation.firstName.isValid ? 'border-red-500' : ''}
                />
                {!validation.firstName.isValid && (
                  <p className="text-sm text-red-500 mt-1">{validation.firstName.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  placeholder="Enter your last name"
                  className={!validation.lastName.isValid ? 'border-red-500' : ''}
                />
                {!validation.lastName.isValid && (
                  <p className="text-sm text-red-500 mt-1">{validation.lastName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className={!validation.firstName.isValid ? 'border-red-500' : ''}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional - for account recovery and notifications
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="!flex !flex-row !justify-end gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setEditProfileOpen(false);
                setProfileImage(null);
                setImagePreview(null);
              }}
              className="flex-1 sm:flex-none sm:min-w-[80px]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateProfile} 
              disabled={isUpdatingProfile}
              className="flex-1 sm:flex-none sm:min-w-[80px]"
            >
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="!max-w-md w-[90vw] mx-auto rounded-lg">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new password
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password *</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className={!validation.currentPassword.isValid ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {!validation.currentPassword.isValid && (
                <p className="text-sm text-red-500 mt-1">{validation.currentPassword.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="newPassword">New Password *</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className={!validation.newPassword.isValid ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Progress value={passwordStrength} className="flex-1 h-2" />
                    <span className="text-xs text-muted-foreground w-12">
                      {passwordStrength < 25 ? 'Weak' : 
                       passwordStrength < 50 ? 'Fair' : 
                       passwordStrength < 75 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className={`flex items-center gap-1 ${newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className="h-3 w-3" />
                      At least 8 characters
                    </div>
                    <div className={`flex items-center gap-1 ${/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className="h-3 w-3" />
                      Lowercase letter
                    </div>
                    <div className={`flex items-center gap-1 ${/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className="h-3 w-3" />
                      Uppercase letter
                    </div>
                    <div className={`flex items-center gap-1 ${/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className="h-3 w-3" />
                      Number
                    </div>
                  </div>
                </div>
              )}
              
              {!validation.newPassword.isValid && (
                <p className="text-sm text-red-500 mt-1">{validation.newPassword.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className={!validation.confirmPassword.isValid ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {!validation.confirmPassword.isValid && (
                <p className="text-sm text-red-500 mt-1">{validation.confirmPassword.message}</p>
              )}
            </div>
          </div>
          <DialogFooter className="!flex !flex-row !justify-end gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setChangePasswordOpen(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              className="flex-1 sm:flex-none sm:min-w-[80px]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdatePassword} 
              disabled={isChangingPassword}
              className="flex-1 sm:flex-none sm:min-w-[80px]"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Changing...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Profile;
