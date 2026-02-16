import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);          // Firebase Auth user
  const [profile, setProfile] = useState(null);     // Firestore user doc
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadProfile(firebaseUser.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function loadProfile(uid) {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      setProfile({ id: snap.id, ...snap.data() });
    }
  }

  async function signIn(email, password) {
    const { user: fbUser } = await signInWithEmailAndPassword(auth, email, password);
    await loadProfile(fbUser.uid);
  }

  async function signUp(email, password, displayName) {
    const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);

    // Set Firebase Auth display name
    await updateProfile(fbUser, { displayName });

    // Create Firestore user profile (first user = admin, rest = member)
    await setDoc(doc(db, 'users', fbUser.uid), {
      email,
      displayName,
      role: 'member',
      createdAt: serverTimestamp(),
    });

    await loadProfile(fbUser.uid);
  }

  async function signOut() {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
  }

  // Helper that pages pass to API calls — combines auth uid + Firestore displayName
  const currentUser = user && profile
    ? { uid: user.uid, displayName: profile.displayName }
    : null;

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      currentUser,
      loading,
      isAdmin,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
