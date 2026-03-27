import { AppProvider } from '@/lib/context/AppContext';
import CategoryClient from './CategoryClient';

export default function CategoryPage() {
  return (
    <AppProvider>
      <CategoryClient />
    </AppProvider>
  );
}
