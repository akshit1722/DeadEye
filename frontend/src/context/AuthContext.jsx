import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, isRealFirebase, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from '../firebase.js';

const AuthContext = createContext();

export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('deadeye_user');
    return saved ? JSON.parse(saved) : { uid: 'demo-specialist', email: 'specialist@cyclone-deadeye.org', displayName: 'Commander Gahlawat', role: 'Emergency Specialist', isDemo: true };
  });

  useEffect(() => {
    if (isRealFirebase && auth) {
      const unsub = onAuthStateChanged(auth, (user) => {
        if (user) {
          const u = { uid: user.uid, email: user.email, displayName: user.displayName || user.email.split('@')[0], isDemo: false };
          setCurrentUser(u);
          localStorage.setItem('deadeye_user', JSON.stringify(u));
        } else {
          setCurrentUser(null);
          localStorage.removeItem('deadeye_user');
        }
      });
      return unsub;
    }
  }, []);

  async function login(email, password) {
    if (isRealFirebase && auth) return signInWithEmailAndPassword(auth, email, password);
    const mock = { uid: 'user-' + Date.now(), email, displayName: email.split('@')[0], role: 'researcher', isDemo: true };
    setCurrentUser(mock);
    localStorage.setItem('deadeye_user', JSON.stringify(mock));
    return mock;
  }

  async function signup(email, password) {
    if (isRealFirebase && auth) return createUserWithEmailAndPassword(auth, email, password);
    const mock = { uid: 'user-' + Date.now(), email, displayName: email.split('@')[0], role: 'student', isDemo: true };
    setCurrentUser(mock);
    localStorage.setItem('deadeye_user', JSON.stringify(mock));
    return mock;
  }

  function loginAsDemo(role = 'Disaster Management Specialist') {
    const mock = { uid: 'demo-' + Date.now(), email: 'specialist@cyclone-deadeye.org', displayName: 'Commander Gahlawat', role, isDemo: true };
    setCurrentUser(mock);
    localStorage.setItem('deadeye_user', JSON.stringify(mock));
    return mock;
  }

  async function logout() {
    if (isRealFirebase && auth) await signOut(auth);
    setCurrentUser(null);
    localStorage.removeItem('deadeye_user');
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, signup, loginAsDemo, logout, isRealFirebase }}>
      {children}
    </AuthContext.Provider>
  );
}