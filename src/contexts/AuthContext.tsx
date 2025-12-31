import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Employee } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock data for demo
const MOCK_USERS = [
  { id: '1', name: 'Admin User', email: 'admin@bda.com', password: 'admin123', role: 'admin' as const },
  { id: '2', name: 'John Smith', email: 'john@bda.com', password: 'emp123', role: 'employee' as const },
  { id: '3', name: 'Sarah Wilson', email: 'sarah@bda.com', password: 'emp123', role: 'employee' as const },
];

const INITIAL_EMPLOYEES: Employee[] = [
  { id: '2', name: 'John Smith', email: 'john@bda.com', role: 'employee', isActive: true, createdAt: new Date('2024-01-15'), leadsCount: 45 },
  { id: '3', name: 'Sarah Wilson', email: 'sarah@bda.com', role: 'employee', isActive: true, createdAt: new Date('2024-02-20'), leadsCount: 38 },
  { id: '4', name: 'Mike Johnson', email: 'mike@bda.com', role: 'employee', isActive: true, createdAt: new Date('2024-03-10'), leadsCount: 52 },
  { id: '5', name: 'Emily Davis', email: 'emily@bda.com', role: 'employee', isActive: false, createdAt: new Date('2024-01-05'), leadsCount: 28 },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);

  useEffect(() => {
    const savedUser = localStorage.getItem('bda_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const foundUser = MOCK_USERS.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const employee = employees.find(e => e.email === email);
      if (foundUser.role === 'employee' && employee && !employee.isActive) {
        return false;
      }
      
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('bda_user', JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bda_user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, employees, setEmployees }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
