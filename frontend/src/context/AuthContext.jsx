import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  deleteUser,
} from "firebase/auth";

import { auth } from "../firebase/firebase";
import i18n from "../i18n/i18n";
import userService from "../services/userService";
import authEmailService from "../services/authEmailService";
import { trackEvent } from "../services/analyticsService";
import { captureError } from "../services/errorTrackingService";
import { toast } from "./ToastContext";

const AuthContext = createContext();

const SESSION_TOKEN_KEY = "hs_auth_token";

function getCurrentAuthLang() {
  return (i18n.language || "es").slice(0, 2);
}

function getStoredToken() {
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
  } catch {}
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guestMatches, setGuestMatches] = useState(0);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    let mounted = true;
    const savedToken = getStoredToken();

    const restorePromise = savedToken
      ? authEmailService
          .getMe(savedToken)
          .then((me) => {
            if (!mounted || !me) return false;
            setFirebaseUser(null);
            setUser({
              uid: me.uid || me.firebase_uid || me._id,
              ...me,
            });
            setIsEmailVerified(Boolean(me.email_verified));
            setLoading(false);
            return true;
          })
          .catch((err) => {
            if (err?.status === 401 || err?.code === "invalid_session_token" || err?.code === "session_expired") {
              saveStoredToken(null);
            }
            return false;
          })
      : Promise.resolve(false);

    if (!auth) {
      restorePromise.finally(() => {
        if (mounted) setLoading(false);
      });
      return () => {
        mounted = false;
      };
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (fbUser) => {
        const hasIndependent = await restorePromise;
        if (!mounted) return;

        // Si hay sesión independiente activa y no viene sesión Google/Firebase, no pisar estado
        if (hasIndependent && !fbUser) {
          return;
        }

        if (!fbUser) {
          if (!getStoredToken()) {
            setFirebaseUser(null);
            setUser(null);
            setIsEmailVerified(false);
          }
          setLoading(false);
          return;
        }

        // Mantener soporte completo para Google Sign-In mediante Firebase Auth
        setFirebaseUser(fbUser);
        setIsEmailVerified(Boolean(fbUser.emailVerified));

        try {
          const mongoUser = await userService.getByFirebaseUid(fbUser.uid);

          if (!mounted) return;
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || mongoUser.name,
            photoURL: fbUser.photoURL,
            ...mongoUser,
          });
        } catch {
          try {
            const mongoUser = await userService.create({
              firebase_uid: fbUser.uid,
              email: fbUser.email,
              name: fbUser.displayName || fbUser.email.split("@")[0],
            });

            if (!mounted) return;
            setUser({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName || mongoUser.name,
              photoURL: fbUser.photoURL,
              ...mongoUser,
            });
          } catch (createErr) {
            console.error("Error creando usuario en Mongo:", createErr);
            if (!mounted) return;
            setUser({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName || fbUser.email,
              role: "coach",
            });
          }
        }

        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // ==========================
  // LOGIN INDEPENDIENTE (+ migración automática de cuentas previas)
  // ==========================

  const login = async (email, password) => {
    try {
      const res = await authEmailService.loginIndependent({ email, password });
      saveStoredToken(res.token);
      setFirebaseUser(null);
      setUser({
        uid: res.user.uid || res.user.firebase_uid || res.user._id,
        ...res.user,
      });
      setIsEmailVerified(Boolean(res.user.email_verified));
      trackEvent("login", { method: "email" });
      return res;
    } catch (err) {
      if (err?.code !== "auth/legacy-firebase-account") {
        throw err;
      }

      if (!auth) {
        throw err;
      }
      // Migración única de cuentas antiguas creadas previamente con Firebase
      const fbCred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await fbCred.user.getIdToken();
      const migrated = await authEmailService.migrateLegacyAccount({
        email,
        password,
        firebase_id_token: idToken,
      });
      try {
        await signOut(auth);
      } catch {}

      saveStoredToken(migrated.token);
      setFirebaseUser(null);
      setUser({
        uid: migrated.user.uid || migrated.user.firebase_uid || migrated.user._id,
        ...migrated.user,
      });
      setIsEmailVerified(Boolean(migrated.user.email_verified));
      return migrated;
    }
  };

  // ==========================
  // REGISTER INDEPENDIENTE (SIN FIREBASE EMAIL)
  // ==========================

  const register = async (email, password, name) => {
    const lang = getCurrentAuthLang();
    const origin = typeof window !== "undefined" ? window.location.origin : undefined;

    const res = await authEmailService.registerIndependent({
      name,
      email,
      password,
      lang,
      origin,
    });

    saveStoredToken(res.token);
    setFirebaseUser(null);
    setUser({
      uid: res.user.uid || res.user.firebase_uid || res.user._id,
      ...res.user,
    });
    setIsEmailVerified(Boolean(res.user.email_verified));

    if (res.email_sent === false && res.email_error) {
      toast.warning(res.email_error);
    }

    trackEvent("sign_up", { method: "email" });
    return res;
  };

  // ==========================
  // RECUPERACIÓN DE CONTRASEÑA INDEPENDIENTE
  // ==========================

  const resetPassword = async (email) => {
    const lang = getCurrentAuthLang();
    const origin = typeof window !== "undefined" ? window.location.origin : undefined;

    const result = await authEmailService.sendPasswordResetEmail({
      email,
      lang,
      origin,
    });
    trackEvent("password_reset_requested");
    return result;
  };

  // ==========================
  // VERIFICACIÓN DE EMAIL INDEPENDIENTE
  // ==========================

  const sendVerificationEmail = async () => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Inicia sesión con tu correo y contraseña para reenviar la verificación personalizada.");
    }

    const lang = getCurrentAuthLang();
    const origin = typeof window !== "undefined" ? window.location.origin : undefined;

    const result = await authEmailService.sendVerificationEmail({
      token,
      name: user?.name || user?.displayName,
      lang,
      origin,
    });
    trackEvent("email_verification_resent");
    return result;
  };

  const checkEmailVerified = async () => {
    const token = getStoredToken();
    if (token) {
      const me = await authEmailService.getMe(token);
      const verified = Boolean(me?.email_verified);
      if (me) {
        setUser({
          uid: me.uid || me.firebase_uid || me._id,
          ...me,
        });
      }
      setIsEmailVerified(verified);
      return verified;
    }

    if (!auth) return false;
    const current = auth.currentUser;
    if (!current) return false;
    await current.reload();
    const verified = Boolean(current.emailVerified);
    setIsEmailVerified(verified);
    setFirebaseUser(Object.assign(Object.create(Object.getPrototypeOf(current)), current));
    return verified;
  };

  // ==========================
  // GOOGLE SIGN-IN
  // ==========================

  const loginWithGoogle = async () => {
    if (!auth) {
      const cfgErr = new Error("Firebase Auth no configurado (VITE_FIREBASE_API_KEY requerida).");
      captureError(cfgErr, { source: "auth_google" });
      throw cfgErr;
    }
    saveStoredToken(null);
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    trackEvent("login", { method: "google" });
    return cred;
  };

  // ==========================
  // INVITADO
  // ==========================

  const loginAsGuest = () => {
    saveStoredToken(null);
    setFirebaseUser(null);
    setIsEmailVerified(true);

    setUser({
      role: "guest",
      displayName: "Invitado",
    });

    setGuestMatches(0);
    trackEvent("login", { method: "guest" });
  };

  const incrementGuestMatches = () => {
    setGuestMatches((prev) => prev + 1);
  };

  const updateUserDashboardPreferences = (prefs) => {
    setUser((prev) => (prev ? { ...prev, dashboard_preferences: prefs } : prev));
  };

  // ==========================
  // LOGOUT
  // ==========================

  const logout = async () => {
    trackEvent("logout", { role: user?.role || "coach" });
    saveStoredToken(null);

    if (user?.role === "guest") {
      setUser(null);
      setGuestMatches(0);
      setIsEmailVerified(false);
      return;
    }

    setFirebaseUser(null);
    setUser(null);
    setIsEmailVerified(false);
    try {
      if (auth?.currentUser) {
        await signOut(auth);
      }
    } catch {}
  };

  // ==========================
  // ELIMINAR CUENTA (RGPD)
  // ==========================

  const deleteAccount = async () => {
    if (user?.role === "guest") {
      setUser(null);
      setGuestMatches(0);
      setIsEmailVerified(false);
      try {
        localStorage.removeItem("hs_guest_matches");
      } catch {}
      return { success: true };
    }

    const currentFbUser = auth?.currentUser || null;
    const targetUserId = user?._id || user?.firebase_uid || currentFbUser?.uid;

    if (targetUserId) {
      try {
        await userService.deleteAccount(targetUserId);
      } catch (err) {
        captureError(err, { source: "delete_account_mongo" });
      }
    }

    if (currentFbUser) {
      try {
        await deleteUser(currentFbUser);
      } catch (fbDelErr) {
        console.warn("No se pudo eliminar sesión Firebase:", fbDelErr);
      }
    }

    saveStoredToken(null);
    setFirebaseUser(null);
    setUser(null);
    setIsEmailVerified(false);
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        loading,
        guestMatches,
        isEmailVerified,
        login,
        register,
        resetPassword,
        sendVerificationEmail,
        checkEmailVerified,
        loginWithGoogle,
        loginAsGuest,
        logout,
        deleteAccount,
        incrementGuestMatches,
        updateUserDashboardPreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
