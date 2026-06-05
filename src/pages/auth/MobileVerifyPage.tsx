import { Navigate } from 'react-router-dom';

/** Legacy QR verify URLs — redirect to mobile/email login */
export function MobileVerifyPage() {
  return <Navigate to="/" replace />;
}
