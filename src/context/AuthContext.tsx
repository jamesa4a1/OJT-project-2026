import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_URL = 'http://localhost:5000/api';

// TypeScript Interfaces
export interface User {
  id?: number;
  name: string;
  email: string;
  role: 'Admin' | 'Staff' | 'Clerk';
  profilePicture?: string | null;
  registeredAt?: string;
  loginTime?: string;
  created_at?: string;
  profile_picture?: string;
}

export interface LoginResult {
  success: boolean;
  role?: string;
  message?: string;
}

export interface RegisterResult {
  success: boolean;
  message?: string;
}

export interface UpdateResult {
  success: boolean;
  message?: string;
}

export interface UploadResult {
  success: boolean;
  user?: User;
  message?: string;
}

export interface UserData {
  name: string;
  email: string;
  password: string;
  role: 'Admin' | 'Staff' | 'Clerk';
  registeredAt?: string;
  profilePicture?: string;
}

export interface UpdateData {
  name: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
  profilePicture?: string | null;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isDeactivated: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  register: (userData: UserData) => Promise<RegisterResult>;
  updateUserInfo: (updateData: UpdateData) => Promise<UpdateResult>;
  uploadProfilePicture: (file: File) => Promise<UploadResult>;
  removeProfilePicture: () => Promise<UpdateResult>;
  canViewCases: () => boolean;
  canCreateCases: () => boolean;
  canEditCases: () => boolean;
  canDeleteCases: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeactivated, setIsDeactivated] = useState<boolean>(false);

  useEffect(() => {
    // Check for saved user in localStorage on mount
    const savedUser = localStorage.getItem('ocpUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  // Real-time account status checker
  useEffect(() => {
    if (!user?.id) return;

    const checkAccountStatus = async (): Promise<void> => {
      try {
        const response = await fetch(`${API_URL}/user/${user.id}/status`);
        const data = await response.json();

        if (data.success && data.isActive === false) {
          setIsDeactivated(true);
        }
      } catch (error) {
        console.error('Error checking account status:', error);
      }
    };

    // Check immediately
    checkAccountStatus();

    // Check every 3 seconds
    const interval = setInterval(checkAccountStatus, 3000);

    return () => clearInterval(interval);
  }, [user?.id]);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        const userData: User = {
          ...data.user,
          profilePicture: data.user.profile_picture
            ? `http://localhost:5000${data.user.profile_picture}`
            : null,
          registeredAt: data.user.created_at,
        };
        setUser(userData);
        localStorage.setItem('ocpUser', JSON.stringify(userData));
        return { success: true, role: userData.role };
      } else {
        return { success: false, message: data.message || 'Invalid email or password.' };
      }
    } catch (error) {
      console.error('Login error:', error);
      // Server is down - show appropriate message
      return {
        success: false,
        message:
          'Cannot connect to server. Please ensure the backend server is running (node server.js).',
      };
    }
  };

  // Offline fallback login
  const loginOffline = (email: string, password: string): LoginResult => {
    const registeredUsers = JSON.parse(localStorage.getItem('ocpRegisteredUsers') || '[]');
    const foundUser = registeredUsers.find(
      (u: any) => u.email === email && u.password === password
    );

    if (foundUser) {
      const userData: User = {
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
        profilePicture: foundUser.profilePicture || null,
        registeredAt: foundUser.registeredAt,
        loginTime: new Date().toISOString(),
      };
      setUser(userData);
      localStorage.setItem('ocpUser', JSON.stringify(userData));
      return { success: true, role: userData.role };
    }
    return { success: false, message: 'Invalid email or password.' };
  };

  const logout = (): void => {
    setUser(null);
    localStorage.removeItem('ocpUser');
  };

  const register = async (userData: UserData): Promise<RegisterResult> => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: userData.role,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const newUser: User = {
          ...data.user,
          profilePicture: null,
          registeredAt: data.user.created_at,
        };
        setUser(newUser);
        localStorage.setItem('ocpUser', JSON.stringify(newUser));
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      // Fallback to localStorage if server is down
      return registerOffline(userData);
    }
  };

  // Offline fallback registration
  const registerOffline = (userData: UserData): RegisterResult => {
    const registeredUsers = JSON.parse(localStorage.getItem('ocpRegisteredUsers') || '[]');
    const userExists = registeredUsers.some((u: any) => u.email === userData.email);

    if (userExists) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    registeredUsers.push({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      profilePicture: '',
      registeredAt: userData.registeredAt,
    });

    localStorage.setItem('ocpRegisteredUsers', JSON.stringify(registeredUsers));

    const loginData: User = {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      profilePicture: '',
      registeredAt: userData.registeredAt,
    };
    setUser(loginData);
    localStorage.setItem('ocpUser', JSON.stringify(loginData));

    return { success: true };
  };

  // Role-based permission checks
  const canViewCases = (): boolean => user !== null;
  const canCreateCases = (): boolean =>
    user !== null && (user.role === 'Admin' || user.role === 'Clerk');
  const canEditCases = (): boolean =>
    user !== null && (user.role === 'Admin' || user.role === 'Clerk');
  const canDeleteCases = (): boolean => user !== null && user.role === 'Admin';

  const updateUserInfo = async (updateData: UpdateData): Promise<UpdateResult> => {
    if (!user?.id) {
      // Fallback to localStorage if no user id
      return updateUserInfoOffline(updateData);
    }

    try {
      // Update profile info
      const profileResponse = await fetch(`${API_URL}/user/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: updateData.name, email: updateData.email }),
      });

      const profileData = await profileResponse.json();

      if (!profileData.success) {
        return { success: false, message: profileData.message };
      }

      // Update password if provided
      if (updateData.newPassword) {
        const passwordResponse = await fetch(`${API_URL}/user/${user.id}/password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPassword: updateData.currentPassword,
            newPassword: updateData.newPassword,
          }),
        });

        const passwordData = await passwordResponse.json();

        if (!passwordData.success) {
          return { success: false, message: passwordData.message };
        }
      }

      // Update local state
      const updatedUser: User = {
        ...user,
        name: profileData.user.name,
        email: profileData.user.email,
        profilePicture: profileData.user.profile_picture
          ? `http://localhost:5000${profileData.user.profile_picture}`
          : user.profilePicture,
      };

      setUser(updatedUser);
      localStorage.setItem('ocpUser', JSON.stringify(updatedUser));

      return { success: true };
    } catch (error) {
      console.error('Update error:', error);
      return updateUserInfoOffline(updateData);
    }
  };

  // Offline fallback update
  const updateUserInfoOffline = (updateData: UpdateData): UpdateResult => {
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const registeredUsers = JSON.parse(localStorage.getItem('ocpRegisteredUsers') || '[]');
    const userIndex = registeredUsers.findIndex((u: any) => u.email === user.email);

    if (userIndex === -1) {
      return { success: false, message: 'User not found' };
    }

    if (updateData.newPassword) {
      if (registeredUsers[userIndex].password !== updateData.currentPassword) {
        return { success: false, message: 'Current password is incorrect' };
      }
    }

    if (updateData.email !== user.email) {
      const emailTaken = registeredUsers.some(
        (u: any, index: number) => u.email === updateData.email && index !== userIndex
      );
      if (emailTaken) {
        return { success: false, message: 'Email is already taken' };
      }
    }

    registeredUsers[userIndex] = {
      ...registeredUsers[userIndex],
      name: updateData.name,
      email: updateData.email,
      profilePicture:
        updateData.profilePicture !== undefined
          ? updateData.profilePicture
          : registeredUsers[userIndex].profilePicture,
      password: updateData.newPassword || registeredUsers[userIndex].password,
    };

    localStorage.setItem('ocpRegisteredUsers', JSON.stringify(registeredUsers));

    const updatedUser: User = {
      ...user,
      name: updateData.name,
      email: updateData.email,
      profilePicture:
        updateData.profilePicture !== undefined ? updateData.profilePicture : user.profilePicture,
    };
    setUser(updatedUser);
    localStorage.setItem('ocpUser', JSON.stringify(updatedUser));

    return { success: true };
  };

  const uploadProfilePicture = async (file: File): Promise<UploadResult> => {
    if (!user?.id) {
      return { success: false, message: 'User not authenticated with database' };
    }

    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await fetch(`${API_URL}/user/${user.id}/upload-picture`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const updatedUser: User = {
          ...user,
          profilePicture: `http://localhost:5000${data.user.profile_picture}`,
        };
        setUser(updatedUser);
        localStorage.setItem('ocpUser', JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Upload error:', error);
      return { success: false, message: 'Failed to upload picture. Server may be offline.' };
    }
  };

  const removeProfilePicture = async (): Promise<UpdateResult> => {
    if (!user?.id) {
      // Offline fallback
      const updatedUser: User = { ...user!, profilePicture: null };
      setUser(updatedUser);
      localStorage.setItem('ocpUser', JSON.stringify(updatedUser));
      return { success: true };
    }

    try {
      const response = await fetch(`${API_URL}/user/${user.id}/picture`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        const updatedUser: User = { ...user, profilePicture: null };
        setUser(updatedUser);
        localStorage.setItem('ocpUser', JSON.stringify(updatedUser));
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Remove picture error:', error);
      const updatedUser: User = { ...user, profilePicture: null };
      setUser(updatedUser);
      localStorage.setItem('ocpUser', JSON.stringify(updatedUser));
      return { success: true };
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isDeactivated,
    login,
    logout,
    register,
    updateUserInfo,
    uploadProfilePicture,
    removeProfilePicture,
    isAuthenticated: !!user,
    canViewCases,
    canCreateCases,
    canEditCases,
    canDeleteCases,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Deactivation Modal */}
      {isDeactivated && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(5px)',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '40px',
              maxWidth: '450px',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <i className="fas fa-user-lock" style={{ fontSize: '40px', color: '#dc2626' }}></i>
            </div>
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '12px',
                color: '#1e293b',
              }}
            >
              Account Deactivated
            </h2>
            <p
              style={{
                fontSize: '16px',
                color: '#64748b',
                marginBottom: '30px',
                lineHeight: '1.6',
              }}
            >
              Your account has been deactivated by an administrator. You no longer have access to
              this system.
            </p>
            <button
              onClick={() => {
                setIsDeactivated(false);
                logout();
                window.location.href = '/login';
              }}
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '14px 32px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) =>
                ((e.target as HTMLButtonElement).style.backgroundColor = '#b91c1c')
              }
              onMouseOut={(e) =>
                ((e.target as HTMLButtonElement).style.backgroundColor = '#dc2626')
              }
            >
              Return to Login
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export default AuthContext;
