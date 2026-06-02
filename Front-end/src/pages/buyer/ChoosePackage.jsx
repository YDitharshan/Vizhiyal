// ChoosePackage — side-by-side package comparison (Basic / Standard / Premium)
// User selects a tier then proceeds to Booking

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, X, ChevronLeft, Clock, Loader2 } from "lucide-react";
import { vendorApi } from "../../services/vendorApi";
import { adaptVendor } from "../../utils/adapters";

const tierColor = {
  Basic:    { border: "border-gray-200",  badge: "bg-gray-100 text-gray-600",   btn: "bg-gray-700 hover:bg-gray-800 text-white"    },
  Standard: { border: "border-primary",   badge: "bg-primary text-white",        btn: "bg-primary hover:bg-primary-dark text-white" },
  Premium:  { border: "border-secondary", badge: "bg-secondary text-white",      btn: "bg-secondary hover:bg-secondary-dark text-white" },
};

function buildPackages(g) {
  return [
    { name: "Basic",    price: g.basicPrice    || 0, description: g.basicDescription    || "", features: Array.isArray(g.basicFeatures)    ? g.basicFeatures    : [], popular: false },
    { name: "Standard", price: g.standardPrice || 0, description: g.standardDescription || "", features: Array.isArray(g.standardFeatures) ? g.standardFeatures : [], popular: true  },
    { name: "Premium",  price: g.premiumPrice  || 0, description: g.premiumDescription  || "", features: Array.isArray(g.premiumFeatures)  ? g.premiumFeatures  : [], popular: false },
  ].filter(p => p.price > 0);
}

export default function ChoosePackage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [vendor,   setVendor]   = useState(null);
  const [packages, setPackages] = useState([]);
  const [deliveryDays, setDeliveryDays] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    vendorApi.getById(id)
      .then(res => {
        const v    = res.data?.vendor ?? res.data;
        const gig  = v.gigs?.[0] ?? v;
        setVendor(adaptVendor(v));
        setPackages(buildPackages(gig));
        setDeliveryDays(gig.deliveryDays ?? null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-gray-500">
        <p className="font-semibold">Vendor not found</p>
        <button onClick={() => navigate("/search")} className="mt-2 text-primary text-sm hover:underline">Back to search</button>
      </div>
    );
  }

  // Build a union of all feature names across packages for comparison table
  const allFeatures = [...new Set(packages.flatMap(p => p.features))];

  const handleContinue = () => {
    if (!selected) return;
    navigate(`/vendor/${id}/book`, { state: { package: selected } });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* Header */}
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-primary flex items-center gap-1 mb-4">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Choose a Package</h1>
        <p className="text-sm text-gray-500 mt-1">{vendor.name} · {vendor.category}</p>
      </div>

      {/* Package cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {packages.map(pkg => {
          const colors     = tierColor[pkg.name] || tierColor.Basic;
          const isSelected = selected?.name === pkg.name;

          return (
            <div
              key={pkg.name}
              onClick={() => setSelected(pkg)}
              className={`relative bg-white rounded-2xl border-2 shadow-sm p-5 cursor-pointer transition-all ${
                isSelected ? "border-primary ring-2 ring-primary/20 scale-[1.02]" : colors.border + " hover:border-primary/50"
              }`}
            >
              {/* Popular badge */}
              {pkg.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-semibold px-3 py-0.5 rounded-full">
                  Most Popular
                </span>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}

              <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3 ${colors.badge}`}>
                {pkg.name}
              </span>

              <p className="text-2xl font-bold text-gray-800 mb-0.5">
                LKR {pkg.price.toLocaleString()}
              </p>
              {pkg.description && <p className="text-xs text-gray-500 mb-3">{pkg.description}</p>}

              <ul className="space-y-2">
                {pkg.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {deliveryDays && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 inline mr-1" /> Delivery in {deliveryDays} days
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Comparison table */}
      {allFeatures.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Feature Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-5 py-3 text-gray-500 font-medium w-1/2">Feature</th>
                  {packages.map(p => (
                    <th key={p.name} className="text-center px-3 py-3 text-gray-700 font-semibold">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allFeatures.map(feature => (
                  <tr key={feature} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-gray-600">{feature}</td>
                    {packages.map(p => (
                      <td key={p.name} className="px-3 py-3 text-center">
                        {p.features.includes(feature)
                          ? <CheckCircle className="w-4 h-4 text-accent mx-auto" />
                          : <X className="w-4 h-4 text-gray-200 mx-auto" />
                        }
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td className="px-5 py-3 text-gray-500 font-medium">Price</td>
                  {packages.map(p => (
                    <td key={p.name} className="px-3 py-3 text-center font-bold text-primary">
                      LKR {p.price.toLocaleString()}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sticky CTA */}
      <div className="sticky bottom-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-4 flex items-center gap-4">
          <div className="flex-1">
            {selected ? (
              <>
                <p className="text-xs text-gray-400">Selected</p>
                <p className="font-semibold text-gray-800">{selected.name} · <span className="text-primary">LKR {selected.price.toLocaleString()}</span></p>
              </>
            ) : (
              <p className="text-sm text-gray-400">Select a package above to continue</p>
            )}
          </div>
          <button
            onClick={handleContinue}
            disabled={!selected}
            className="bg-primary text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue to Book
          </button>
        </div>
      </div>
    </div>
  );
}
