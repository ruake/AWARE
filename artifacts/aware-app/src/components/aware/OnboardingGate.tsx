import { useOnboarding, OnboardingWizard } from "./OnboardingWizard";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { show, dismiss } = useOnboarding();
  return <>{show ? <OnboardingWizard onComplete={dismiss} /> : children}</>;
}
