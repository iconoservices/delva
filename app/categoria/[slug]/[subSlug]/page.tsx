import { AppProvider } from '@/lib/context/AppContext';
import SubcategoryClient from './SubcategoryClient';

export default function SubcategoryPage() {
  return (
    <AppProvider>
      <SubcategoryClient />
    </AppProvider>
  );
}
