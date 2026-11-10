import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  db,
} from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'owner' | 'seller' | 'staff' | 'admin';
  loginMethod: 'google' | 'pin';
}

interface AuthContextType {
  currentUser: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authorizedEmails: string[];
  addAuthorizedEmail: (email: string) => boolean;
  removeAuthorizedEmail: (email: string) => boolean;
  storePin: string;
  updateStorePin: (newPin: string) => boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithPin: (pin: string) => boolean;
  logout: () => Promise<void>;
  authError: string | null;
  clearError: () => void;
  isOwner: boolean;
}

const STORE_PIN_SESSION_KEY = 'shopee_store_pin_session';
const STORE_PIN_STORAGE_KEY = 'shopee_store_custom_pin';
const AUTHORIZED_EMAILS_STORAGE_KEY = 'shopee_authorized_emails';

// Owner primary verified email
export const PRIMARY_OWNER_EMAIL = 'tropiscyber@gmail.com';
export const DEFAULT_SECURE_PIN = '171945';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Load authorized emails list from localStorage
  const [authorizedEmails, setAuthorizedEmails] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(AUTHORIZED_EMAILS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.includes(PRIMARY_OWNER_EMAIL)) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return [PRIMARY_OWNER_EMAIL];
  });

  // Load custom store PIN from localStorage
  const [storePin, setStorePin] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORE_PIN_STORAGE_KEY);
      if (stored && stored.length >= 4) {
        return stored;
      }
    } catch {
      // fallback
    }
    return DEFAULT_SECURE_PIN;
  });

  // Save authorized emails
  const saveAuthorizedEmails = (emails: string[]) => {
    setAuthorizedEmails(emails);
    try {
      localStorage.setItem(AUTHORIZED_EMAILS_STORAGE_KEY, JSON.stringify(emails));
    } catch (err) {
      console.warn('Failed to save authorized emails to storage:', err);
    }
  };

  // Add staff email to whitelist
  const addAuthorizedEmail = (email: string): boolean => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return false;
    if (authorizedEmails.includes(cleanEmail)) return true;

    const updated = [...authorizedEmails, cleanEmail];
    saveAuthorizedEmails(updated);
    return true;
  };

  // Remove staff email
  const removeAuthorizedEmail = (email: string): boolean => {
    const cleanEmail = email.trim().toLowerCase();
    // Cannot remove primary owner
    if (cleanEmail === PRIMARY_OWNER_EMAIL.toLowerCase()) {
      setAuthError('Email pemilik utama (tropiscyber@gmail.com) tidak dapat dihapus.');
      return false;
    }
    const updated = authorizedEmails.filter((e) => e.toLowerCase() !== cleanEmail);
    saveAuthorizedEmails(updated);
    return true;
  };

  // Update store PIN
  const updateStorePin = (newPin: string): boolean => {
    const cleanPin = newPin.trim();
    if (cleanPin.length < 4 || cleanPin.length > 10) {
      setAuthError('PIN harus terdiri dari 4 sampai 10 digit.');
      return false;
    }
    setStorePin(cleanPin);
    try {
      localStorage.setItem(STORE_PIN_STORAGE_KEY, cleanPin);
    } catch (err) {
      console.warn('Failed to save PIN:', err);
    }
    return true;
  };

  // Check if an email is authorized
  const checkIsAuthorized = (email: string | null): boolean => {
    if (!email) return false;
    const lower = email.toLowerCase();
    if (lower === PRIMARY_OWNER_EMAIL.toLowerCase()) return true;
    return authorizedEmails.some((e) => e.toLowerCase() === lower);
  };

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Enforce Strict Whitelist Check
        if (!checkIsAuthorized(user.email)) {
          // Reject unauthorized user immediately
          await signOut(auth);
          setCurrentUser(null);
          setProfile(null);
          sessionStorage.removeItem(STORE_PIN_SESSION_KEY);
          setAuthError(
            `Akses Ditolak: Email (${user.email}) belum terdaftar sebagai pemilik atau staf toko berwenang. Hubungi ${PRIMARY_OWNER_EMAIL}.`
          );
          setIsLoading(false);
          return;
        }

        // User is authorized
        setCurrentUser(user);
        const isOwner = user.email?.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase();
        const userProf: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || (isOwner ? 'Pemilik Toko Shopee' : 'Staf Toko'),
          photoURL: user.photoURL,
          role: isOwner ? 'owner' : 'staff',
          loginMethod: 'google',
        };
        setProfile(userProf);

        // Sync to Firestore
        try {
          await setDoc(
            doc(db, 'users', user.uid),
            {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || userProf.displayName,
              photoURL: user.photoURL || null,
              role: userProf.role,
              lastLoginAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn('Firestore sync notice:', err);
        }
      } else {
        // Check if PIN session exists in sessionStorage
        const pinSession = sessionStorage.getItem(STORE_PIN_SESSION_KEY);
        if (pinSession === 'authenticated') {
          setCurrentUser(null);
          setProfile({
            uid: 'pin-seller-admin',
            email: PRIMARY_OWNER_EMAIL,
            displayName: 'Admin Toko (PIN 171945)',
            photoURL: null,
            role: 'owner',
            loginMethod: 'pin',
          });
        } else {
          setCurrentUser(null);
          setProfile(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [authorizedEmails]);

  // Google Login
  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user?.email;

      if (!checkIsAuthorized(email)) {
        await signOut(auth);
        setAuthError(
          `Akses Ditolak: Email (${email}) belum terdaftar. Hanya akun ${PRIMARY_OWNER_EMAIL} atau staf terdaftar yang diizinkan.`
        );
        return;
      }
    } catch (err: any) {
      const errorCode = err?.code || '';
      if (
        errorCode === 'auth/popup-closed-by-user' ||
        errorCode === 'auth/cancelled-popup-request'
      ) {
        setAuthError('Jendela login Google ditutup. Anda juga dapat masuk dengan PIN toko.');
        return;
      }

      if (errorCode === 'auth/popup-blocked') {
        setAuthError('Jendela popup login terblokir browser. Harap izinkan popup atau gunakan PIN toko.');
        return;
      }

      if (errorCode === 'auth/network-request-failed') {
        setAuthError('Koneksi internet bermasalah. Periksa jaringan Anda atau gunakan PIN toko.');
        return;
      }

      setAuthError(err?.message || 'Gagal masuk dengan akun Google. Silakan coba lagi atau gunakan PIN toko.');
    }
  };

  // PIN Login with the user's requested PIN 171945
  const loginWithPin = (pinInput: string): boolean => {
    setAuthError(null);
    const validPin = storePin || DEFAULT_SECURE_PIN;
    if (pinInput.trim() === validPin) {
      sessionStorage.setItem(STORE_PIN_SESSION_KEY, 'authenticated');
      setProfile({
        uid: 'pin-seller-admin',
        email: PRIMARY_OWNER_EMAIL,
        displayName: 'Admin Toko (Akses PIN)',
        photoURL: null,
        role: 'owner',
        loginMethod: 'pin',
      });
      return true;
    } else {
      setAuthError('PIN Keamanan Toko salah. Harap masukkan 6 digit PIN toko yang valid.');
      return false;
    }
  };

  // Logout
  const logout = async () => {
    sessionStorage.removeItem(STORE_PIN_SESSION_KEY);
    setProfile(null);
    setCurrentUser(null);
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out notice:', err);
    }
  };

  const clearError = () => setAuthError(null);

  const isAuthenticated = Boolean(currentUser || profile);
  const isOwner =
    profile?.role === 'owner' ||
    profile?.email?.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase();

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        isAuthenticated,
        isLoading,
        authorizedEmails,
        addAuthorizedEmail,
        removeAuthorizedEmail,
        storePin,
        updateStorePin,
        loginWithGoogle,
        loginWithPin,
        logout,
        authError,
        clearError,
        isOwner,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
