export function inferJobSource(link: string) {
  try {
    const host = new URL(link).hostname.replace(/^www\./, "").toLowerCase();

    if (host.includes("linkedin.com")) return "LinkedIn";
    if (host.includes("jobstreet.co.id")) return "JobStreet";
    if (host.includes("glints.com")) return "Glints";
    if (host.includes("upwork.com")) return "Upwork";
    if (host.includes("remoteok.com")) return "RemoteOK";
    if (host.includes("weworkremotely.com")) return "WeWorkRemotely";
    if (host.includes("google.com")) return "Google";

    return host;
  } catch {
    return "Manual";
  }
}
