export default function MainFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-white mt-auto">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-400">
            &copy; {currentYear} Stock Whale Radar. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
