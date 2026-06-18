import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { router } from './router';

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'text-sm font-semibold rounded-xl border border-surface-100 shadow-lg',
          duration: 3000,
        }}
      />
    </AuthProvider>
  );
}
