"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { getUser } from "@/lib/auth";
import { 
  FiDollarSign, 
  FiFileText, 
  FiCheckCircle, 
  FiClock, 
  FiPieChart, 
  FiTrendingUp,
  FiEyeOff,
  FiRefreshCw
} from "react-icons/fi";

type Reports = {
  totalClaims: number;
  paid: number;
  pending: number;
  totalAmount: number;
};

export default function Page() {
  const role = getUser()?.role;
  const canSeeBilling = role === "admin" || role === "billing";
  const [data, setData] = useState<Reports>({
    totalClaims: 0,
    paid: 0,
    pending: 0,
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    if (!canSeeBilling) {
      setLoading(false);
      return; // avoid 403 spam for provider/viewer
    }
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get(API.billing.reports);
        setData(response.data as Reports);
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (error) {
        console.error("Failed to fetch billing data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [canSeeBilling]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const refreshData = () => {
    if (!canSeeBilling) return;
    
    setLoading(true);
    api
      .get(API.billing.reports)
      .then((r) => {
        setData(r.data as Reports);
        setLastUpdated(new Date().toLocaleTimeString());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <FiPieChart className="text-blue-600" /> 
              Billing Overview
            </h1>
            <p className="text-gray-500 mt-2">
              Summary of claims and financial metrics
              {lastUpdated && canSeeBilling && (
                <span className="text-sm ml-3">Last updated: {lastUpdated}</span>
              )}
            </p>
          </div>
          
          {canSeeBilling && (
            <button
              onClick={refreshData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 mt-4 sm:mt-0 disabled:opacity-50"
            >
              <FiRefreshCw className={`${loading ? "animate-spin" : ""}`} />
              {loading ? "Refreshing..." : "Refresh Data"}
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Total Claims Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                  <FiFileText className="text-blue-500" /> Total Claims
                </div>
                <div className="text-3xl font-bold text-gray-800">
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    data.totalClaims.toLocaleString()
                  )}
                </div>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <FiFileText className="text-blue-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500">All time claims processed</div>
            </div>
          </div>

          {/* Paid Claims Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                  <FiCheckCircle className="text-green-500" /> Paid Claims
                </div>
                <div className="text-3xl font-bold text-gray-800">
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    data.paid.toLocaleString()
                  )}
                </div>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <FiCheckCircle className="text-green-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500">Successfully processed claims</div>
            </div>
          </div>

          {/* Pending Claims Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                  <FiClock className="text-amber-500" /> Pending Claims
                </div>
                <div className="text-3xl font-bold text-gray-800">
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    data.pending.toLocaleString()
                  )}
                </div>
              </div>
              <div className="bg-amber-100 p-2 rounded-lg">
                <FiClock className="text-amber-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500">Awaiting processing</div>
            </div>
          </div>

          {/* Total Amount Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                  <FiDollarSign className="text-purple-500" /> Total Amount
                </div>
                <div className="text-3xl font-bold text-gray-800">
                  {loading ? (
                    <div className="h-8 w-28 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    formatCurrency(data.totalAmount)
                  )}
                </div>
              </div>
              <div className="bg-purple-100 p-2 rounded-lg">
                <FiTrendingUp className="text-purple-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500">Total value of all claims</div>
            </div>
          </div>
        </div>

        {/* Access Message for Non-Billing Roles */}
        {!canSeeBilling && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 max-w-2xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 p-3 rounded-full">
                <FiEyeOff className="text-amber-600 text-2xl" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-amber-800">Limited Access</h3>
                <p className="text-amber-700 mt-2">
                  You're signed in as <span className="font-semibold bg-amber-100 px-2 py-1 rounded-md">{role}</span>. 
                  Billing metrics are hidden for this role. Contact an administrator if you need access to billing information.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Additional Visualizations (Placeholder) */}
        {canSeeBilling && !loading && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <FiTrendingUp className="text-blue-500" /> Claims Overview
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Simple bar chart visualization */}
              <div>
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>Claims Distribution</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-blue-600">Paid</span>
                      <span>{data.paid}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${data.totalClaims ? (data.paid / data.totalClaims) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-amber-600">Pending</span>
                      <span>{data.pending}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-400 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${data.totalClaims ? (data.pending / data.totalClaims) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Stats summary */}
              <div className="bg-gray-50 p-5 rounded-xl">
                <h3 className="font-medium text-gray-700 mb-4">Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Success Rate</span>
                    <span className="font-medium">
                      {data.totalClaims ? Math.round((data.paid / data.totalClaims) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Claim Value</span>
                    <span className="font-medium">
                      {data.totalClaims ? formatCurrency(data.totalAmount / data.totalClaims) : formatCurrency(0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending Ratio</span>
                    <span className="font-medium">
                      {data.totalClaims ? Math.round((data.pending / data.totalClaims) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}