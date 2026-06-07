import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-navy px-4">
      <div className="w-full max-w-md">
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: "bg-primary hover:opacity-90 transition-all",
              card: "bg-cream border border-gray-100 shadow-xl rounded-xl",
              headerTitle: "font-fraunces text-navy",
              headerSubtitle: "text-gray-600",
              socialButtonsBlockButton: "border border-gray-300 hover:bg-gray-100 transition-all",
              footerActionLink: "text-primary hover:underline",
            }
          }}
        />
      </div>
    </div>
  );
}
