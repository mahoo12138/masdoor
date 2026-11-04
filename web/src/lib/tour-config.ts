import * as Setting from "@/lib/setting";

export interface TourStep {
  title: string;
  description: string;
  /** id of the element to highlight; the first step highlights the page's table */
  id?: string;
  coverUrl?: string;
  nextButtonText?: string;
}

/**
 * The product tour, ported from web/src/TourConfig.js. The step texts, the page
 * order and the "isTourVisible" localStorage key are unchanged, so the tour
 * picks up where it left off across the two frontends.
 */
export const TourObj: Record<string, TourStep[]> = {
  home: [
    {
      title: "Welcome to masdoor",
      description: "This tour walks through the pages you need for a single-organization setup.",
      coverUrl: `${Setting.StaticBaseUrl}/img/masdoor-logo.png`,
    },
    {
      title: "Statistic cards",
      description: "Here are four statistic cards for user information.",
      id: "statistic",
    },
    {
      title: "Statistic charts",
      description: "The charts visualize sign-in activity and user distribution across your organizations.",
      id: "echarts-chart",
    },
  ],
  webhooks: [
    {
      title: "Webhook List",
      description: "Event systems allow you to build integrations, which subscribe to certain events on Masdoor. When one of those event is triggered, we'll send a POST json payload to the configured URL. The application parsed the json payload and carry out the hooked function. Events consist of signup, login, logout, update users, which are stored in the action field of the record. Event systems can be used to update an external issue from users.",
    },
  ],
  sysinfo: [
    {
      title: "CPU Usage",
      description: "You can see the CPU usage in real time.",
      id: "cpu-card",
    },
    {
      title: "Memory Usage",
      description: "You can see the Memory usage in real time.",
      id: "memory-card",
    },
    {
      title: "API Latency",
      description: "You can see the usage statistics of each API latency in real time.",
      id: "latency-card",
    },
    {
      title: "API Throughput",
      description: "You can see the usage statistics of each API throughput in real time.",
      id: "throughput-card",
    },
    {
      title: "About Masdoor",
      description: "You can get more Masdoor information in this card.",
      id: "about-card",
    },
  ],
  sessions: [
    {
      title: "Session List",
      description: "You can get Session ID in this list.",
    },
  ],
  tokens: [
    {
      title: "Token List",
      description: "Masdoor is based on OAuth. Tokens are users' OAuth token.You can get access token in this list.",
    },
  ],
  roles: [
    {
      title: "Role List",
      description: "Each user may have multiple roles. You can see the user's roles on the user's profile.",
    },
  ],
  resources: [
    {
      title: "Resource List",
      description: "You can upload resources in masdoor. Before upload resources, you need to configure a storage provider. Please see Storage Provider.",
    },
    {
      title: "Upload Resource",
      description: "Users can upload resources such as files and images to the previously configured cloud storage.",
      id: "upload-button",
    },
  ],
  providers: [
    {
      title: "Provider List",
      description: "Providers fall into a few kinds: OAuth, Email, Storage, Notification, Captcha and Face ID.",
    },
    {
      title: "Provider Add",
      description: "You must add the provider to application, then you can use the provider in your application",
      id: "add-button",
    },
  ],
  organizations: [
    {
      title: "Organization List",
      description: "Organization is the basic unit of Masdoor, which manages users and applications. If a user signed in to an organization, then he can access all applications belonging to the organization without signing in again.",
    },
  ],
  groups: [
    {
      title: "Group List",
      description: "In the groups list pages, you can see all the groups in organizations.",
    },
  ],
  users: [
    {
      title: "User List",
      description: "As an authentication platform, Masdoor is able to manage users.",
    },
  ],
  applications: [
    {
      title: "Application List",
      description: "If you want to use Masdoor to provide login service for your web Web APPs, you can add them as Masdoor applications. Users can access all applications in their organizations without login twice.",
    },
  ],
};

export const TourUrlList = ["home", "organizations", "groups", "users", "applications", "providers", "resources", "roles", "tokens", "sessions", "sysinfo", "webhooks"];

export function getNextUrl(pathName = Setting.getRoutePath()) {
  return TourUrlList[TourUrlList.indexOf(pathName.replace("/", "")) + 1] || "";
}

let orgIsTourVisible = true;

export function setOrgIsTourVisible(visible: boolean) {
  orgIsTourVisible = visible;
  if (orgIsTourVisible === false) {
    setIsTourVisible(false);
  }
}

export function setIsTourVisible(visible: boolean) {
  localStorage.setItem("isTourVisible", String(visible));
  window.dispatchEvent(new Event("storageTourChanged"));
}

export function setTourLogo(tourLogoSrc: string) {
  if (tourLogoSrc !== "") {
    TourObj["home"][0]["coverUrl"] = tourLogoSrc;
  }
}

export function getTourVisible() {
  return localStorage.getItem("isTourVisible") !== "false";
}

export function getNextButtonChild(nextPathName: string) {
  return nextPathName !== ""
    ? `Go to "${nextPathName.charAt(0).toUpperCase()}${nextPathName.slice(1)} List"`
    : "Finish";
}

/** The steps for the page currently open, empty when the page has no tour. */
export function getSteps(pathName = Setting.getRoutePath()): TourStep[] {
  return TourObj[pathName.replace("/", "")] ?? [];
}

/** Whether the page currently open has a tour at all. */
export function canTour(pathName = Setting.getRoutePath()) {
  const path = pathName.replace("/", "");
  return path === "" || TourUrlList.indexOf(path) !== -1;
}
