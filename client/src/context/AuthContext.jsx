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

// Master admin username — gets admin role on signup automatically
const MASTER_ADMIN = 'theodorelockheart';

// We use username@riverside.ranch as a fake email for Firebase Auth
// Users never see this — they only interact with their username
function usernameToEmail(username) {
  return `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@riverside.ranch`;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
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

  async function signIn(username, password) {
    const email = usernameToEmail(username);
    const { user: fbUser } = await signInWithEmailAndPassword(auth, email, password);
    await loadProfile(fbUser.uid);
  }

  async function signUp(username, characterName, password) {
    const email = usernameToEmail(username);
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');

    const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(fbUser, { displayName: characterName });

    // Master admin gets admin role, everyone else starts as guest until promoted
    const role = cleanUsername === MASTER_ADMIN ? 'admin' : 'guest';

    await setDoc(doc(db, 'users', fbUser.uid), {
      username: cleanUsername,
      characterName,
      displayName: characterName,
      role,
      createdAt: serverTimestamp(),
    });

    await loadProfile(fbUser.uid);
  }

  async function signOut() {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
  }

  const currentUser = user && profile
    ? { uid: user.uid, displayName: profile.characterName || profile.displayName }
    : null;

  const isAdmin = profile?.role === 'admin';
  const isGuest = profile?.role === 'guest';

  return (
    <AuthContext.Provider value={{
      user, profile, currentUser, loading, isAdmin, isGuest,
      signIn, signUp, signOut,
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
