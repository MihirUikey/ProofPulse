import "./Sidebar.css";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Target,
  Send,
  UserRound,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Activity,
  Compass,
  Lightbulb,
  FileText,
  MessageSquare,
  User,
  BadgeCheck,
  ClipboardList,
  PlusCircle,
  ClipboardCheck,
  Menu,
  X,
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    children: [
      { label: "Overview", id: "overview", icon: LayoutDashboard },
      { label: "Activity & Streaks", id: "activity", icon: Activity },
    ],
  },
  {
    title: "Challenges",
    icon: Target,
    children: [
      { label: "Explore Challenges", id: "challenges", icon: Compass },
      {
        label: "Request a Challenge",
        id: "request-challenge",
        icon: Lightbulb,
      },
    ],
  },
  {
    title: "Submissions",
    icon: Send,
    children: [
      { label: "My Submissions", id: "submissions", icon: FileText },
      { label: "Review Feedback", id: "feedback", icon: MessageSquare },
    ],
  },
  {
    title: "Developer Profile",
    icon: UserRound,
    children: [
      { label: "My Profile", id: "profile", icon: User },
      { label: "Skills & Evidence", id: "skills", icon: BadgeCheck },
    ],
  },
];

const adminItem = {
  title: "Administration",
  icon: Settings,
  children: [
    { label: "Manage Challenges", id: "admin-challenges", icon: ClipboardList },
    { label: "Review Requests", id: "admin-requests", icon: PlusCircle },
    {
      label: "Review Submissions",
      id: "admin-submissions",
      icon: ClipboardCheck,
    },
  ],
};

export default function Sidebar({
  activeView,
  onNavigate,
  isAdmin = false,
  isAuthenticated = false,
  onCollapseChange,
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    onCollapseChange?.(collapsed);
  }, [collapsed, onCollapseChange]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState("Challenges");

  const items = [...menuItems, ...(isAdmin ? [adminItem] : [])]
    .map((item) => ({
      ...item,
      children: item.children.filter((child) => {
        if (child.id === "request-challenge") {
          return isAuthenticated && !isAdmin;
        }

        const sharedViews = [
          "overview",
          "activity",
          "challenges",
          "submissions",
          "feedback",
          "profile",
          "skills",
        ];
        const adminViews = [
          "admin-challenges",
          "admin-requests",
          "admin-submissions",
        ];

        return (
          sharedViews.includes(child.id) ||
          (isAdmin && adminViews.includes(child.id))
        );
      }),
    }))
    .filter((item) => item.children.length > 0);

  function navigate(id) {
    onNavigate(id);
    setMobileOpen(false);
  }

  return (
    <>
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`sidebar ${collapsed ? "sidebar-collapsed" : ""} ${
          mobileOpen ? "sidebar-mobile-open" : ""
        }`}
      >
        <div className="sidebar-brand">
          <div className="sidebar-logo">P</div>

          {!collapsed && (
            <div className="sidebar-brand-text">
              <strong>ProofPulse</strong>
              <span>Developer Platform</span>
            </div>
          )}

          <button
            className="sidebar-collapse-button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <div className="sidebar-section-label">{!collapsed && "WORKSPACE"}</div>

        <nav className="sidebar-navigation">
          {items.map((item) => {
            const ItemIcon = item.icon;
            const isExpanded = expandedMenu === item.title;
            const containsActiveItem = item.children.some(
              (child) => child.id === activeView,
            );

            return (
              <div className="sidebar-group" key={item.title}>
                <button
                  className={`sidebar-parent ${
                    containsActiveItem ? "sidebar-parent-active" : ""
                  }`}
                  title={collapsed ? item.title : undefined}
                  onClick={() => {
                    if (collapsed) {
                      setCollapsed(false);
                      setExpandedMenu(item.title);
                      return;
                    }

                    setExpandedMenu(isExpanded ? "" : item.title);
                  }}
                >
                  <ItemIcon size={19} />

                  {!collapsed && (
                    <>
                      <span>{item.title}</span>
                      <ChevronDown
                        className={`sidebar-chevron ${
                          isExpanded ? "sidebar-chevron-open" : ""
                        }`}
                        size={16}
                      />
                    </>
                  )}
                </button>

                {!collapsed && isExpanded && (
                  <div className="sidebar-children">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;

                      return (
                        <button
                          key={child.id}
                          className={`sidebar-child ${
                            activeView === child.id
                              ? "sidebar-child-active"
                              : ""
                          }`}
                          onClick={() => navigate(child.id)}
                        >
                          <ChildIcon size={16} />
                          <span>{child.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {!collapsed && (
            <>
              <div className="sidebar-footer-icon">
                <Activity size={19} />
              </div>
              <div>
                <strong>Keep building.</strong>
                <span>Your skills, proven.</span>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
