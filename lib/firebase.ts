import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  getDatabase,
  get,
  onValue,
  push,
  ref,
  remove,
  set,
  update,
  type DatabaseReference,
} from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function createFirebaseApp() {
  if (!firebaseConfig.apiKey) {
    throw new Error("Firebase 환경 변수가 설정되지 않았습니다.");
  }
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
  return getApp();
}

export function getFirebaseServices() {
  const app = createFirebaseApp();
  const auth = getAuth(app);
  const db = getDatabase(app);

  return { auth, db };
}

export async function signInWithGoogle() {
  const { auth } = getFirebaseServices();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutUser() {
  const { auth } = getFirebaseServices();
  await signOut(auth);
}

export function observeAuth(callback: (user: User | null) => void) {
  const { auth } = getFirebaseServices();
  return onAuthStateChanged(auth, callback);
}

export function subscribe<T>(
  refBuilder: (
    getRef: (path: string) => DatabaseReference
  ) => DatabaseReference,
  cb: (value: T | null) => void,
  onError?: (error: Error) => void
) {
  const { db } = getFirebaseServices();
  const reference = refBuilder((path: string) => ref(db, path));
  return onValue(
    reference,
    snapshot => {
      cb(snapshot.val() as T | null);
    },
    error => {
      console.error("Firebase 구독 오류", error);
      onError?.(error as unknown as Error);
    }
  );
}

export function createItem<T>(path: string, data: T) {
  const { db } = getFirebaseServices();
  const listRef = ref(db, path);
  return push(listRef, data);
}

export function setItem<T>(path: string, data: T) {
  const { db } = getFirebaseServices();
  const itemRef = ref(db, path);
  return set(itemRef, data);
}

export function updateItem(path: string, data: Record<string, unknown>) {
  const { db } = getFirebaseServices();
  const itemRef = ref(db, path);
  return update(itemRef, data);
}

export function deleteItem(path: string) {
  const { db } = getFirebaseServices();
  const itemRef = ref(db, path);
  return remove(itemRef);
}

export async function readItem<T>(path: string) {
  const { db } = getFirebaseServices();
  const snapshot = await get(ref(db, path));
  if (!snapshot.exists()) {
    return null;
  }
  return snapshot.val() as T;
}

export type FirebaseUser = User;
