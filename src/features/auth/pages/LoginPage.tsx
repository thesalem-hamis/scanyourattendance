import { LoginForm } from '../components/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_NAME } from '@/config/constants';

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{APP_NAME}</CardTitle>
          <CardDescription>Staff sign in</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}