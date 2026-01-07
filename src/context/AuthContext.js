import React, { createContext, useContext, useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for saved user in localStorage on mount
        const savedUser = localStorage.getItem('ocpUser');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                const userData = {
                    ...data.user,
                    profilePicture: data.user.profile_picture ? `http://localhost:5000${data.user.profile_picture}` : null,
                    registeredAt: data.user.created_at
                };
                setUser(userData);
                localStorage.setItem('ocpUser', JSON.stringify(userData));
                return { success: true, role: userData.role };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            // Fallback to localStorage if server is down
            return loginOffline(email, password);
        }
    };

    // Offline fallback login
    const loginOffline = (email, password) => {
        const registeredUsers = JSON.parse(localStorage.getItem('ocpRegisteredUsers') || '[]');
        const foundUser = registeredUsers.find(
            u => u.email === email && u.password === password
        );

        if (foundUser) {
            const userData = {
                name: foundUser.name,
                email: foundUser.email,
                role: foundUser.role,
                profilePicture: foundUser.profilePicture || null,
                registeredAt: foundUser.registeredAt,
                loginTime: new Date().toISOString()
            };
            setUser(userData);
            localStorage.setItem('ocpUser', JSON.stringify(userData));
            return { success: true, role: userData.role };
        }
        return { success: false, message: 'Invalid email or password.' };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('ocpUser');
    };

    const register = async (userData) => {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: userData.name,
                    email: userData.email,
                    password: userData.password,
                    role: userData.role
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                const newUser = {
                    ...data.user,
                    profilePicture: null,
                    registeredAt: data.user.created_at
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
    const registerOffline = (userData) => {
        const registeredUsers = JSON.parse(localStorage.getItem('ocpRegisteredUsers') || '[]');
        const userExists = registeredUsers.some(u => u.email === userData.email);
        
        if (userExists) {
            return { success: false, message: 'An account with this email already exists.' };
        }
        
        registeredUsers.push({
            name: userData.name,
            email: userData.email,
            password: userData.password,
            role: userData.role,
            profilePicture: '',
            registeredAt: userData.registeredAt
        });
        
        localStorage.setItem('ocpRegisteredUsers', JSON.stringify(registeredUsers));
        
        const loginData = {
            name: userData.name,
            email: userData.email,
            role: userData.role,
            profilePicture: '',
            registeredAt: userData.registeredAt
        };
        setUser(loginData);
        localStorage.setItem('ocpUser', JSON.stringify(loginData));
        
        return { success: true };
    };

    // Role-based permission checks
    const canViewCases = () => user !== null;
    const canCreateCases = () => user && (user.role === 'Admin' || user.role === 'Clerk');
    const canEditCases = () => user && (user.role === 'Admin' || user.role === 'Clerk');
    const canDeleteCases = () => user && user.role === 'Admin';

    const updateUserInfo = async (updateData) => {
        if (!user?.id) {
            // Fallback to localStorage if no user id
            return updateUserInfoOffline(updateData);
        }

        try {
            // Update profile info
            const profileResponse = await fetch(`${API_URL}/user/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: updateData.name, email: updateData.email })
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
                        newPassword: updateData.newPassword
                    })
                });
                
                const passwordData = await passwordResponse.json();
                
                if (!passwordData.success) {
                    return { success: false, message: passwordData.message };
                }
            }

            // Update local state
            const updatedUser = {
                ...user,
                name: profileData.user.name,
                email: profileData.user.email,
                profilePicture: profileData.user.profile_picture ? `http://localhost:5000${profileData.user.profile_picture}` : user.profilePicture
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
    const updateUserInfoOffline = (updateData) => {
        const registeredUsers = JSON.parse(localStorage.getItem('ocpRegisteredUsers') || '[]');
        const userIndex = registeredUsers.findIndex(u => u.email === user.email);
        
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
                (u, index) => u.email === updateData.email && index !== userIndex
            );
            if (emailTaken) {
                return { success: false, message: 'Email is already taken' };
            }
        }

        registeredUsers[userIndex] = {
            ...registeredUsers[userIndex],
            name: updateData.name,
            email: updateData.email,
            profilePicture: updateData.profilePicture !== undefined ? updateData.profilePicture : registeredUsers[userIndex].profilePicture,
            password: updateData.newPassword || registeredUsers[userIndex].password
        };

        localStorage.setItem('ocpRegisteredUsers', JSON.stringify(registeredUsers));

        const updatedUser = {
            ...user,
            name: updateData.name,
            email: updateData.email,
            profilePicture: updateData.profilePicture !== undefined ? updateData.profilePicture : user.profilePicture
        };
        setUser(updatedUser);
        localStorage.setItem('ocpUser', JSON.stringify(updatedUser));

        return { success: true };
    };

    const uploadProfilePicture = async (file) => {
        if (!user?.id) {
            return { success: false, message: 'User not authenticated with database' };
        }

        try {
            const formData = new FormData();
            formData.append('profilePicture', file);

            const response = await fetch(`${API_URL}/user/${user.id}/upload-picture`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                const updatedUser = {
                    ...user,
                    profilePicture: `http://localhost:5000${data.user.profile_picture}`
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

    const removeProfilePicture = async () => {
        if (!user?.id) {
            // Offline fallback
            const updatedUser = { ...user, profilePicture: null };
            setUser(updatedUser);
            localStorage.setItem('ocpUser', JSON.stringify(updatedUser));
            return { success: true };
        }

        try {
            const response = await fetch(`${API_URL}/user/${user.id}/picture`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                const updatedUser = { ...user, profilePicture: null };
                setUser(updatedUser);
                localStorage.setItem('ocpUser', JSON.stringify(updatedUser));
                return { success: true };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Remove picture error:', error);
            const updatedUser = { ...user, profilePicture: null };
            setUser(updatedUser);
            localStorage.setItem('ocpUser', JSON.stringify(updatedUser));
            return { success: true };
        }
    };

    const value = {
        user,
        isLoading,
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
        </AuthContext.Provider>
    );
};

export default AuthContext;
