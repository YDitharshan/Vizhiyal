// BuyerLayout — wraps all buyer (customer) inner pages with the shared Navbar
import Navbar from "../components/buyer/Navbar";

export default function BuyerLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
