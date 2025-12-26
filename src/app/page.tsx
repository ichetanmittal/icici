import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            ICICI Trade Finance Platform
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Manage your trade finance operations with exporters, importers, Gift IBU funders, and DBS bank importers.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <Link
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 text-white transition-colors hover:bg-blue-500 md:w-[158px]"
            href="/login"
          >
            Sign In
          </Link>
          <Link
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-blue-600 px-5 text-blue-600 transition-colors hover:bg-blue-50 md:w-[158px]"
            href="/register"
          >
            Register
          </Link>
        </div>
      </main>
    </div>
  );
}
