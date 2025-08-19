"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Settings,
  User,
  Bell,
  Shield,
  CreditCard,
  Palette,
  Globe,
  Link2,
  Instagram,
  ShoppingBag,
  Key,
  Mail,
  Smartphone,
  ChevronRight,
  Save,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Moon,
  Sun,
  Monitor
} from "lucide-react";

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("account");
  const [darkMode, setDarkMode] = useState("auto");
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: false
  });
  const [saved, setSaved] = useState(false);

  const sections: SettingSection[] = [
    {
      id: "account",
      title: "Account",
      description: "Manage your profile and account details",
      icon: <User className="w-5 h-5" />,
      color: "from-blue-500 to-cyan-600"
    },
    {
      id: "instagram",
      title: "Instagram Integration",
      description: "Connect and manage Instagram accounts",
      icon: <Instagram className="w-5 h-5" />,
      color: "from-purple-500 to-pink-600"
    },
    {
      id: "shop",
      title: "Shop Settings",
      description: "Configure your shop and products",
      icon: <ShoppingBag className="w-5 h-5" />,
      color: "from-green-500 to-emerald-600"
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "Control how you receive updates",
      icon: <Bell className="w-5 h-5" />,
      color: "from-yellow-500 to-orange-600"
    },
    {
      id: "appearance",
      title: "Appearance",
      description: "Customize your dashboard theme",
      icon: <Palette className="w-5 h-5" />,
      color: "from-pink-500 to-red-500"
    },
    {
      id: "security",
      title: "Security",
      description: "Manage passwords and authentication",
      icon: <Shield className="w-5 h-5" />,
      color: "from-red-500 to-rose-600"
    },
    {
      id: "billing",
      title: "Billing",
      description: "Manage subscriptions and payments",
      icon: <CreditCard className="w-5 h-5" />,
      color: "from-indigo-500 to-purple-600"
    }
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "account":
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Profile Picture</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-full" />
                <div>
                  <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm">
                    Change Photo
                  </button>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max 5MB</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <input
                  type="text"
                  defaultValue="@creator"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <input
                  type="text"
                  defaultValue="Creator Name"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  defaultValue="creator@example.com"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  defaultValue="+1 (555) 123-4567"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                rows={4}
                defaultValue="Instagram creator focused on fashion and lifestyle content."
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none transition-colors resize-none"
              />
            </div>
          </div>
        );

      case "instagram":
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Instagram className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">Connected Account</h4>
                  <p className="text-sm text-gray-400">@minimall_shop</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Active</span>
                    <span className="text-xs text-gray-500">Connected 3 days ago</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group">
                <div className="flex items-center gap-3">
                  <Link2 className="w-5 h-5 text-gray-400" />
                  <span>Add Another Account</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              </button>

              <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-gray-400" />
                  <span>Refresh Access Token</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              </button>

              <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-gray-400" />
                  <span>Import Settings</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {Object.entries({
                email: { icon: <Mail className="w-5 h-5" />, label: "Email Notifications", desc: "Receive updates via email" },
                push: { icon: <Bell className="w-5 h-5" />, label: "Push Notifications", desc: "Browser push notifications" },
                sms: { icon: <Smartphone className="w-5 h-5" />, label: "SMS Alerts", desc: "Text message alerts" },
                marketing: { icon: <Sparkles className="w-5 h-5" />, label: "Marketing Updates", desc: "Product news and offers" }
              }).map(([key, config]) => (
                <div key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-gray-400">{config.icon}</div>
                    <div>
                      <p className="font-medium">{config.label}</p>
                      <p className="text-sm text-gray-400">{config.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      notifications[key as keyof typeof notifications] ? "bg-purple-600" : "bg-white/10"
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      notifications[key as keyof typeof notifications] ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">Theme Mode</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "light", icon: <Sun className="w-5 h-5" />, label: "Light" },
                  { value: "dark", icon: <Moon className="w-5 h-5" />, label: "Dark" },
                  { value: "auto", icon: <Monitor className="w-5 h-5" />, label: "Auto" }
                ].map(mode => (
                  <button
                    key={mode.value}
                    onClick={() => setDarkMode(mode.value)}
                    className={`p-4 rounded-lg border transition-all ${
                      darkMode === mode.value
                        ? "bg-purple-600/20 border-purple-500"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {mode.icon}
                      <span className="text-sm">{mode.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Accent Color</label>
              <div className="flex gap-3">
                {[
                  "bg-gradient-to-r from-purple-600 to-pink-600",
                  "bg-gradient-to-r from-blue-600 to-cyan-600",
                  "bg-gradient-to-r from-green-600 to-emerald-600",
                  "bg-gradient-to-r from-orange-600 to-red-600",
                  "bg-gradient-to-r from-indigo-600 to-purple-600"
                ].map((gradient, i) => (
                  <button
                    key={i}
                    className={`w-12 h-12 rounded-lg ${gradient} hover:scale-110 transition-transform`}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400">This section is coming soon</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account and preferences</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
              <div className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      activeSection === section.id
                        ? "bg-white/10 text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${section.color} ${
                      activeSection === section.id ? "opacity-100" : "opacity-50"
                    }`}>
                      {section.icon}
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{section.title}</p>
                      <p className="text-xs opacity-70">{section.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
            >
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">
                  {sections.find(s => s.id === activeSection)?.title}
                </h2>
                <p className="text-gray-400 text-sm">
                  {sections.find(s => s.id === activeSection)?.description}
                </p>
              </div>

              {renderSectionContent()}

              {["account", "instagram", "notifications", "appearance"].includes(activeSection) && (
                <div className="mt-8 flex items-center justify-between">
                  <div>
                    {saved && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-green-400"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm">Settings saved successfully</span>
                      </motion.div>
                    )}
                  </div>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}