import { useUsers } from "./use-users-api";
import { useThemes } from "./use-themes-api";
import { useBuckets } from "./use-buckets-api";
import { useStocks } from "./use-stocks-api";
import { useAuth } from "@/contexts/AuthContext";

export interface DashboardStats {
  userCount: number;
  themeCount: number;
  bucketCount: number;
  stockCount: number;
  isLoading: boolean;
  errors: {
    users?: Error;
    themes?: Error;
    buckets?: Error;
    stocks?: Error;
  };
}

export function useDashboardStats(): DashboardStats {
  const { userRole } = useAuth();

  // Only fetch users if user is admin
  const usersQuery = useUsers();
  const themesQuery = useThemes();
  const bucketsQuery = useBuckets();
  // Fetch minimal data (page 1, limit 1) since we only need the total count
  const stocksQuery = useStocks(1, 1);

  return {
    userCount: userRole === 'admin' ? (usersQuery.data?.users?.length ?? 0) : 0,
    themeCount: themesQuery.data?.total ?? 0,
    bucketCount: bucketsQuery.data?.total ?? 0,
    stockCount: stocksQuery.data?.total ?? 0,
    isLoading:
      (userRole === 'admin' && usersQuery.isLoading) ||
      themesQuery.isLoading ||
      bucketsQuery.isLoading ||
      stocksQuery.isLoading,
    errors: {
      users: usersQuery.error instanceof Error ? usersQuery.error : undefined,
      themes: themesQuery.error instanceof Error ? themesQuery.error : undefined,
      buckets: bucketsQuery.error instanceof Error ? bucketsQuery.error : undefined,
      stocks: stocksQuery.error instanceof Error ? stocksQuery.error : undefined,
    },
  };
}
