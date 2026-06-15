import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SignUpPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-md">
        <SignUp
          forceRedirectUrl="/dashboard"
          fallbackRedirectUrl="/dashboard"
          appearance={{
            elements: {
              formButtonPrimary: "bg-primary hover:opacity-90 transition-all",
              card: "bg-cream border border-gray-100 shadow-xl rounded-xl",
              headerTitle: "font-fraunces text-navy",
              headerSubtitle: "text-gray-600",
              socialButtonsBlockButton: "border border-gray-300 hover:bg-gray-100 transition-all",
              footerActionLink: "text-primary hover:underline",
            },
          }}
        />
      </div>
    </div>
  );
}
