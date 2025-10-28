// app/account/page.jsx

'use client';

import { useAppContext } from "@/context/AppContext";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Loading from "@/components/Loading";
import Link from "next/link";
import Image from "next/image";
import {
  FiChevronRight,
  FiStar,
  FiBell,
  FiCreditCard,
  FiInfo,
  FiCheckCircle,
  FiRefreshCw,
  FiUser,
  FiPackage,
  FiHeart,
  FiMapPin,
  FiLock,
} from "react-icons/fi";
import toast from "react-hot-toast";
import StarRating from "@/components/StarRating";
import { getSafeImageUrl } from "@/lib/utils";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput";
import MyReturns from "./MyReturns";

// ======================================================
// ACCOUNT DASHBOARD COMPONENT
// ======================================================
const AccountDashboard = () => {
  const { user, myOrders, currency } = useAppContext();
  const latestOrder = myOrders?.[0];

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Welcome, {user?.user_metadata?.full_name || user.email.split("@")[0]}!
      </h2>
      <p className="text-gray-500 mb-8">
        Manage your account details and track your orders from here.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Latest Order */}
        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-3">Latest Order</h3>
          {latestOrder ? (
            <div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-500">Order ID:</span>
                <span className="font-medium text-gray-800">
                  #{latestOrder.id.slice(0, 8)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-500">Date:</span>
                <span className="font-medium text-gray-800">
                  {new Date(latestOrder.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mb-4">
                <span className="text-gray-500">Total:</span>
                <span className="font-bold text-lg text-orange-600">
                  {currency}
                  {latestOrder.total_amount.toFixed(2)}
                </span>
              </div>
              <Link
                href="/account/my-orders"
                className="text-sm font-semibold text-orange-600 hover:underline flex items-center gap-1"
              >
                View All Orders <FiChevronRight />
              </Link>
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">
              You haven't placed any orders yet.
            </p>
          )}
        </div>

        {/* Quick Access */}
        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-3">Quick Access</h3>
          <div className="space-y-2">
            <Link
              href="/account/addresses"
              className="flex items-center justify-between text-sm text-gray-600 hover:text-orange-600 transition group"
            >
              <span>My Addresses</span>
              <FiChevronRight className="transform transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/account/wishlist"
              className="flex items-center justify-between text-sm text-gray-600 hover:text-orange-600 transition group"
            >
              <span>My Wishlist</span>
              <FiChevronRight className="transform transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/account?tab=password"
              className="flex items-center justify-between text-sm text-gray-600 hover:text-orange-600 transition group"
            >
              <span>Password Security</span>
              <FiChevronRight className="transform transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// ======================================================
// CHANGE PASSWORD COMPONENT
// ======================================================
const ChangePassword = () => {
  const { changeUserPassword } = useAppContext();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword)
      return toast.error("Please fill in all fields.");

    if (newPassword !== confirmPassword)
      return toast.error("New passwords do not match.");

    if (newPassword.length < 6)
      return toast.error("Password must be at least 6 characters.");

    setLoading(true);
    const success = await changeUserPassword(currentPassword, newPassword);
    if (success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Change Password
      </h2>
      <form onSubmit={handlePasswordUpdate} className="space-y-8 max-w-lg">
        <FloatingLabelInput
          id="currentPassword"
          name="currentPassword"
          type="password"
          label="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <FloatingLabelInput
          id="newPassword"
          name="newPassword"
          type="password"
          label="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <FloatingLabelInput
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="py-2 px-4 text-white bg-orange-600 rounded-md hover:bg-orange-700 focus:outline-none disabled:bg-orange-300"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
};

// ======================================================
// ADD CARD MODAL COMPONENT
// ======================================================
const AddCardModal = ({ onClose }) => {
  const { addSavedCard } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardName: "",
    expMonth: "",
    expYear: "",
    cvc: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCardData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (cardData.cardNumber.length < 16 || cardData.cvc.length < 3) {
      toast.error("Please enter valid card details.");
      setLoading(false);
      return;
    }

    const success = await addSavedCard(cardData);
    setLoading(false);
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-2xl">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center border-b pb-3 mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Add New Card</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800"
            >
              &times;
            </button>
          </div>

          <div className="space-y-8">
            <FloatingLabelInput
              id="cardNumber"
              name="cardNumber"
              label="Card Number"
              value={cardData.cardNumber}
              onChange={handleChange}
              required
            />
            <FloatingLabelInput
              id="cardName"
              name="cardName"
              label="Name on Card"
              value={cardData.cardName}
              onChange={handleChange}
              required
            />
            <div className="flex gap-4">
              <FloatingLabelInput
                id="expMonth"
                name="expMonth"
                label="Month (MM)"
                value={cardData.expMonth}
                onChange={handleChange}
                required
              />
              <FloatingLabelInput
                id="expYear"
                name="expYear"
                label="Year (YY)"
                value={cardData.expYear}
                onChange={handleChange}
                required
              />
              <FloatingLabelInput
                id="cvc"
                name="cvc"
                label="CVC"
                value={cardData.cvc}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-orange-400"
          >
            {loading ? "Saving..." : "Save Card"}
          </button>
        </form>
      </div>
    </div>
  );
};

// ======================================================
// SAVED CARDS COMPONENT
// ======================================================
const SavedCards = () => {
  const { savedCards, deleteSavedCard } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Saved Cards</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition shadow-md text-sm"
        >
          <FiCreditCard />
          <span>Add New Card</span>
        </button>
      </div>

      {savedCards.length > 0 ? (
        <div className="space-y-4">
          {savedCards.map((card) => (
            <div
              key={card.id}
              className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
            >
              <div className="flex items-center gap-4">
                <img
                  src={`/assets/visa.png`}
                  alt={card.card_brand}
                  className="w-10 h-auto"
                />
                <div>
                  <p className="font-semibold">**** **** **** {card.last4}</p>
                  <p className="text-sm text-gray-500">
                    Exp: {card.exp_month}/{card.exp_year}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to delete this card?"))
                    deleteSavedCard(card.id);
                }}
                className="text-sm text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg">
          <FiCreditCard className="mx-auto w-12 h-12 text-gray-400 mb-4" />
          <p>No saved cards yet.</p>
        </div>
      )}

      {isModalOpen && <AddCardModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

// ======================================================
// MY REVIEWS COMPONENT
// ======================================================
const MyReviews = () => {
  const { myReviews, authLoading } = useAppContext();

  if (authLoading) return <Loading />;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">My Reviews</h2>
      {myReviews.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg">
          <FiStar className="mx-auto w-12 h-12 text-gray-400 mb-4" />
          <p>You haven't reviewed any products yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {myReviews.map((review) => {
            const status = review.is_approved
              ? { text: "Approved and Published", color: "text-green-600 bg-green-100" }
              : { text: "Pending Approval", color: "text-yellow-600 bg-yellow-100" };

            return (
              <div key={review.id} className="border-b pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <Link href={`/product/${review.products.id}`}>
                      <div className="relative w-16 h-16 rounded-md overflow-hidden cursor-pointer bg-gray-100">
                        <Image
                          src={getSafeImageUrl(review.products.image_urls)}
                          alt={review.products.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </Link>
                    <div className="ml-4">
                      <Link href={`/product/${review.products.id}`}>
                        <p className="font-semibold text-gray-800 hover:text-orange-600 transition">
                          {review.products.name}
                        </p>
                      </Link>
                      <p className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${status.color}`}
                  >
                    {status.text}
                  </span>
                </div>
                <div className="mt-3 pl-20">
                  <StarRating rating={review.rating} />
                  <p className="text-gray-700 mt-2">{review.comment}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ======================================================
// NOTIFICATION PREFERENCES COMPONENT
// ======================================================
const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState({
    campaigns: true,
    orderStatus: true,
    specialOffers: false,
  });
  const [loading, setLoading] = useState(false);

  const handleToggle = (key) =>
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = () => {
    setLoading(true);
    toast
      .promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
        loading: "Saving...",
        success: "Preferences updated!",
        error: "An error occurred.",
      })
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Notification and Communication Preferences
      </h2>
      <div className="space-y-4 max-w-lg">
        {/* Campaign Emails */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
          <label className="font-medium text-gray-700">
            Promotional and Discount Emails
          </label>
          <button
            onClick={() => handleToggle("campaigns")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.campaigns ? "bg-orange-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.campaigns ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Order Status Notifications */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
          <label className="font-medium text-gray-700">
            Order Status Notifications
          </label>
          <button
            onClick={() => handleToggle("orderStatus")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.orderStatus ? "bg-orange-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.orderStatus ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Personalized Offers */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
          <label className="font-medium text-gray-700">
            Personalized Offers
          </label>
          <button
            onClick={() => handleToggle("specialOffers")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.specialOffers ? "bg-orange-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.specialOffers ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="py-2 px-4 mt-4 text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:bg-orange-300"
        >
          {loading ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
};

// ======================================================
// MAIN CONTENT CONTROLLER
// ======================================================
const AccountPageContent = () => {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";

  const renderContent = () => {
    switch (activeTab) {
      case "password":
        return <ChangePassword />;
      case "reviews":
        return <MyReviews />;
      case "notifications":
        return <NotificationPreferences />;
      case "saved-cards":
        return <SavedCards />;
      case "returns":
        return <MyReturns />;
      case "dashboard":
      default:
        return <AccountDashboard />;
    }
  };

  return <>{renderContent()}</>;
};

// ======================================================
// MAIN ACCOUNT PAGE
// ======================================================
const AccountPage = () => (
  <Suspense fallback={<Loading />}>
    <AccountPageContent />
  </Suspense>
);

export default AccountPage;
