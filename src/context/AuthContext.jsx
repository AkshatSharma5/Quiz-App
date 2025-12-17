import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Create user profile in Firestore
  const createUserProfile = async (userId, data) => {
    const userRef = doc(db, 'users', userId);
    const defaultProfile = {
      displayName: data.displayName || 'Quiz Master',
      email: data.email,
      photoURL: data.photoURL || null,
      createdAt: serverTimestamp(),
      totalQuizzes: 0,
      totalScore: 0,
      correctAnswers: 0,
      totalQuestions: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastPlayedAt: null,
      xp: 0,
      level: 1,
      achievements: [],
      badges: [],
      quizzesCreated: 0,
      favoriteCategories: []
    };
    await setDoc(userRef, defaultProfile, { merge: true });
    return defaultProfile;
  };

  // Get user profile from Firestore
  const getUserProfile = async (userId) => {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  };

  // Update user profile
  const updateUserProfile = async (userId, data) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, data);
    const updatedProfile = await getUserProfile(userId);
    setUserProfile(updatedProfile);
    return updatedProfile;
  };

  // Update quiz stats after completing a quiz
  const updateQuizStats = async (quizResult) => {
    if (!user) return;
    
    const userRef = doc(db, 'users', user.uid);
    const today = new Date().toDateString();
    const profile = await getUserProfile(user.uid);
    
    // Calculate streak
    let newStreak = 1;
    if (profile.lastPlayedAt) {
      const lastPlayed = new Date(profile.lastPlayedAt.toDate()).toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (lastPlayed === yesterday) {
        newStreak = profile.currentStreak + 1;
      } else if (lastPlayed === today) {
        newStreak = profile.currentStreak;
      }
    }

    const longestStreak = Math.max(newStreak, profile.longestStreak || 0);
    
    // Calculate XP gained
    const xpGained = quizResult.score + (quizResult.correctAnswers * 10);
    const newXP = (profile.xp || 0) + xpGained;
    const newLevel = Math.floor(newXP / 500) + 1;

    await updateDoc(userRef, {
      totalQuizzes: increment(1),
      totalScore: increment(quizResult.score),
      correctAnswers: increment(quizResult.correctAnswers),
      totalQuestions: increment(quizResult.totalQuestions),
      currentStreak: newStreak,
      longestStreak: longestStreak,
      lastPlayedAt: serverTimestamp(),
      xp: newXP,
      level: newLevel
    });

    const updatedProfile = await getUserProfile(user.uid);
    setUserProfile(updatedProfile);
    
    return { xpGained, newLevel, newStreak };
  };

  // Register with email/password
  const register = async (email, password, displayName) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    await createUserProfile(result.user.uid, {
      displayName,
      email: result.user.email
    });
    return result;
  };

  // Sign in with email/password
  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Sign in with Google
  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const profile = await getUserProfile(result.user.uid);
    if (!profile) {
      await createUserProfile(result.user.uid, {
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL
      });
    }
    return result;
  };

  // Sign out
  const logout = async () => {
    setUserProfile(null);
    return signOut(auth);
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        if (profile) {
          setUserProfile(profile);
        } else {
          // Create profile if doesn't exist (for existing Firebase users)
          const newProfile = await createUserProfile(currentUser.uid, {
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL
          });
          setUserProfile(newProfile);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    register,
    login,
    loginWithGoogle,
    logout,
    updateUserProfile,
    updateQuizStats,
    getUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
