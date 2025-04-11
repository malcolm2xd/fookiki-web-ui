import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type User,
  type ConfirmationResult
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '@/config/firebase';

export interface UserProfile {
  phoneNumber?: string;
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  stats: {
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    goalsScored: number;
  };
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const profile = ref<UserProfile | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);
  const confirmationResult = ref<ConfirmationResult | null>(null);
  const recaptchaVerifier = ref<RecaptchaVerifier | null>(null);

  // Initialize auth state listener
  onAuthStateChanged(auth, async (firebaseUser) => {
    loading.value = true;
    user.value = firebaseUser;
    
    if (firebaseUser) {
      // Fetch or create user profile
      const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        profile.value = userDoc.data() as UserProfile;
      } else {
        // Create new profile for first-time users
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'Player',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || undefined,
          stats: {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            goalsScored: 0
          }
        };
        await setDoc(doc(firestore, 'users', firebaseUser.uid), newProfile);
        profile.value = newProfile;
      }
    } else {
      profile.value = null;
    }
    
    loading.value = false;
  });

  // Sign up with email/password
  async function signUp(email: string, password: string, displayName: string) {
    try {
      error.value = null;
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile
      const newProfile: UserProfile = {
        uid: newUser.uid,
        displayName,
        email,
        stats: {
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          goalsScored: 0
        }
      };
      
      await setDoc(doc(firestore, 'users', newUser.uid), newProfile);
      profile.value = newProfile;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    }
  }

  // Sign in with email/password
  async function signIn(email: string, password: string) {
    try {
      error.value = null;
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    }
  }

  // Sign in with Google
  async function signInWithGoogle() {
    try {
      error.value = null;
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    }
  }

  // Sign out
  async function logOut() {
    try {
      error.value = null;
      await signOut(auth);
      profile.value = null;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    }
  }

  // Initialize reCAPTCHA verifier
  async function initRecaptcha(buttonId: string) {
    try {
      if (recaptchaVerifier.value) {
        await recaptchaVerifier.value.clear();
        recaptchaVerifier.value = null;
      }

      const element = document.getElementById(buttonId);
      if (!element) {
        throw new Error(`Button with id ${buttonId} not found`);
      }

      recaptchaVerifier.value = new RecaptchaVerifier(auth, element, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          error.value = 'Security check expired. Please try again.';
        }
      });

      await recaptchaVerifier.value.render();
    } catch (e) {
      error.value = 'Failed to initialize security check. Please try again.';
      throw e;
    }
  }

  // Start phone number verification
  async function startPhoneVerification(phoneNumber: string, buttonId: string) {
    try {
      error.value = null;
      await initRecaptcha(buttonId);
      
      if (!recaptchaVerifier.value) {
        throw new Error('Security check not initialized');
      }

      confirmationResult.value = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaVerifier.value
      );

      return true;
    } catch (e) {
      error.value = (e as Error).message;
      if (recaptchaVerifier.value) {
        recaptchaVerifier.value.clear();
        recaptchaVerifier.value = null;
      }
      return false;
    }
  }

  // Verify phone number with code
  async function verifyPhoneCode(code: string) {
    console.log('Auth store: verifyPhoneCode called with code:', code);
    try {
      error.value = null;
      console.log('Auth store: checking confirmationResult.value:', !!confirmationResult.value);
      if (!confirmationResult.value) {
        error.value = 'No verification in progress. Please request a new code.';
        return false;
      }

      if (!code || code.length !== 6) {
        error.value = 'Please enter a valid 6-digit code';
        return false;
      }

      console.log('Auth store: attempting to confirm code');
      const result = await confirmationResult.value.confirm(code);
      console.log('Auth store: code confirmed successfully');
      user.value = result.user;

      // Create user profile if it doesn't exist
      const userDoc = await getDoc(doc(firestore, 'users', result.user.uid));
      if (!userDoc.exists()) {
        const newProfile: UserProfile = {
          uid: result.user.uid,
          displayName: result.user.phoneNumber || 'Player',
          email: '',
          phoneNumber: result.user.phoneNumber || '',
          stats: {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            goalsScored: 0
          }
        };
        await setDoc(doc(firestore, 'users', result.user.uid), newProfile);
        profile.value = newProfile;
      }

      return true;
    } catch (e) {
      error.value = (e as Error).message;
      return false;
    }
  }

  return {
    user,
    profile,
    loading,
    error,
    startPhoneVerification,
    verifyPhoneCode,
    logOut
  };
});
