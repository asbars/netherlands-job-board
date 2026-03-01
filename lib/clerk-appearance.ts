import { Appearance } from '@clerk/types';

/**
 * Clerk appearance configuration matching shadcn/ui theme
 * Uses CSS variables defined in globals.css
 */
export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: '#D4603A', // terracotta orange matching landing page
    colorBackground: 'hsl(0 0% 100%)', // --background
    colorInputBackground: 'hsl(0 0% 100%)', // --background
    colorInputText: 'hsl(0 0% 3.9%)', // --foreground
    colorText: 'hsl(0 0% 3.9%)', // --foreground
    colorTextSecondary: 'hsl(0 0% 45.1%)', // --muted-foreground
    colorDanger: 'hsl(0 84.2% 60.2%)', // --destructive
    colorSuccess: 'hsl(0 0% 9%)',
    borderRadius: '0.5rem', // --radius
    fontFamily: 'inherit',
  },
  elements: {
    // Root modal/card styling
    rootBox: 'font-sans',
    card: 'bg-card shadow-lg rounded-lg border border-border',

    // Modal overlay
    modalBackdrop: 'bg-black/50',
    modalContent: 'bg-card shadow-xl rounded-lg border border-border',

    // Headers
    headerTitle: 'text-foreground font-semibold',
    headerSubtitle: 'text-muted-foreground',

    // Form elements
    formButtonPrimary:
      'bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors',
    formButtonReset:
      'text-muted-foreground hover:text-foreground',
    formFieldInput:
      'bg-background border-input text-foreground rounded-md focus:ring-ring focus:ring-2 focus:ring-offset-2',
    formFieldLabel: 'text-foreground font-medium',

    // Identity/Profile preview
    identityPreviewText: 'text-foreground',
    identityPreviewEditButton: 'text-muted-foreground hover:text-foreground',

    // Footer links
    footerActionLink: 'text-primary hover:text-primary/80 font-medium',
    footerActionText: 'text-muted-foreground',

    // User button (avatar dropdown)
    userButtonPopoverCard: 'bg-card border border-border shadow-lg',
    userButtonPopoverActionButton:
      'text-foreground hover:bg-secondary rounded-md transition-colors',
    userButtonPopoverActionButtonText: 'text-foreground',
    userButtonPopoverActionButtonIcon: 'text-muted-foreground',
    userButtonPopoverFooter: 'hidden', // Hide "Secured by Clerk" footer

    // Avatar
    avatarBox: 'rounded-full ring-2 ring-border',
    avatarImage: 'rounded-full',

    // Badges/Tags
    badge: 'bg-secondary text-secondary-foreground',

    // Alerts
    alertText: 'text-foreground',

    // Dividers
    dividerLine: 'bg-border',
    dividerText: 'text-muted-foreground',
  },
};

/**
 * UserButton-specific appearance for consistent styling across app
 */
export const userButtonAppearance: Appearance = {
  variables: {
    colorPrimary: '#D4603A', // terracotta orange matching landing page
    colorText: 'hsl(0 0% 3.9%)', // --foreground
    colorTextSecondary: 'hsl(0 0% 45.1%)', // --muted-foreground
    borderRadius: '0.5rem',
  },
  elements: {
    avatarBox: 'w-10 h-10 rounded-full ring-2 ring-border hover:ring-primary/20 transition-all',
    userButtonPopoverCard: 'bg-card border border-border shadow-lg rounded-lg',
    userButtonPopoverActionButton:
      'text-foreground hover:bg-secondary rounded-md transition-colors',
    userButtonPopoverActionButtonText: 'text-foreground font-medium',
    userButtonPopoverActionButtonIcon: 'text-muted-foreground',
    userButtonPopoverFooter: 'hidden',
  },
};
