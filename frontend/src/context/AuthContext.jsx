import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  deleteUser,
} from "firebase/auth";

import { auth } from "../firebase/firebase";
import userService from "../services/userService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guestMatches, setGuestMatches] = useState(0);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (fbUser) => {
        if (!fbUser) {
          setFirebaseUser(null);
          setUser(null);
          setIsEmailVerified(false);
          setLoading(false);
          return;
        }

        setFirebaseUser(fbUser);
        setIsEmailVerified(Boolean(fbUser.emailVerified));

        try {
          const mongoUser =
            await userService.getByFirebaseUid(
              fbUser.uid
            );

          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName:
              fbUser.displayName ||
              mongoUser.name,
            photoURL: fbUser.photoURL,
            ...mongoUser,
          });
        } catch (err) {
          console.log(
            "Usuario aún no creado en Mongo."
          );

          // Si no existe en Mongo, lo creamos automáticamente
          try {
            const mongoUser = await userService.create({
              firebase_uid: fbUser.uid,
              email: fbUser.email,
              name: fbUser.displayName || fbUser.email.split("@")[0],
            });

            setUser({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName:
                fbUser.displayName ||
                mongoUser.name,
              photoURL: fbUser.photoURL,
              ...mongoUser,
            });
          } catch (createErr) {
            console.error("Error creando usuario en Mongo:", createErr);
            setUser({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName:
                fbUser.displayName ||
                fbUser.email,
              role: "coach",
            });
          }
        }

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ==========================
  // LOGIN
  // ==========================

  const login = async (
    email,
    password
  ) => {
    return signInWithEmailAndPassword(
      auth,
      email,
      password
    );
  };

  // ==========================
  // REGISTER
  // ==========================

  const register = async (
    email,
    password,
    name
  ) => {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Enviar correo de verificación inmediatamente
    try {
      await sendEmailVerification(credential.user);
    } catch (verifErr) {
      console.warn("No se pudo enviar el correo de verificación automático:", verifErr);
    }

    // Crear usuario en MongoDB directamente
    const mongoUser = await userService.create({
      firebase_uid: credential.user.uid,
      email: email,
      name: name,
    });

    setUser({
      uid: credential.user.uid,
      email: email,
      displayName: name,
      ...mongoUser,
    });

    return credential;
  };

  // ==========================
  // RECUPERACIÓN DE CONTRASEÑA
  // ==========================

  const resetPassword = async (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // ==========================
  // VERIFICACIÓN DE EMAIL
  // ==========================

  const sendVerificationEmail = async () => {
    const current = auth.currentUser;
    if (!current) {
      throw new Error("No hay usuario autenticado.");
    }
    return sendEmailVerification(current);
  };

  const checkEmailVerified = async () => {
    const current = auth.currentUser;
    if (!current) return false;
    await current.reload();
    const verified = Boolean(current.emailVerified);
    setIsEmailVerified(verified);
    setFirebaseUser(Object.assign(Object.create(Object.getPrototypeOf(current)), current));
    return verified;
  };

  // ==========================
  // GOOGLE
  // ==========================

  const loginWithGoogle =
    async () => {
      const provider =
        new GoogleAuthProvider();

      return signInWithPopup(
        auth,
        provider
      );
    };

  // ==========================
  // INVITADO
  // ==========================

  const loginAsGuest = () => {
    setFirebaseUser(null);
    setIsEmailVerified(true);

    setUser({
      role: "guest",
      displayName: "Invitado",
    });

    setGuestMatches(0);
  };

  const incrementGuestMatches = () => {
    setGuestMatches((prev) => prev + 1);
  };

  // ==========================
  // LOGOUT
  // ==========================

  const logout = async () => {
    if (user?.role === "guest") {
      setUser(null);
      setGuestMatches(0);
      setIsEmailVerified(false);
      return;
    }

    await signOut(auth);
    setIsEmailVerified(false);
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

    const currentFbUser = auth.currentUser;
    const targetUserId = user?._id || user?.firebase_uid || currentFbUser?.uid;

    // 1. Eliminar datos en backend (MongoDB: usuario y partidos en cascada)
    if (targetUserId) {
      try {
        await userService.deleteAccount(targetUserId);
      } catch (err) {
        console.error("Error al eliminar datos de usuario en MongoDB:", err);
      }
    }

    // 2. Eliminar cuenta en Firebase Authentication
    if (currentFbUser) {
      await deleteUser(currentFbUser);
    }

    // 3. Limpiar estado local
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}