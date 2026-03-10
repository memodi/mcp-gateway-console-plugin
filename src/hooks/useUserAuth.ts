// custom hook for user authentication and authorization

import { useState, useEffect } from 'react';
import { useActiveNamespace } from '@openshift-console/dynamic-plugin-sdk';

interface UseUserAuthResult {
  token: string | null;
  namespace: string;
  loading: boolean;
  isAdmin: boolean;
}

/**
 * Hook to get user authentication context
 *
 * In OpenShift Console, user tokens are typically available via ServiceAccount
 * tokens or through the console's authentication mechanism.
 *
 * For Phase 1: We'll return null token (no filtering)
 * For Phase 2: Implement actual token retrieval
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { token, namespace } = useUserAuth();
 *
 *   // use token for API calls
 *   const { tools } = useMCPTools(token);
 * }
 * ```
 */
export function useUserAuth(): UseUserAuthResult {
  const [activeNamespace] = useActiveNamespace();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // phase 1: no token-based filtering
    // in phase 2, we would implement actual token retrieval:
    //
    // async function getToken() {
    //   try {
    //     // option 1: get from ServiceAccount token
    //     const response = await fetch('/api/kubernetes/api/v1/namespaces/' +
    //       activeNamespace + '/serviceaccounts/default/token');
    //     const data = await response.json();
    //     setToken(data.token);
    //
    //     // option 2: use console SDK methods if available
    //     // const userToken = await getUserToken();
    //     // setToken(userToken);
    //
    //     // check if user is admin
    //     const adminCheck = await checkAdminStatus(data.token);
    //     setIsAdmin(adminCheck);
    //   } catch (error) {
    //     console.error('Failed to get user token:', error);
    //     setToken(null);
    //   } finally {
    //     setLoading(false);
    //   }
    // }
    //
    // getToken();

    // for now, just complete immediately
    setLoading(false);
  }, [activeNamespace]);

  return {
    token,
    namespace: activeNamespace || 'default',
    loading,
    isAdmin,
  };
}

/**
 * Future: Check if user has admin privileges
 */
async function checkAdminStatus(_token: string): Promise<boolean> {
  // implement admin check via k8s RBAC
  // e.g., check if user can list all MCPServerRegistrations across namespaces
  return false;
}
