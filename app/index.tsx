import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/auth.store';
import { UserRole } from '../lib/types';

export default function Index() {
  const { isAuthenticated, user, hasHydrated } = useAuthStore();

  // Wait for the persisted auth state to load from AsyncStorage before
  // deciding where to redirect — otherwise an already-logged-in user gets
  // bounced to the landing screen on every cold start, since this screen
  // unmounts as soon as it redirects and never gets a chance to re-render
  // once hydration actually finishes.
  if (!hasHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/landing" />;
  }

  // Role-based redirect
  switch (user?.role) {
    case UserRole.SUPER_ADMIN:
    case UserRole.SECRETARY:
    case UserRole.TREASURER:
    case UserRole.IMAM:
      return <Redirect href={"/(admin)/home" as any} />;
    case UserRole.MADRASA_PRINCIPAL:
      return <Redirect href={"/(member)/ustadh" as any} />;
    case UserRole.USTADH:
    case UserRole.PARENT:
      return <Redirect href={"/(member)/home" as any} />;
    case UserRole.STUDENT:
      return <Redirect href={"/(student)/home" as any} />;
    default:
      return <Redirect href={"/(auth)/login" as any} />;
  }
}
