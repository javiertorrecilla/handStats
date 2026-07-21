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
} from "firebase/auth";

import { auth } from "../firebase/firebase";
import userService from "../services/userService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guestMatches, setGuestMatches] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (fbUser) => {
        if (!fbUser) {
          setFirebaseUser(null);
          setUser(null);
          setLoading(false);
          return;
        }

        setFirebaseUser(fbUser);

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
      return;
    }

    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        loading,
        guestMatches,
        login,
        register,
        loginWithGoogle,
        loginAsGuest,
        logout,
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