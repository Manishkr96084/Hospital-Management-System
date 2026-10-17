import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { hospitalService } from '../services/hospitalService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Preset demo accounts mapping
const DEMO_ACCOUNTS: Record<UserRole, { email: string; pass: string }> = {
  ADMIN: { email: 'admin@medivanta.health', pass: 'Password123!' },
  DOCTOR: { email: 'doctor.smith@medivanta.health', pass: 'Password123!' },
  NURSE: { email: 'nurse.emily@medivanta.health', pass: 'Password123!' },
  RECEPTIONIST: { email: 'reception.clara@medivanta.health', pass: 'Password123!' },
  LAB_STAFF: { email: 'lab.marcus@medivanta.health', pass: 'Password123!' },
  PHARMACIST: { email: 'pharmacy.david@medivanta.health', pass: 'Password123!' },
  BILLING_STAFF: { email: 'billing.sophia@medivanta.health', pass: 'Password123!' },
  PATIENT: { email: 'patient.john@medivanta.health', pass: 'Password123!' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('medivanta_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('medivanta_token');
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('medivanta_token');
      if (savedToken) {
        try {
          const profile = await hospitalService.getMe();
          setUser(profile);
          localStorage.setItem('medivanta_user', JSON.stringify(profile));
        } catch (err) {
          localStorage.removeItem('medivanta_token');
          localStorage.removeItem('medivanta_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await hospitalService.login(email, password);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('medivanta_token', data.access_token);
    localStorage.setItem('medivanta_user', JSON.stringify(data.user));
  };

  const register = async (regData: any) => {
    const data = await hospitalService.register(regData);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('medivanta_token', data.access_token);
    localStorage.setItem('medivanta_user', JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('medivanta_token');
    localStorage.removeItem('medivanta_user');
  };

  const switchRole = async (role: UserRole) => {
    const creds = DEMO_ACCOUNTS[role];
    if (creds) {
      await login(creds.email, creds.pass);
    }
  };

  const hasRole = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, switchRole, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
