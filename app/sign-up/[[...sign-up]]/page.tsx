import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Save job filters and get personalized alerts
          </p>
        </div>
        <SignUp
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
              identityPreviewText: 'text-foreground',
              identityPreviewEditButton: 'text-muted-foreground',
            },
          }}
        />
      </div>
    </div>
  );
}
