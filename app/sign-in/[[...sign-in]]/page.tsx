import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-card shadow-lg rounded-lg border border-border',
            headerTitle: 'text-foreground',
            headerSubtitle: 'text-muted-foreground',
            socialButtonsBlockButton: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
            formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90',
            formFieldInput: 'bg-background border-border text-foreground',
            footerActionLink: 'text-primary hover:text-primary/90',
          },
        }}
      />
    </div>
  );
}
